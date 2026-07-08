#include "logger.h"

/* ================================================================
 * logger.c —— 线程安全日志实现
 *
 * 使用 pthread_mutex_t 保护并发写入。
 * 每条日志自动添加时间戳前缀。
 * ================================================================ */

static FILE       *g_server_log_fp  = NULL;
static FILE       *g_thread_log_fp  = NULL;
static pthread_mutex_t g_log_mutex  = PTHREAD_MUTEX_INITIALIZER;
static pthread_mutex_t g_thread_mutex = PTHREAD_MUTEX_INITIALIZER;

/* ================================================================
 * log_init —— 初始化日志
 * ================================================================ */
int log_init(const char *server_log_path, const char *thread_log_path)
{
    g_server_log_fp = fopen(server_log_path, "a");
    if (!g_server_log_fp) {
        fprintf(stderr, "[logger] 无法打开服务器日志: %s\n", server_log_path);
        return -1;
    }

    /* 设置日志文件权限为 0600（仅 owner 可读写） */
    chmod(server_log_path, S_IRUSR | S_IWUSR);

    g_thread_log_fp = fopen(thread_log_path, "a");
    if (!g_thread_log_fp) {
        fprintf(stderr, "[logger] 无法打开线程日志: %s\n", thread_log_path);
        fclose(g_server_log_fp);
        return -1;
    }

    return 0;
}

/* ================================================================
 * log_write —— 写服务器日志（线程安全，带时间戳）
 * ================================================================ */
void log_write(const char *format, ...)
{
    if (!g_server_log_fp) return;

    pthread_mutex_lock(&g_log_mutex);

    /* 时间戳 */
    time_t now = time(NULL);
    struct tm *tm_info = localtime(&now);
    char time_buf[64];
    strftime(time_buf, sizeof(time_buf), "%Y-%m-%d %H:%M:%S", tm_info);

    fprintf(g_server_log_fp, "[%s] ", time_buf);

    va_list args;
    va_start(args, format);
    vfprintf(g_server_log_fp, format, args);
    va_end(args);

    fprintf(g_server_log_fp, "\n");
    fflush(g_server_log_fp);

    pthread_mutex_unlock(&g_log_mutex);
}

/* ================================================================
 * log_thread —— 写线程池日志
 * ================================================================ */
void log_thread(const char *format, ...)
{
    if (!g_thread_log_fp) return;

    pthread_mutex_lock(&g_thread_mutex);

    time_t now = time(NULL);
    struct tm *tm_info = localtime(&now);
    char time_buf[64];
    strftime(time_buf, sizeof(time_buf), "%Y-%m-%d %H:%M:%S", tm_info);

    fprintf(g_thread_log_fp, "[%s] ", time_buf);

    va_list args;
    va_start(args, format);
    vfprintf(g_thread_log_fp, format, args);
    va_end(args);

    fprintf(g_thread_log_fp, "\n");
    fflush(g_thread_log_fp);

    pthread_mutex_unlock(&g_thread_mutex);
}

/* ================================================================
 * log_close —— 关闭日志
 * ================================================================ */
void log_close(void)
{
    if (g_server_log_fp) {
        fclose(g_server_log_fp);
        g_server_log_fp = NULL;
    }
    if (g_thread_log_fp) {
        fclose(g_thread_log_fp);
        g_thread_log_fp = NULL;
    }
}
