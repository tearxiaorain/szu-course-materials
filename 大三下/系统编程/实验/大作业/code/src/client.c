/* ================================================================
 * client.c —— 即时聊天系统客户端（交互式）
 *
 * 功能：
 *   通过 epoll 同时监听标准输入和私有命名管道。
 *   从 stdin 读取命令（register/login/send/logout），
 *   写入对应的公共 FIFO；从私有管道读取服务器响应并显示。
 *
 * 命令格式：
 *   register <username> <password>
 *   login    <username> <password>
 *   send     <receiver> <message>
 *   logout
 *   help
 *   quit
 * ================================================================ */

#include "common.h"
#include "config.h"
#include "protocol.h"

/* ================================================================
 * 全局状态
 * ================================================================ */
static char g_username[MAX_NAME_LEN];
static char g_password[MAX_PASS_LEN];
static int  g_logged_in = 0;

static char g_fifo_dir[256];
static char g_priv_fifo_path[512];
static char g_reg_fifo_path[512];
static char g_login_fifo_path[512];
static char g_msg_fifo_path[512];
static char g_logout_fifo_path[512];

/* ================================================================
 * 前向声明
 * ================================================================ */
static void init_fifo_paths(void);
static void create_private_fifo(void);
static void send_request(req_type_t type, const char *receiver, const char *content);
static void print_response(response_t *resp);
static void print_help(void);
static void event_loop(void);

/* ================================================================
 * init_fifo_paths —— 构建所有FIFO路径
 * ================================================================ */
static void init_fifo_paths(void)
{
    /* 先尝试读取配置获取 fifo_dir，失败则用默认值 */
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
 * create_private_fifo —— 创建客户端的私有命名管道
 * ================================================================ */
static void create_private_fifo(void)
{
    snprintf(g_priv_fifo_path, sizeof(g_priv_fifo_path), "%s/%s_fifo",
             g_fifo_dir, g_username);
    unlink(g_priv_fifo_path);
    if (mkfifo(g_priv_fifo_path, 0666) < 0) {
        fprintf(stderr, "create private fifo failed: %s\n", strerror(errno));
        exit(EXIT_FAILURE);
    }
}

/* ================================================================
 * send_request —— 构造请求并写入对应的公共 FIFO
 * ================================================================ */
static void send_request(req_type_t type, const char *receiver, const char *content)
{
    request_t req;
    memset(&req, 0, sizeof(req));

    req.type      = type;
    req.timestamp = time(NULL);
    strncpy(req.sender,   g_username, MAX_NAME_LEN - 1);
    strncpy(req.password, g_password, MAX_PASS_LEN - 1);

    if (receiver) strncpy(req.receiver, receiver, MAX_NAME_LEN - 1);
    if (content)  strncpy(req.content,  content,  MAX_MSG_LEN - 1);

    const char *fifo_path = NULL;
    switch (type) {
        case REQ_REG:    fifo_path = g_reg_fifo_path;    break;
        case REQ_LOGIN:  fifo_path = g_login_fifo_path;  break;
        case REQ_MSG:    fifo_path = g_msg_fifo_path;    break;
        case REQ_LOGOUT: fifo_path = g_logout_fifo_path; break;
        default: return;
    }

    int fd = open(fifo_path, O_WRONLY);
    if (fd < 0) {
        fprintf(stderr, "ERROR: cannot connect to server (%s), is server running?\n",
                fifo_path);
        return;
    }

    ssize_t n = write(fd, &req, sizeof(req));
    if (n != sizeof(req)) {
        fprintf(stderr, "WARNING: incomplete write (%zd/%zu)\n", n, sizeof(req));
    }
    close(fd);
}

/* ================================================================
 * print_response —— 格式化显示服务器响应
 * ================================================================ */
static void print_response(response_t *resp)
{
    printf("\n+------------------------------------------+\n");

    if (resp->success) {
        printf("| [OK] %s\n", resp->message);
    } else {
        printf("| [FAIL] %s\n", resp->message);
    }

    /* 在线用户列表 */
    if (resp->online_count > 0) {
        printf("| Online (%d): ", resp->online_count);
        for (int i = 0; i < resp->online_count; i++) {
            printf("%s", resp->online_users[i]);
            if (i < resp->online_count - 1) printf(", ");
        }
        printf("\n");
    }

    /* 离线消息 */
    if (resp->offline_count > 0) {
        printf("| Offline msgs (%d):\n", resp->offline_count);
        for (int i = 0; i < resp->offline_count; i++) {
            char time_buf[64];
            struct tm *tm_info = localtime(&resp->offline_messages[i].timestamp);
            strftime(time_buf, sizeof(time_buf), "%m-%d %H:%M:%S", tm_info);
            printf("|   [%s] %s: %s\n",
                   time_buf,
                   resp->offline_messages[i].sender,
                   resp->offline_messages[i].content);
        }
    }

    printf("+------------------------------------------+\n");
    printf("> ");
    fflush(stdout);
}

/* ================================================================
 * print_help —— 显示帮助信息
 * ================================================================ */
static void print_help(void)
{
    printf("\n========== Chat Client v1.0 ==========\n");
    printf("  Commands:\n");
    printf("  register <user> <pass>  -- register new user\n");
    printf("  login    <user> <pass>  -- login\n");
    printf("  send     <to> <msg>     -- send message\n");
    printf("  logout                  -- logout\n");
    printf("  help                    -- show this help\n");
    printf("  quit                    -- exit client\n");
    printf("========================================\n\n");
}

/* ================================================================
 * event_loop —— epoll 事件循环
 *
 * 同时监听 stdin（用户输入）和私有管道（服务器响应）。
 * 使用 epoll 实现 I/O 多路复用，无需多线程即可同时处理
 * 用户输入和服务器推送。
 * ================================================================ */
static void event_loop(void)
{
    int epfd = epoll_create(2);
    if (epfd < 0) {
        fprintf(stderr, "epoll_create failed: %s\n", strerror(errno));
        exit(EXIT_FAILURE);
    }

    /* 监听标准输入 */
    struct epoll_event ev;
    ev.events = EPOLLIN;
    ev.data.fd = STDIN_FILENO;
    epoll_ctl(epfd, EPOLL_CTL_ADD, STDIN_FILENO, &ev);

    /* 私有管道在 register/login 时才创建并加入 epoll */
    int priv_fd = -1;

    struct epoll_event events[2];

    printf("> ");
    fflush(stdout);

    while (1) {
        int nfds = epoll_wait(epfd, events, 2, -1);
        if (nfds < 0) {
            if (errno == EINTR) continue;
            break;
        }

        for (int i = 0; i < nfds; i++) {
            if (events[i].data.fd == STDIN_FILENO) {
                /* === 用户输入 === */
                char line[MAX_LINE_LEN];
                if (!fgets(line, sizeof(line), stdin)) {
                    goto cleanup;
                }

                /* 去除末尾换行 */
                size_t len = strlen(line);
                while (len > 0 && (line[len - 1] == '\n' || line[len - 1] == '\r')) {
                    line[--len] = '\0';
                }
                if (len == 0) {
                    printf("> ");
                    fflush(stdout);
                    continue;
                }

                /* 解析命令 */
                char cmd[64]   = {0};
                char arg1[256] = {0};
                char arg2[MAX_MSG_LEN] = {0};

                int n = sscanf(line, "%63s %255s %[^\n]", cmd, arg1, arg2);

                if (strcmp(cmd, "register") == 0) {
                    if (n < 3) {
                        printf("Usage: register <username> <password>\n> ");
                        fflush(stdout);
                        continue;
                    }
                    strncpy(g_username, arg1, MAX_NAME_LEN - 1);
                    strncpy(g_password, arg2, MAX_PASS_LEN - 1);
                    create_private_fifo();
                    /* 关闭旧管道，重新打开（create_private_fifo 会 unlink 旧管道） */
                    if (priv_fd >= 0) {
                        epoll_ctl(epfd, EPOLL_CTL_DEL, priv_fd, NULL);
                        close(priv_fd);
                    }
                    priv_fd = open(g_priv_fifo_path, O_RDONLY | O_NONBLOCK);
                    if (priv_fd >= 0) {
                        struct epoll_event ev2;
                        ev2.events = EPOLLIN;
                        ev2.data.fd = priv_fd;
                        epoll_ctl(epfd, EPOLL_CTL_ADD, priv_fd, &ev2);
                    }
                    send_request(REQ_REG, NULL, NULL);

                } else if (strcmp(cmd, "login") == 0) {
                    if (n < 3) {
                        printf("Usage: login <username> <password>\n> ");
                        fflush(stdout);
                        continue;
                    }
                    strncpy(g_username, arg1, MAX_NAME_LEN - 1);
                    strncpy(g_password, arg2, MAX_PASS_LEN - 1);
                    create_private_fifo();
                    /* 关闭旧管道，重新打开 */
                    if (priv_fd >= 0) {
                        epoll_ctl(epfd, EPOLL_CTL_DEL, priv_fd, NULL);
                        close(priv_fd);
                    }
                    priv_fd = open(g_priv_fifo_path, O_RDONLY | O_NONBLOCK);
                    if (priv_fd >= 0) {
                        struct epoll_event ev2;
                        ev2.events = EPOLLIN;
                        ev2.data.fd = priv_fd;
                        epoll_ctl(epfd, EPOLL_CTL_ADD, priv_fd, &ev2);
                    }
                    send_request(REQ_LOGIN, NULL, NULL);

                } else if (strcmp(cmd, "send") == 0) {
                    if (g_username[0] == '\0') {
                        printf("Please login first.\n> ");
                        fflush(stdout);
                        continue;
                    }
                    if (n < 3) {
                        printf("Usage: send <receiver> <message>\n> ");
                        fflush(stdout);
                        continue;
                    }
                    send_request(REQ_MSG, arg1, arg2);

                } else if (strcmp(cmd, "logout") == 0) {
                    if (g_username[0] == '\0') {
                        printf("Not logged in.\n> ");
                        fflush(stdout);
                        continue;
                    }
                    send_request(REQ_LOGOUT, NULL, NULL);
                    g_logged_in = 0;

                } else if (strcmp(cmd, "list") == 0) {
                    printf("Online users are shown with each server response.\n");
                    printf("Use 'send <user> <msg>' to chat.\n> ");
                    fflush(stdout);

                } else if (strcmp(cmd, "help") == 0) {
                    print_help();
                    printf("> ");
                    fflush(stdout);

                } else if (strcmp(cmd, "quit") == 0 || strcmp(cmd, "exit") == 0) {
                    if (g_logged_in) {
                        send_request(REQ_LOGOUT, NULL, NULL);
                    }
                    goto cleanup;

                } else {
                    printf("Unknown command: %s (type help)\n> ", cmd);
                    fflush(stdout);
                }

            } else if (events[i].data.fd == priv_fd) {
                /* === 服务器响应 === */
                response_t resp;
                ssize_t n = read(priv_fd, &resp, sizeof(resp));
                if (n == sizeof(resp)) {
                    if (resp.success && strstr(resp.message, "login OK")) {
                        g_logged_in = 1;
                    }
                    print_response(&resp);
                } else if (n <= 0) {
                    /* 管道关闭，重新打开 */
                    close(priv_fd);
                    priv_fd = open(g_priv_fifo_path, O_RDONLY | O_NONBLOCK);
                    if (priv_fd >= 0) {
                        ev.events = EPOLLIN;
                        ev.data.fd = priv_fd;
                        epoll_ctl(epfd, EPOLL_CTL_ADD, priv_fd, &ev);
                    }
                }
            }
        }
    }

cleanup:
    close(priv_fd);
    close(epfd);
}

/* ================================================================
 * main —— 客户端入口
 * ================================================================ */
int main(int argc, char *argv[])
{
    printf("\n");
    printf("+==========================================+\n");
    printf("|      Chat Client v1.0                    |\n");
    printf("|      Type help for commands              |\n");
    printf("+==========================================+\n\n");

    /* 初始化路径 */
    init_fifo_paths();

    /* 如果命令行提供了用户名，预设 */
    if (argc >= 2) {
        strncpy(g_username, argv[1], MAX_NAME_LEN - 1);
    }

    /* 创建私有管道（如果已预设用户名） */
    if (g_username[0] != '\0') {
        create_private_fifo();
    }

    /* 进入 epoll 事件循环 */
    event_loop();

    /* 清理私有管道 */
    if (g_username[0] != '\0') {
        char priv[512];
        snprintf(priv, sizeof(priv), "%s/%s_fifo", g_fifo_dir, g_username);
        unlink(priv);
    }

    printf("Goodbye!\n");
    return 0;
}
