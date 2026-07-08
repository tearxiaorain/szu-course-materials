#ifndef THREAD_POOL_H
#define THREAD_POOL_H

#include <pthread.h>
#include "common.h"

/* ================================================================
 * thread_pool.h —— LIFO 线程池
 *
 * 核心设计：
 *   idle_stack 用 LIFO（栈）管理空闲线程——
 *   回收时 push（压栈），分派时 pop（弹栈），
 *   最近回收的在栈顶，自然优先被分派（刚回收优先分派）。
 *
 * 每个工作线程有自己的私有条件变量，被唤醒后执行任务。
 * ================================================================ */

/* 前向声明 */
struct thread_pool;

/* 单个工作线程 */
typedef struct {
    pthread_t       tid;
    int             state;           /* 0=空闲, 1=忙碌 */
    int             index;           /* 在池中的序号 */
    time_t          last_busy_end;   /* 上次回收时间 */
    pthread_cond_t  cond;            /* 私有条件变量 */
    struct thread_pool *pool;        /* 所属线程池 */
} worker_t;

/* 任务函数类型 */
typedef void* (*task_func_t)(void *arg);

/* 线程池 */
typedef struct thread_pool {
    worker_t   *workers;         /* 工作线程数组 */
    int         pool_size;

    /* ★ LIFO 空闲线程栈 —— 自然实现"刚回收优先分派" */
    int        *idle_stack;
    int         idle_top;        /* 栈顶指针（-1 表示空） */

    pthread_mutex_t lock;        /* 全局池锁 */
    pthread_cond_t  cond;        /* 有空闲线程时 signal */

    int         running;         /* 1=运行中, 0=关闭 */

    /* 每个线程的任务参数 */
    task_func_t *tasks;
    void       **task_args;
} thread_pool_t;

/* ================================================================
 * API
 * ================================================================ */

/* 初始化线程池，创建 size 个线程，成功返回 0 */
int  thread_pool_init(thread_pool_t *pool, int size);

/* 分派任务：从空闲栈 pop 一个线程执行 func(arg)，阻塞直到有空闲线程 */
int  thread_pool_dispatch(thread_pool_t *pool, task_func_t func, void *arg);

/* 销毁线程池，等待所有线程退出并释放资源 */
void thread_pool_destroy(thread_pool_t *pool);

#endif /* THREAD_POOL_H */
