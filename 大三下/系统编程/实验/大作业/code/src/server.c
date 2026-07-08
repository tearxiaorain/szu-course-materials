/* ================================================================
 * server.c —— 即时聊天系统服务器（守护进程）
 *
 * 架构：
 *   守护进程 -> 读取配置 -> 创建公共FIFO -> 构建线程池
 *   -> epoll 主循环监听4个公共管道 -> 分派线程处理请求
 *
 * 线程池：LIFO空闲栈，100线程
 * I/O复用：epoll
 * 用户库：全局数组 + pthread_mutex_t 保护
 * ================================================================ */

#include "common.h"
#include "config.h"
#include "logger.h"
#include "thread_pool.h"
#include "protocol.h"

/* ================================================================
 * 全局变量
 * ================================================================ */
static thread_pool_t g_pool;

/* 用户数据库 */
typedef struct {
    user_t          users[MAX_USERS];
    int             user_count;
    offline_queue_t offline_queues[MAX_USERS];
    pthread_mutex_t mutex;
} user_database_t;

static user_database_t *g_db;

/* FIFO 文件描述符 */
static int g_fd_reg    = -1;
static int g_fd_login  = -1;
static int g_fd_msg    = -1;
static int g_fd_logout = -1;

/* 完整 FIFO 路径（运行时构建） */
static char g_reg_fifo_path[512];
static char g_login_fifo_path[512];
static char g_msg_fifo_path[512];
static char g_logout_fifo_path[512];

/* ================================================================
 * 前向声明
 * ================================================================ */
static void daemon_init(void);
static void create_public_fifos(void);
static void init_user_database(void);
static void main_event_loop(void);
static void *handle_request(void *arg);
static void handle_register(request_t *req);
static void handle_login(request_t *req);
static void handle_message(request_t *req);
static void handle_logout(request_t *req);
static int  find_user(const char *username);
static void send_response(const char *priv_fifo, response_t *resp);
static void broadcast_to_online(response_t *resp, const char *exclude_user);
static void push_offline_msg(int user_idx, request_t *req);
static int  pop_offline_msgs(int user_idx, offline_msg_t *out_msgs, int max);

/* 去掉 ctime() 自带的换行，保持日志整洁 */
static const char *ctime_no_nl(time_t *t) {
    static char buf[64];
    char *s = ctime(t);
    if (s) {
        strncpy(buf, s, sizeof(buf) - 1);
        size_t len = strlen(buf);
        while (len > 0 && buf[len - 1] == '\n') buf[--len] = '\0';
    }
    return buf;
}

/* ================================================================
 * daemon_init —— 守护进程初始化（双fork）
 * ================================================================ */
static void daemon_init(void)
{
    pid_t pid = fork();
    if (pid > 0) exit(EXIT_SUCCESS);  /* 父进程退出 */
    if (pid < 0) exit(EXIT_FAILURE);

    /* 创建新会话，脱离终端 */
    if (setsid() < 0) exit(EXIT_FAILURE);

    /* 第二次 fork，确保不是会话领导者，防止重新获取终端 */
    pid = fork();
    if (pid > 0) exit(EXIT_SUCCESS);
    if (pid < 0) exit(EXIT_FAILURE);

    /* 工作目录设为根 */
    chdir("/");

    /* 重置文件创建掩码 */
    umask(0);

    /* 关闭标准 IO，重定向到 /dev/null */
    close(STDIN_FILENO);
    close(STDOUT_FILENO);
    close(STDERR_FILENO);
    open("/dev/null", O_RDONLY);
    open("/dev/null", O_WRONLY);
    open("/dev/null", O_WRONLY);

    /* 忽略 SIGHUP（终端关闭时不会杀死守护进程） */
    signal(SIGHUP, SIG_IGN);
    signal(SIGPIPE, SIG_IGN);
}

/* ================================================================
 * create_public_fifos —— 创建4个公共命名管道
 * ================================================================ */
static void create_public_fifos(void)
{
    /* 构建完整路径 */
    snprintf(g_reg_fifo_path,    sizeof(g_reg_fifo_path),    "%s/%s",
             g_config.fifo_dir, REG_FIFO_NAME);
    snprintf(g_login_fifo_path,  sizeof(g_login_fifo_path),  "%s/%s",
             g_config.fifo_dir, LOGIN_FIFO_NAME);
    snprintf(g_msg_fifo_path,    sizeof(g_msg_fifo_path),    "%s/%s",
             g_config.fifo_dir, MSG_FIFO_NAME);
    snprintf(g_logout_fifo_path, sizeof(g_logout_fifo_path), "%s/%s",
             g_config.fifo_dir, LOGOUT_FIFO_NAME);

    /* 先删除旧 FIFO（如果存在），再创建 */
    unlink(g_reg_fifo_path);
    unlink(g_login_fifo_path);
    unlink(g_msg_fifo_path);
    unlink(g_logout_fifo_path);

    if (mkfifo(g_reg_fifo_path,    0666) < 0)
        log_write("REG_FIFO create failed: %s", strerror(errno));
    if (mkfifo(g_login_fifo_path,  0666) < 0)
        log_write("LOGIN_FIFO create failed: %s", strerror(errno));
    if (mkfifo(g_msg_fifo_path,    0666) < 0)
        log_write("MSG_FIFO create failed: %s", strerror(errno));
    if (mkfifo(g_logout_fifo_path, 0666) < 0)
        log_write("LOGOUT_FIFO create failed: %s", strerror(errno));

    log_write("4 public FIFOs created at %s/", g_config.fifo_dir);
}

/* ================================================================
 * init_user_database —— 初始化用户信息库
 * ================================================================ */
static void init_user_database(void)
{
    g_db = (user_database_t *)malloc(sizeof(user_database_t));
    if (!g_db) {
        log_write("user database malloc failed");
        exit(EXIT_FAILURE);
    }

    memset(g_db->users, 0, sizeof(g_db->users));
    g_db->user_count = 0;

    for (int i = 0; i < MAX_USERS; i++) {
        g_db->offline_queues[i].head  = 0;
        g_db->offline_queues[i].tail  = 0;
        g_db->offline_queues[i].count = 0;
    }

    pthread_mutex_init(&g_db->mutex, NULL);
    log_write("user database initialized");
}

/* ================================================================
 * find_user —— 按用户名查找用户索引，未找到返回 -1
 * ================================================================ */
static int find_user(const char *username)
{
    for (int i = 0; i < g_db->user_count; i++) {
        if (strcmp(g_db->users[i].username, username) == 0) {
            return i;
        }
    }
    return -1;
}

/* ================================================================
 * send_response —— 通过私有管道发送响应给指定客户端
 * ================================================================ */
static void send_response(const char *priv_fifo, response_t *resp)
{
    /* 先尝试非阻塞打开（大多数情况客户端已就绪） */
    int fd = open(priv_fifo, O_WRONLY | O_NONBLOCK);
    if (fd < 0) {
        /* 非阻塞失败（无读者），尝试阻塞打开 */
        fd = open(priv_fifo, O_WRONLY);
        if (fd < 0) {
            log_write("open private fifo failed %s: %s", priv_fifo, strerror(errno));
            return;
        }
    }

    ssize_t n = write(fd, resp, sizeof(response_t));
    if (n != sizeof(response_t)) {
        log_write("write private fifo failed %s: %zd/%zu", priv_fifo, n, sizeof(response_t));
    }
    close(fd);
}

/* ================================================================
 * broadcast_to_online —— 向所有在线用户广播消息
 * ================================================================ */
static void broadcast_to_online(response_t *resp, const char *exclude_user)
{
    for (int i = 0; i < g_db->user_count; i++) {
        if (g_db->users[i].online &&
            (!exclude_user || strcmp(g_db->users[i].username, exclude_user) != 0)) {
            send_response(g_db->users[i].priv_fifo_name, resp);
        }
    }
}

/* ================================================================
 * push_offline_msg —— 将离线消息存入循环队列
 * ================================================================ */
static void push_offline_msg(int user_idx, request_t *req)
{
    offline_queue_t *q = &g_db->offline_queues[user_idx];

    offline_msg_t *msg = &q->messages[q->tail];
    strncpy(msg->sender,   req->sender,   MAX_NAME_LEN - 1);
    strncpy(msg->receiver, req->receiver, MAX_NAME_LEN - 1);
    strncpy(msg->content,  req->content,  MAX_MSG_LEN - 1);
    msg->timestamp = req->timestamp;

    q->tail = (q->tail + 1) % OFFLINE_MSG_MAX;
    if (q->count < OFFLINE_MSG_MAX) {
        q->count++;
    } else {
        /* 队列满，覆盖最旧的消息 */
        q->head = (q->head + 1) % OFFLINE_MSG_MAX;
    }
}

/* ================================================================
 * pop_offline_msgs —— 取出并清空某用户的离线消息
 * ================================================================ */
static int pop_offline_msgs(int user_idx, offline_msg_t *out_msgs, int max)
{
    offline_queue_t *q = &g_db->offline_queues[user_idx];
    int count = q->count;
    if (count > max) count = max;

    for (int i = 0; i < count; i++) {
        int idx = (q->head + i) % OFFLINE_MSG_MAX;
        memcpy(&out_msgs[i], &q->messages[idx], sizeof(offline_msg_t));
    }

    /* 清空队列 */
    q->head  = 0;
    q->tail  = 0;
    q->count = 0;

    return count;
}

/* ================================================================
 * handle_register —— 处理注册请求
 * ================================================================ */
static void handle_register(request_t *req)
{
    response_t resp;
    memset(&resp, 0, sizeof(resp));

    char priv_fifo_path[512];
    snprintf(priv_fifo_path, sizeof(priv_fifo_path), "%s/%s_fifo",
             g_config.fifo_dir, req->sender);

    pthread_mutex_lock(&g_db->mutex);

    /* 检查用户名是否已存在 */
    if (find_user(req->sender) >= 0) {
        resp.success = 0;
        snprintf(resp.message, MAX_MSG_LEN,
                 "reg failed: username '%s' already exists", req->sender);
        log_write("(%s, reg, %s) - failed: duplicate username",
                  req->sender, ctime_no_nl(&req->timestamp));
        pthread_mutex_unlock(&g_db->mutex);
        send_response(priv_fifo_path, &resp);
        return;
    }

    /* 检查用户名合法性 */
    if (strlen(req->sender) == 0 || strlen(req->sender) >= MAX_NAME_LEN) {
        resp.success = 0;
        snprintf(resp.message, MAX_MSG_LEN, "reg failed: invalid username");
        pthread_mutex_unlock(&g_db->mutex);
        send_response(priv_fifo_path, &resp);
        return;
    }

    /* 检查用户数上限 */
    if (g_db->user_count >= MAX_USERS) {
        resp.success = 0;
        snprintf(resp.message, MAX_MSG_LEN,
                 "reg failed: max users %d reached", MAX_USERS);
        pthread_mutex_unlock(&g_db->mutex);
        send_response(priv_fifo_path, &resp);
        return;
    }

    /* 创建新用户 */
    int idx = g_db->user_count++;
    user_t *u = &g_db->users[idx];
    strncpy(u->username,   req->sender,   MAX_NAME_LEN - 1);
    strncpy(u->password,   req->password, MAX_PASS_LEN - 1);
    u->online    = 0;
    u->user_index = idx;
    snprintf(u->priv_fifo_name, sizeof(u->priv_fifo_name), "%s/%s_fifo",
             g_config.fifo_dir, req->sender);
    memset(u->friend_msg_count, 0, sizeof(u->friend_msg_count));

    /* 私有管道由客户端/机器人在发送注册请求前自行创建 */

    resp.success = 1;
    snprintf(resp.message, MAX_MSG_LEN, "reg OK! Welcome %s", req->sender);

    log_write("(%s, reg, %s) - success",
              req->sender, ctime_no_nl(&req->timestamp));

    pthread_mutex_unlock(&g_db->mutex);
    send_response(priv_fifo_path, &resp);
}

/* ================================================================
 * handle_login —— 处理登录请求
 * ================================================================ */
static void handle_login(request_t *req)
{
    response_t resp;
    memset(&resp, 0, sizeof(resp));

    char priv_fifo_path[512];
    snprintf(priv_fifo_path, sizeof(priv_fifo_path), "%s/%s_fifo",
             g_config.fifo_dir, req->sender);

    pthread_mutex_lock(&g_db->mutex);

    int idx = find_user(req->sender);
    if (idx < 0) {
        resp.success = 0;
        snprintf(resp.message, MAX_MSG_LEN,
                 "login failed: user '%s' not found, please reg first", req->sender);
        log_write("(%s, login, %s) - failed: user not found",
                  req->sender, ctime_no_nl(&req->timestamp)); 
        pthread_mutex_unlock(&g_db->mutex);
        send_response(priv_fifo_path, &resp);
        return;
    }

    user_t *u = &g_db->users[idx];

    /* 验证密码 */
    if (strcmp(u->password, req->password) != 0) {
        resp.success = 0;
        snprintf(resp.message, MAX_MSG_LEN, "login failed: wrong password");
        log_write("(%s, login, %s) - failed: wrong password",
                  req->sender, ctime_no_nl(&req->timestamp));
        pthread_mutex_unlock(&g_db->mutex);
        send_response(priv_fifo_path, &resp);
        return;
    }

    /* 检查是否已在线 */
    if (u->online) {
        resp.success = 0;
        snprintf(resp.message, MAX_MSG_LEN,
                 "login failed: user '%s' is already online", req->sender);
        pthread_mutex_unlock(&g_db->mutex);
        send_response(priv_fifo_path, &resp);
        return;
    }

    /* 设置在线 */
    u->online = 1;

    /* 构建在线用户列表（受 RESP_MAX_USERS 限制防止越界） */
    resp.online_count = 0;
    for (int i = 0; i < g_db->user_count && resp.online_count < RESP_MAX_USERS; i++) {
        if (g_db->users[i].online) {
            strncpy(resp.online_users[resp.online_count],
                    g_db->users[i].username, MAX_NAME_LEN - 1);
            resp.online_count++;
        }
    }

    /* 取出离线消息（受 RESP_MAX_OFFLINE 限制） */
    resp.offline_count = pop_offline_msgs(idx, resp.offline_messages, RESP_MAX_OFFLINE);
    if (resp.offline_count > 0) {
        log_write("(%s, login, %s) - pushing %d offline msgs",
                  req->sender, ctime_no_nl(&req->timestamp), resp.offline_count);
    }

    resp.success = 1;
    snprintf(resp.message, MAX_MSG_LEN,
             "login OK! %d user(s) online", resp.online_count);

    log_write("(%s, login, %s) - success, %d online",
              req->sender, ctime_no_nl(&req->timestamp), resp.online_count);

    pthread_mutex_unlock(&g_db->mutex);

    /* 发送登录响应 */
    send_response(priv_fifo_path, &resp);

    /* 通知其他在线用户 */
    pthread_mutex_lock(&g_db->mutex);
    response_t broadcast;
    memset(&broadcast, 0, sizeof(broadcast));
    broadcast.success = 1;
    snprintf(broadcast.message, MAX_MSG_LEN,
             "[SYSTEM] %s is now online", req->sender);
    broadcast.online_count = resp.online_count;
    memcpy(broadcast.online_users, resp.online_users,
           sizeof(resp.online_users));
    broadcast_to_online(&broadcast, req->sender);
    pthread_mutex_unlock(&g_db->mutex);

    /* 推送离线消息日志 */
    pthread_mutex_lock(&g_db->mutex);
    for (int i = 0; i < resp.offline_count; i++) {
        log_write("(%s, %s, %s, sent)",
                  resp.offline_messages[i].sender,
                  resp.offline_messages[i].receiver,
                  ctime_no_nl(&resp.offline_messages[i].timestamp));
    }
    pthread_mutex_unlock(&g_db->mutex);
}

/* ================================================================
 * handle_message —— 处理消息发送
 * ================================================================ */
static void handle_message(request_t *req)
{
    response_t resp;
    memset(&resp, 0, sizeof(resp));

    pthread_mutex_lock(&g_db->mutex);

    int sender_idx   = find_user(req->sender);
    int receiver_idx = find_user(req->receiver);

    if (sender_idx < 0) {
        resp.success = 0;
        snprintf(resp.message, MAX_MSG_LEN, "send failed: sender does not exist");
        pthread_mutex_unlock(&g_db->mutex);
        char priv[512];
        snprintf(priv, sizeof(priv), "%s/%s_fifo", g_config.fifo_dir, req->sender);
        send_response(priv, &resp);
        return;
    }

    if (receiver_idx < 0) {
        resp.success = 0;
        snprintf(resp.message, MAX_MSG_LEN,
                 "send failed: receiver '%s' does not exist", req->receiver);
        pthread_mutex_unlock(&g_db->mutex);
        char priv[512];
        snprintf(priv, sizeof(priv), "%s/%s_fifo", g_config.fifo_dir, req->sender);
        send_response(priv, &resp);
        return;
    }

    /* 更新消息计数 */
    g_db->users[sender_idx].friend_msg_count[receiver_idx]++;

    if (g_db->users[receiver_idx].online) {
        /* 接收者在线：直接转发 */
        response_t fwd;
        memset(&fwd, 0, sizeof(fwd));
        fwd.success = 1;

        /* 重要朋友标记：累计成功发送 >= 5 次 */
        int msg_count = g_db->users[sender_idx].friend_msg_count[receiver_idx];
        if (msg_count >= IMPORTANT_THRESHOLD) {
            snprintf(fwd.message, MAX_MSG_LEN, "[%s -> %s*] %s",
                     req->sender, req->receiver, req->content);
        } else {
            snprintf(fwd.message, MAX_MSG_LEN, "[%s -> %s] %s",
                     req->sender, req->receiver, req->content);
        }

        /* 附上在线用户列表 */
        fwd.online_count = 0;
        for (int i = 0; i < g_db->user_count && fwd.online_count < RESP_MAX_USERS; i++) {
            if (g_db->users[i].online) {
                strncpy(fwd.online_users[fwd.online_count],
                        g_db->users[i].username, MAX_NAME_LEN - 1);
                fwd.online_count++;
            }
        }

        send_response(g_db->users[receiver_idx].priv_fifo_name, &fwd);

        log_write("(%s, %s, %s, sent)",
                  req->sender, req->receiver, ctime_no_nl(&req->timestamp));

        /* 给发送者确认 */
        snprintf(resp.message, MAX_MSG_LEN, "[SENT] %s -> %s: %s",
                 req->sender, req->receiver, req->content);
        resp.success = 1;
        resp.online_count = fwd.online_count;
        memcpy(resp.online_users, fwd.online_users, sizeof(fwd.online_users));

    } else {
        /* 接收者离线：存入离线消息队列 */
        push_offline_msg(receiver_idx, req);

        snprintf(resp.message, MAX_MSG_LEN,
                 "[OFFLINE] msg saved, %s will receive after login: %s",
                 req->receiver, req->content);
        resp.success = 1;

        log_write("(%s, %s, %s, pending)",
                  req->sender, req->receiver, ctime_no_nl(&req->timestamp));
    }

    pthread_mutex_unlock(&g_db->mutex);

    /* 给发送者回执 */
    char priv[512];
    snprintf(priv, sizeof(priv), "%s/%s_fifo", g_config.fifo_dir, req->sender);
    send_response(priv, &resp);
}

/* ================================================================
 * handle_logout —— 处理退出请求
 * ================================================================ */
static void handle_logout(request_t *req)
{
    response_t resp;
    memset(&resp, 0, sizeof(resp));

    pthread_mutex_lock(&g_db->mutex);

    int idx = find_user(req->sender);
    if (idx < 0 || !g_db->users[idx].online) {
        resp.success = 0;
        snprintf(resp.message, MAX_MSG_LEN,
                 "logout failed: user not logged in");
        pthread_mutex_unlock(&g_db->mutex);
        char priv[512];
        snprintf(priv, sizeof(priv), "%s/%s_fifo", g_config.fifo_dir, req->sender);
        send_response(priv, &resp);
        return;
    }

    /* 设置离线 */
    g_db->users[idx].online = 0;

    /* 构建当前在线用户列表 */
    resp.online_count = 0;
    for (int i = 0; i < g_db->user_count && resp.online_count < RESP_MAX_USERS; i++) {
        if (g_db->users[i].online) {
            strncpy(resp.online_users[resp.online_count],
                    g_db->users[i].username, MAX_NAME_LEN - 1);
            resp.online_count++;
        }
    }

    resp.success = 1;
    snprintf(resp.message, MAX_MSG_LEN,
             "logout OK! %d user(s) remaining online", resp.online_count);

    log_write("(%s, logout, %s) - %d online remaining",
              req->sender, ctime_no_nl(&req->timestamp), resp.online_count);

    pthread_mutex_unlock(&g_db->mutex);

    /* 发送退出确认 */
    char priv[512];
    snprintf(priv, sizeof(priv), "%s/%s_fifo", g_config.fifo_dir, req->sender);
    send_response(priv, &resp);

    /* 通知所有在线用户 */
    pthread_mutex_lock(&g_db->mutex);
    response_t broadcast;
    memset(&broadcast, 0, sizeof(broadcast));
    broadcast.success = 1;
    snprintf(broadcast.message, MAX_MSG_LEN,
             "[SYSTEM] %s has logged out", req->sender);
    broadcast.online_count = resp.online_count;
    memcpy(broadcast.online_users, resp.online_users, sizeof(resp.online_users));
    broadcast_to_online(&broadcast, NULL);
    pthread_mutex_unlock(&g_db->mutex);
}

/* ================================================================
 * handle_request —— 请求分发（线程池任务入口）
 * ================================================================ */
static void *handle_request(void *arg)
{
    request_t *req = (request_t *)arg;

    switch (req->type) {
        case REQ_REG:    handle_register(req); break;
        case REQ_LOGIN:  handle_login(req);    break;
        case REQ_MSG:    handle_message(req);  break;
        case REQ_LOGOUT: handle_logout(req);   break;
        default:
            log_write("unknown request type=%d from %s", req->type, req->sender);
            break;
    }

    free(req);
    return NULL;
}

/* ================================================================
 * main_event_loop —— epoll 主循环
 *
 * epoll_create(10)：创建 epoll 实例（参数为提示值，已忽略）
 * epoll_ctl(ADD)：将4个公共FIFO fd注册到epoll，关注EPOLLIN
 * epoll_wait(events, 10, -1)：阻塞等待，最多返回10个就绪事件，
 *   -1 表示无限等待；返回 nfds 个就绪fd
 *
 * 就绪后通过 events[i].data.fd 区分是哪个 FIFO 有数据，
 * 读取完整 request_t 后分派给线程池处理。
 * ================================================================ */
static void main_event_loop(void)
{
    int epfd = epoll_create(10);
    if (epfd < 0) {
        log_write("epoll_create failed: %s", strerror(errno));
        exit(EXIT_FAILURE);
    }

    /* 以只读 + 非阻塞方式打开4个公共FIFO */
    g_fd_reg    = open(g_reg_fifo_path,    O_RDONLY | O_NONBLOCK);
    g_fd_login  = open(g_login_fifo_path,  O_RDONLY | O_NONBLOCK);
    g_fd_msg    = open(g_msg_fifo_path,    O_RDONLY | O_NONBLOCK);
    g_fd_logout = open(g_logout_fifo_path, O_RDONLY | O_NONBLOCK);

    if (g_fd_reg < 0 || g_fd_login < 0 || g_fd_msg < 0 || g_fd_logout < 0) {
        log_write("open public FIFO failed");
        exit(EXIT_FAILURE);
    }

    /* 注册到 epoll */
    struct epoll_event ev;
    ev.events = EPOLLIN;
    ev.data.fd = g_fd_reg;    epoll_ctl(epfd, EPOLL_CTL_ADD, g_fd_reg,    &ev);
    ev.data.fd = g_fd_login;  epoll_ctl(epfd, EPOLL_CTL_ADD, g_fd_login,  &ev);
    ev.data.fd = g_fd_msg;    epoll_ctl(epfd, EPOLL_CTL_ADD, g_fd_msg,    &ev);
    ev.data.fd = g_fd_logout; epoll_ctl(epfd, EPOLL_CTL_ADD, g_fd_logout, &ev);

    log_write("epoll main loop started, listening on 4 public FIFOs");

    struct epoll_event events[10];

    while (1) {
        int nfds = epoll_wait(epfd, events, 10, -1);
        if (nfds < 0) {
            if (errno == EINTR) continue;
            log_write("epoll_wait error: %s", strerror(errno));
            break;
        }

        for (int i = 0; i < nfds; i++) {
            if (events[i].events & EPOLLIN) {
                request_t *preq = (request_t *)malloc(sizeof(request_t));
                if (!preq) {
                    log_write("malloc request_t failed");
                    continue;
                }

                ssize_t n = read(events[i].data.fd, preq, sizeof(request_t));
                if (n == sizeof(request_t)) {
                    thread_pool_dispatch(&g_pool, handle_request, preq);
                } else if (n > 0) {
                    log_write("incomplete request: read=%zd, expected=%zu",
                              n, sizeof(request_t));
                    free(preq);
                } else {
                    free(preq);
                }
            }
        }
    }

    close(epfd);
}

/* ================================================================
 * main —— 服务器入口
 * ================================================================ */
int main(int argc, char *argv[])
{
    const char *conf_path = "conf/chatserver.conf";
    if (argc > 1) {
        conf_path = argv[1];
    }

    /* ★ 在守护进程化之前，将相对路径转为绝对路径
     *    因为 daemon_init() 会 chdir("/")，之后相对路径就失效了 */
    char resolved_conf[512];
    if (conf_path[0] != '/') {
        char cwd[256];
        if (getcwd(cwd, sizeof(cwd)) != NULL) {
            snprintf(resolved_conf, sizeof(resolved_conf), "%s/%s", cwd, conf_path);
            conf_path = resolved_conf;
        }
    }

    /* 1. 变成守护进程 */
    daemon_init();

    /* 2. 读取配置文件（现在是绝对路径，不受 chdir("/") 影响） */
    if (parse_config(conf_path) < 0) {
        /* 使用默认值继续 */
    }

    /* 3. 创建目录 */
    create_directories();

    /* 4. 初始化日志 */
    char server_log[512], thread_log[512];
    snprintf(server_log, sizeof(server_log), "%s/server.log",
             g_config.log_server_dir);
    snprintf(thread_log, sizeof(thread_log), "%s/threads.log",
             g_config.log_server_dir);

    if (log_init(server_log, thread_log) < 0) {
        exit(EXIT_FAILURE);
    }

    /* 5. 记录启动时间 */
    time_t now = time(NULL);
    log_write("========================================");
    log_write("server %s v%s starting", g_config.server_name, g_config.version);
    log_write("start time: %s", ctime_no_nl(&now));
    log_write("config file: %s", conf_path);
    log_write("FIFO dir: %s", g_config.fifo_dir);
    log_write("log dir: %s", g_config.log_server_dir);
    log_write("thread pool size: %d", g_config.pool_size);
    log_write("========================================");

    /* 6. 创建公共 FIFO */
    create_public_fifos();

    /* 7. 构建线程池 */
    if (thread_pool_init(&g_pool, g_config.pool_size) < 0) {
        log_write("thread pool init failed, server exiting");
        log_close();
        exit(EXIT_FAILURE);
    }

    /* 8. 初始化用户数据库 */
    init_user_database();

    /* 9. 进入 epoll 主循环 */
    main_event_loop();

    /* 清理（正常不会到达此处） */
    thread_pool_destroy(&g_pool);
    log_write("server shutting down");
    log_close();

    return 0;
}
