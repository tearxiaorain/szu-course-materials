/* ================================================================
 * bot_manager.c —— 聊天机器人管理器
 *
 * 功能：
 *   按需动态增加/减少机器人。
 *   每个机器人：随机生成用户名密码 -> 注册 -> 登录
 *   -> 创建私有管道 -> 监听线程（收到消息自动回复）
 *
 * 命令：
 *   add <x>     — 增加 x 个机器人
 *   remove <x>  — 减少 x 个机器人（随机选择）
 *   list        — 列出所有活跃机器人
 *   quit        — 退出管理器
 *
 * 机器人命名：bot_ + 6位随机字母数字
 * 密码：8位随机字母数字
 * ================================================================ */

#include "common.h"
#include "config.h"
#include "protocol.h"
#include <poll.h>

/* ================================================================
 * 机器人数据结构
 * ================================================================ */
typedef struct {
    char        username[MAX_NAME_LEN];
    char        password[MAX_PASS_LEN];
    pthread_t   thread;          /* 监听线程 */
    int         active;          /* 是否活跃 */
    int         priv_fd;         /* 私有管道 fd */
    char        priv_fifo[MAX_NAME_LEN + 64];
    int         running;         /* 线程控制标志 */
    pthread_mutex_t lock;
    pthread_cond_t  cond;        /* 停止信号 */
} bot_t;

static bot_t g_bots[MAX_BOTS];
static int   g_bot_count = 0;
static pthread_mutex_t g_bot_mutex = PTHREAD_MUTEX_INITIALIZER;

static char g_fifo_dir[256];
static char g_reg_fifo_path[512];
static char g_login_fifo_path[512];
static char g_msg_fifo_path[512];
static char g_logout_fifo_path[512];

/* ================================================================
 * 前向声明
 * ================================================================ */
static void init_fifo_paths(void);
static void generate_random_string(char *buf, int len);
static int  register_bot(const char *username, const char *password);
static int  login_bot(const char *username, const char *password);
static void *bot_thread_main(void *arg);
static void add_bots(int count);
static void remove_bots(int count);
static void list_bots(void);

/* ================================================================
 * init_fifo_paths —— 构建 FIFO 路径
 * ================================================================ */
static void init_fifo_paths(void)
{
    if (parse_config("conf/chatserver.conf") < 0) {
        strncpy(g_fifo_dir, DEFAULT_FIFO_DIR, sizeof(g_fifo_dir) - 1);
    } else {
        strncpy(g_fifo_dir, g_config.fifo_dir, sizeof(g_fifo_dir) - 1);
    }

    snprintf(g_reg_fifo_path,    sizeof(g_reg_fifo_path),    "%s/%s",
             g_fifo_dir, REG_FIFO_NAME);
    snprintf(g_login_fifo_path,  sizeof(g_login_fifo_path),  "%s/%s",
             g_fifo_dir, LOGIN_FIFO_NAME);
    snprintf(g_msg_fifo_path,    sizeof(g_msg_fifo_path),    "%s/%s",
             g_fifo_dir, MSG_FIFO_NAME);
    snprintf(g_logout_fifo_path, sizeof(g_logout_fifo_path), "%s/%s",
             g_fifo_dir, LOGOUT_FIFO_NAME);
}

/* ================================================================
 * generate_random_string —— 生成随机字母数字串
 * ================================================================ */
static void generate_random_string(char *buf, int len)
{
    static const char charset[] =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    int charset_size = strlen(charset);

    /* 使用 rand() —— main() 中已用 srand(time^getpid) 初始化种子 */
    for (int i = 0; i < len; i++) {
        buf[i] = charset[rand() % charset_size];
    }
    buf[len] = '\0';
}

/* ================================================================
 * register_bot —— 机器人注册
 * ================================================================ */
static int register_bot(const char *username, const char *password)
{
    /* 先创建私有管道 */
    char priv_path[512];
    snprintf(priv_path, sizeof(priv_path), "%s/%s_fifo", g_fifo_dir, username);
    unlink(priv_path);
    mkfifo(priv_path, 0666);

    /* 构造注册请求 */
    request_t req;
    memset(&req, 0, sizeof(req));
    req.type      = REQ_REG;
    req.timestamp = time(NULL);
    strncpy(req.sender,   username, MAX_NAME_LEN - 1);
    strncpy(req.password, password, MAX_PASS_LEN - 1);

    int fd = open(g_reg_fifo_path, O_WRONLY);
    if (fd < 0) {
        fprintf(stderr, "[bot] cannot connect REG_FIFO: %s\n", strerror(errno));
        return -1;
    }

    write(fd, &req, sizeof(req));
    close(fd);

    /* 等待响应（非阻塞打开 + poll 避免 FIFO 死锁） */
    int priv_fd = open(priv_path, O_RDONLY | O_NONBLOCK);
    if (priv_fd < 0) return -1;

    struct pollfd pfd;
    pfd.fd     = priv_fd;
    pfd.events = POLLIN;
    int ret = poll(&pfd, 1, 5000);
    if (ret <= 0) {
        close(priv_fd);
        printf("[bot] reg timeout: %s\n", username);
        unlink(priv_path);
        return -1;
    }

    response_t resp;
    ssize_t n = read(priv_fd, &resp, sizeof(resp));
    close(priv_fd);

    if (n == sizeof(resp) && resp.success) {
        printf("[bot] reg OK: %s\n", username);
        return 0;
    } else {
        printf("[bot] reg failed: %s — %s\n", username, resp.message);
        unlink(priv_path);
        return -1;
    }
}

/* ================================================================
 * login_bot —— 机器人登录
 * ================================================================ */
static int login_bot(const char *username, const char *password)
{
    request_t req;
    memset(&req, 0, sizeof(req));
    req.type      = REQ_LOGIN;
    req.timestamp = time(NULL);
    strncpy(req.sender,   username, MAX_NAME_LEN - 1);
    strncpy(req.password, password, MAX_PASS_LEN - 1);

    int fd = open(g_login_fifo_path, O_WRONLY);
    if (fd < 0) {
        fprintf(stderr, "[bot] cannot connect LOGIN_FIFO: %s\n", strerror(errno));
        return -1;
    }

    write(fd, &req, sizeof(req));
    close(fd);

    /* 等待响应（非阻塞 + poll 避免死锁） */
    char priv_path[512];
    snprintf(priv_path, sizeof(priv_path), "%s/%s_fifo", g_fifo_dir, username);
    int priv_fd = open(priv_path, O_RDONLY | O_NONBLOCK);
    if (priv_fd < 0) return -1;

    struct pollfd pfd;
    pfd.fd     = priv_fd;
    pfd.events = POLLIN;
    int ret = poll(&pfd, 1, 5000);
    if (ret <= 0) {
        close(priv_fd);
        printf("[bot] login timeout: %s\n", username);
        return -1;
    }

    response_t resp;
    ssize_t n = read(priv_fd, &resp, sizeof(resp));
    close(priv_fd);

    if (n == sizeof(resp) && resp.success) {
        printf("[bot] login OK: %s\n", username);
        return 0;
    } else {
        printf("[bot] login failed: %s\n", username);
        return -1;
    }
}

/* ================================================================
 * bot_thread_main —— 机器人监听线程
 *
 * 使用 epoll 监听私有管道，收到消息后自动回复。
 * ================================================================ */
static void *bot_thread_main(void *arg)
{
    bot_t *bot = (bot_t *)arg;

    int epfd = epoll_create(1);
    if (epfd < 0) return NULL;

    bot->priv_fd = open(bot->priv_fifo, O_RDONLY | O_NONBLOCK);
    if (bot->priv_fd < 0) {
        close(epfd);
        return NULL;
    }

    struct epoll_event ev;
    ev.events  = EPOLLIN;
    ev.data.fd = bot->priv_fd;
    epoll_ctl(epfd, EPOLL_CTL_ADD, bot->priv_fd, &ev);

    struct epoll_event events[1];

    while (bot->running) {
        int nfds = epoll_wait(epfd, events, 1, 1000);  /* 1秒超时 */
        if (nfds < 0) {
            if (errno == EINTR) continue;
            break;
        }

        if (nfds > 0 && (events[0].events & EPOLLIN)) {
            response_t resp;
            ssize_t n = read(bot->priv_fd, &resp, sizeof(resp));
            if (n == sizeof(resp) && resp.success) {
                /* 解析消息，提取发送者 */
                /* 格式: [sender -> receiver] content 或 [SYSTEM] ... */
                char sender[MAX_NAME_LEN] = {0};
                const char *msg = resp.message;

                if (msg[0] == '[') {
                    const char *arrow = strstr(msg, " -> ");
                    if (arrow) {
                        size_t name_len = arrow - msg - 1;
                        if (name_len < MAX_NAME_LEN) {
                            strncpy(sender, msg + 1, name_len);
                        }
                    }
                }

                if (sender[0] == '\0') continue;

                /* 跳过系统消息、回执和来自自身的消息 */
                if (strcmp(sender, "SYSTEM") == 0) continue;
                if (strcmp(sender, bot->username) == 0) continue;

                /* 跳过 [SENT] 和 [OFFLINE] 前缀的回执消息 */
                if (strncmp(msg, "[SENT]",    6) == 0) continue;
                if (strncmp(msg, "[OFFLINE]", 9) == 0) continue;

                /* 只回复发给自己的消息（忽略广播） */
                if (!strstr(msg, bot->username)) continue;

                /* 自动回复 */
                char reply[MAX_MSG_LEN];
                snprintf(reply, MAX_MSG_LEN,
                         "幸会, %s, 很高兴认识您", sender);

                /* 构造消息请求 */
                request_t req;
                memset(&req, 0, sizeof(req));
                req.type      = REQ_MSG;
                req.timestamp = time(NULL);
                strncpy(req.sender,   bot->username, MAX_NAME_LEN - 1);
                strncpy(req.receiver, sender,        MAX_NAME_LEN - 1);
                strncpy(req.content,  reply,         MAX_MSG_LEN - 1);

                int msg_fd = open(g_msg_fifo_path, O_WRONLY);
                if (msg_fd >= 0) {
                    write(msg_fd, &req, sizeof(req));
                    close(msg_fd);
                    printf("[bot] %s replied to %s: %s\n",
                           bot->username, sender, reply);
                }
            }
        }
    }

    close(bot->priv_fd);
    close(epfd);
    return NULL;
}

/* ================================================================
 * add_bots —— 增加 x 个机器人
 * ================================================================ */
static void add_bots(int count)
{
    if (count <= 0) {
        printf("Error: please specify a positive number\n");
        return;
    }

    if (g_bot_count + count > MAX_BOTS) {
        printf("Bot limit %d reached, current %d\n", MAX_BOTS, g_bot_count);
        count = MAX_BOTS - g_bot_count;
        if (count <= 0) return;
    }

    int added = 0;

    for (int i = 0; i < count; i++) {
        pthread_mutex_lock(&g_bot_mutex);

        /* 找到空位 */
        int slot = -1;
        for (int j = 0; j < MAX_BOTS; j++) {
            if (!g_bots[j].active) {
                slot = j;
                break;
            }
        }
        if (slot < 0) {
            pthread_mutex_unlock(&g_bot_mutex);
            break;
        }

        bot_t *bot = &g_bots[slot];

        /* 生成随机用户名: bot_ + 6位随机 */
        strcpy(bot->username, "bot_");
        char rand_suffix[7];
        generate_random_string(rand_suffix, 6);
        strcat(bot->username, rand_suffix);

        /* 生成随机密码: 8位随机 */
        generate_random_string(bot->password, 8);

        pthread_mutex_unlock(&g_bot_mutex);

        /* 注册 */
        if (register_bot(bot->username, bot->password) < 0) {
            continue;
        }

        /* 登录 */
        if (login_bot(bot->username, bot->password) < 0) {
            char priv[512];
            snprintf(priv, sizeof(priv), "%s/%s_fifo", g_fifo_dir, bot->username);
            unlink(priv);
            continue;
        }

        /* 创建私有管道路径（用临时变量避免 -Wrestrict） */
        {
            char tmp_name[MAX_NAME_LEN];
            strncpy(tmp_name, bot->username, sizeof(tmp_name) - 1);
            snprintf(bot->priv_fifo, sizeof(bot->priv_fifo), "%s/%s_fifo",
                     g_fifo_dir, tmp_name);
        }

        /* 初始化同步原语 */
        pthread_mutex_init(&bot->lock, NULL);
        pthread_cond_init(&bot->cond, NULL);
        bot->running = 1;
        bot->active  = 1;

        /* 创建监听线程 */
        if (pthread_create(&bot->thread, NULL, bot_thread_main, bot) != 0) {
            fprintf(stderr, "[bot] thread create failed: %s\n", bot->username);
            bot->active = 0;
            continue;
        }

        pthread_mutex_lock(&g_bot_mutex);
        g_bot_count++;
        pthread_mutex_unlock(&g_bot_mutex);

        printf("[bot] [+] %s is now online\n", bot->username);
        added++;
    }

    printf("\n[bot] added %d bots, total %d\n", added, g_bot_count);
}

/* ================================================================
 * remove_bots —— 减少 x 个机器人（随机选择）
 * ================================================================ */
static void remove_bots(int count)
{
    if (count <= 0) {
        printf("Error: please specify a positive number\n");
        return;
    }

    pthread_mutex_lock(&g_bot_mutex);

    if (g_bot_count == 0) {
        printf("No active bots\n");
        pthread_mutex_unlock(&g_bot_mutex);
        return;
    }

    if (count > g_bot_count) {
        count = g_bot_count;
    }

    /* 收集活跃机器人索引 */
    int active_indices[MAX_BOTS];
    int active_count = 0;
    for (int i = 0; i < MAX_BOTS; i++) {
        if (g_bots[i].active) {
            active_indices[active_count++] = i;
        }
    }

    /* Fisher-Yates 洗牌 */
    for (int i = active_count - 1; i > 0; i--) {
        int j = rand() % (i + 1);
        int tmp = active_indices[i];
        active_indices[i] = active_indices[j];
        active_indices[j] = tmp;
    }

    pthread_mutex_unlock(&g_bot_mutex);

    int removed = 0;

    for (int i = 0; i < count; i++) {
        int idx = active_indices[i];
        bot_t *bot = &g_bots[idx];

        printf("[bot] removing: %s\n", bot->username);

        /* 发送退出请求 */
        request_t req;
        memset(&req, 0, sizeof(req));
        req.type      = REQ_LOGOUT;
        req.timestamp = time(NULL);
        strncpy(req.sender, bot->username, MAX_NAME_LEN - 1);

        int fd = open(g_logout_fifo_path, O_WRONLY);
        if (fd >= 0) {
            write(fd, &req, sizeof(req));
            close(fd);
        }

        /* 停止监听线程 */
        bot->running = 0;
        pthread_cond_signal(&bot->cond);
        pthread_join(bot->thread, NULL);

        /* 清理 */
        bot->active = 0;
        unlink(bot->priv_fifo);
        pthread_mutex_destroy(&bot->lock);
        pthread_cond_destroy(&bot->cond);

        pthread_mutex_lock(&g_bot_mutex);
        g_bot_count--;
        pthread_mutex_unlock(&g_bot_mutex);

        printf("[bot] [-] %s has logged out\n", bot->username);
        removed++;
    }

    printf("\n[bot] removed %d bots, %d remaining\n", removed, g_bot_count);
}

/* ================================================================
 * list_bots —— 列出所有活跃机器人
 * ================================================================ */
static void list_bots(void)
{
    pthread_mutex_lock(&g_bot_mutex);

    printf("\n======= Active Bots (%d) =======\n", g_bot_count);

    int listed = 0;
    for (int i = 0; i < MAX_BOTS; i++) {
        if (g_bots[i].active) {
            printf("  [%d] %s\n", i, g_bots[i].username);
            listed++;
        }
    }

    if (listed == 0) {
        printf("  (no active bots)\n");
    }

    printf("=================================\n\n");

    pthread_mutex_unlock(&g_bot_mutex);
}

/* ================================================================
 * main —— 机器人管理器入口
 * ================================================================ */
int main(void)
{
    /* 初始化随机种子 */
    srand((unsigned int)(time(NULL) ^ (unsigned long)getpid()));

    printf("\n");
    printf("+==========================================+\n");
    printf("|     Bot Manager v1.0                     |\n");
    printf("|     Commands: add <n> | remove <n>       |\n");
    printf("|              list | quit                 |\n");
    printf("+==========================================+\n\n");

    /* 初始化 FIFO 路径 */
    init_fifo_paths();

    /* 确保 FIFO 目录存在 */
    make_dirs(g_fifo_dir);

    /* 初始化机器人数组 */
    memset(g_bots, 0, sizeof(g_bots));

    char line[256];
    printf("bot> ");
    fflush(stdout);

    while (fgets(line, sizeof(line), stdin)) {
        size_t len = strlen(line);
        while (len > 0 && (line[len - 1] == '\n' || line[len - 1] == '\r')) {
            line[--len] = '\0';
        }
        if (len == 0) {
            printf("bot> ");
            fflush(stdout);
            continue;
        }

        char cmd[64] = {0};
        int  arg     = 0;
        sscanf(line, "%63s %d", cmd, &arg);

        if (strcmp(cmd, "add") == 0) {
            add_bots(arg > 0 ? arg : 1);
        } else if (strcmp(cmd, "remove") == 0) {
            remove_bots(arg > 0 ? arg : 1);
        } else if (strcmp(cmd, "list") == 0) {
            list_bots();
        } else if (strcmp(cmd, "quit") == 0 || strcmp(cmd, "exit") == 0) {
            break;
        } else if (strcmp(cmd, "help") == 0) {
            printf("Commands:\n");
            printf("  add <n>     - add n bots\n");
            printf("  remove <n>  - remove n bots\n");
            printf("  list        - list all bots\n");
            printf("  quit        - exit\n");
        } else {
            printf("Unknown command: %s\n", cmd);
        }

        printf("bot> ");
        fflush(stdout);
    }

    /* 退出前清理所有机器人 */
    remove_bots(g_bot_count);

    printf("Bot manager closed.\n");
    return 0;
}
