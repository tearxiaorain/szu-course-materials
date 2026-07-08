#ifndef COMMON_H
#define COMMON_H

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <fcntl.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <sys/epoll.h>
#include <pthread.h>
#include <time.h>
#include <errno.h>
#include <signal.h>
#include <stdarg.h>

/* ================================================================
 * 路径宏 —— 运行时由配置文件填充，此处仅作默认值
 * ================================================================ */
#define DEFAULT_FIFO_DIR         "/home/yjw/Server/fifo"
#define DEFAULT_LOG_DIR          "/home/yjw/log/chat-logs"
#define DEFAULT_LOG_SERVER_DIR   "/home/yjw/log/chat-logs/server"

/* ================================================================
 * 公共 FIFO 名称后缀（名前缀为学生姓名拼音缩写）
 * 完整路径 = fifo_dir/缩写_xxx_fifo
 * ================================================================ */
#define REG_FIFO_NAME            "yjw_reg_fifo"
#define LOGIN_FIFO_NAME          "yjw_login_fifo"
#define MSG_FIFO_NAME            "yjw_msg_fifo"
#define LOGOUT_FIFO_NAME         "yjw_logout_fifo"

/* ================================================================
 * 系统常量
 * ================================================================ */
#define MAX_USERS                256
#define MAX_BOTS                 100
#define POOLSIZE                 100
#define MAX_MSG_LEN              1024
#define MAX_NAME_LEN             64
#define MAX_PASS_LEN             32
#define OFFLINE_MSG_MAX          100
#define IMPORTANT_THRESHOLD      5
#define MAX_LINE_LEN             2048

/* ================================================================
 * 请求类型枚举
 * ================================================================ */
typedef enum {
    REQ_REG    = 1,
    REQ_LOGIN  = 2,
    REQ_MSG    = 3,
    REQ_LOGOUT = 4
} req_type_t;

/* ================================================================
 * 用户信息结构体
 * ================================================================ */
typedef struct {
    char username[MAX_NAME_LEN];
    char password[MAX_PASS_LEN];
    int  online;                            /* 0=离线, 1=在线 */
    char priv_fifo_name[512];               /* 私有管道路径 */
    int  friend_msg_count[MAX_USERS];       /* 给每个好友发消息的次数 */
    int  user_index;                        /* 在数组中的索引 */
} user_t;

/* ================================================================
 * 离线消息结构体
 * ================================================================ */
typedef struct {
    char   sender[MAX_NAME_LEN];
    char   receiver[MAX_NAME_LEN];
    char   content[MAX_MSG_LEN];
    time_t timestamp;
} offline_msg_t;

/* ================================================================
 * 离线消息循环队列（每个用户一个）
 * ================================================================ */
typedef struct {
    offline_msg_t messages[OFFLINE_MSG_MAX];
    int head;
    int tail;
    int count;
} offline_queue_t;

/* ================================================================
 * 请求包（写入公共 FIFO 的数据）
 * ================================================================ */
#pragma pack(push, 1)
typedef struct {
    req_type_t type;
    char   sender[MAX_NAME_LEN];
    char   password[MAX_PASS_LEN];
    char   receiver[MAX_NAME_LEN];
    char   content[MAX_MSG_LEN];
    time_t timestamp;
} request_t;

/* ================================================================
 * 响应包（服务器通过私有管道发给客户端）
 *
 * ★ 注意：FIFO 管道缓冲区仅 64KB（65536字节），
 *    response_t 必须远小于此值，否则 write() 截断导致客户端收不到。
 *    online_users 限制 32 个、offline_messages 限制 16 条，
 *    总大小约 22KB，安全落在 64KB 以内。
 * ================================================================ */
#define RESP_MAX_USERS    32
#define RESP_MAX_OFFLINE  16

typedef struct {
    int  success;
    char message[MAX_MSG_LEN];
    int  online_count;
    char online_users[RESP_MAX_USERS][MAX_NAME_LEN];
    int  offline_count;
    offline_msg_t offline_messages[RESP_MAX_OFFLINE];
} response_t;
#pragma pack(pop)

/* ================================================================
 * 全局配置结构体
 * ================================================================ */
typedef struct {
    char server_name[128];
    char version[32];
    int  pool_size;
    char fifo_dir[256];
    char log_dir[256];
    char log_server_dir[256];
} config_t;

extern config_t g_config;

/* ================================================================
 * 工具函数声明
 * ================================================================ */
int  parse_config(const char *path);
void make_dirs(const char *path);

#endif /* COMMON_H */
