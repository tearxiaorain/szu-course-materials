#ifndef LOGGER_H
#define LOGGER_H

#include "common.h"

/* ================================================================
 * logger.h —— 线程安全的日志模块
 *
 * server.log  : 服务器运行日志，权限 0600
 * threads.log : 线程池分派/回收日志
 * ================================================================ */

/* 初始化日志系统，打开日志文件，成功返回 0 */
int  log_init(const char *server_log_path, const char *thread_log_path);

/* 写入服务器日志（自动加时间戳，线程安全） */
void log_write(const char *format, ...);

/* 写入线程日志 */
void log_thread(const char *format, ...);

/* 关闭日志文件 */
void log_close(void);

#endif /* LOGGER_H */
