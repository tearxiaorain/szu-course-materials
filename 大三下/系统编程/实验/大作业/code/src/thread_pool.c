#include "thread_pool.h"
#include "logger.h"

/* ================================================================
 * thread_pool.c —— LIFO 线程池实现
 *
 * 每个工作线程的主循环：
 *   1. 将自己压入 idle_stack，signal 池条件变量
 *   2. wait 自己的私有条件变量（等待分派任务）
 *   3. 被唤醒后，解锁、执行任务
 *   4. 任务完成后，加锁，将自己压回 idle_stack，signal
 *
 * 分派流程：
 *   1. 加锁，若 idle_stack 为空则 wait 池条件变量
 *   2. pop 栈顶空闲线程（LIFO：最近回收的优先分派）
 *   3. 设置任务参数，signal 该线程的私有条件变量
 *   4. 解锁
 * ================================================================ */

/* ================================================================
 * worker_main —— 工作线程入口函数
 * ================================================================ */
static void *worker_main(void *arg)
{
    worker_t *w = (worker_t *)arg;
    thread_pool_t *pool = w->pool;

    pthread_mutex_lock(&pool->lock);

    /* 初始化为空闲，压入空闲栈 */
    w->state = 0;
    w->last_busy_end = time(NULL);
    pool->idle_stack[++pool->idle_top] = w->index;

    log_thread("thread %d created, entering idle state", w->index);

    /* 通知可能正在等待的 dispatch */
    pthread_cond_signal(&pool->cond);

    while (pool->running) {
        /* 等待自己被分派任务 */
        pthread_cond_wait(&w->cond, &pool->lock);

        if (!pool->running) break;

        /* 已被分派，取出任务 */
        w->state = 1;  /* 忙碌 */
        task_func_t func = pool->tasks[w->index];
        void *task_arg  = pool->task_args[w->index];

        pthread_mutex_unlock(&pool->lock);

        /* 执行任务 */
        if (func) {
            func(task_arg);
        }

        /* 任务执行完毕，回收自己 */
        pthread_mutex_lock(&pool->lock);

        w->state = 0;  /* 空闲 */
        w->last_busy_end = time(NULL);

        /* ★ LIFO push：将自己压回空闲栈栈顶 */
        pool->idle_stack[++pool->idle_top] = w->index;

        log_thread("thread %d recycled (LIFO push, top=%d)", w->index, pool->idle_top);

        /* 通知等待的 dispatch */
        pthread_cond_signal(&pool->cond);
    }

    /* 销毁时退出 */
    log_thread("thread %d exiting", w->index);
    pthread_mutex_unlock(&pool->lock);
    return NULL;
}

/* ================================================================
 * thread_pool_init —— 初始化线程池
 * ================================================================ */
int thread_pool_init(thread_pool_t *pool, int size)
{
    if (size <= 0 || size > 1000) return -1;

    pool->pool_size = size;
    pool->idle_top  = -1;
    pool->running   = 1;

    /* 分配内存 */
    pool->workers    = (worker_t *)malloc(sizeof(worker_t) * size);
    pool->idle_stack = (int *)malloc(sizeof(int) * size);
    pool->tasks      = (task_func_t *)malloc(sizeof(task_func_t) * size);
    pool->task_args  = (void **)malloc(sizeof(void *) * size);

    if (!pool->workers || !pool->idle_stack || !pool->tasks || !pool->task_args) {
        log_write("thread pool memory allocation failed");
        free(pool->workers);
        free(pool->idle_stack);
        free(pool->tasks);
        free(pool->task_args);
        return -1;
    }

    /* 初始化互斥锁和条件变量 */
    pthread_mutex_init(&pool->lock, NULL);
    pthread_cond_init(&pool->cond, NULL);

    /* 初始化任务数组 */
    memset(pool->tasks, 0, sizeof(task_func_t) * size);
    memset(pool->task_args, 0, sizeof(void *) * size);

    int created = 0;

    for (int i = 0; i < size; i++) {
        pool->workers[i].index  = i;
        pool->workers[i].state  = 0;
        pool->workers[i].pool   = pool;
        pool->workers[i].last_busy_end = time(NULL);
        pthread_cond_init(&pool->workers[i].cond, NULL);

        if (pthread_create(&pool->workers[i].tid, NULL,
                           worker_main, &pool->workers[i]) != 0) {
            log_write("thread %d creation failed: %s", i, strerror(errno));
            /* 标记 running=0，让已创建的线程退出 */
            pool->running = 0;
            pthread_cond_broadcast(&pool->cond);
            for (int j = 0; j < i; j++) {
                pthread_cond_signal(&pool->workers[j].cond);
            }
            /* 等待已创建的线程退出 */
            for (int j = 0; j < i; j++) {
                pthread_join(pool->workers[j].tid, NULL);
            }
            return -1;
        }
        created++;
    }

    /* 等待所有线程初始化完成（全部压入栈） */
    pthread_mutex_lock(&pool->lock);
    while (pool->idle_top < size - 1) {
        pthread_cond_wait(&pool->cond, &pool->lock);
    }
    pthread_mutex_unlock(&pool->lock);

    log_write("thread pool built successfully, created %d threads", created);
    return 0;
}

/* ================================================================
 * thread_pool_dispatch —— 分派任务（LIFO）
 * ================================================================ */
int thread_pool_dispatch(thread_pool_t *pool, task_func_t func, void *arg)
{
    pthread_mutex_lock(&pool->lock);

    /* 等待有空闲线程 */
    while (pool->idle_top < 0 && pool->running) {
        pthread_cond_wait(&pool->cond, &pool->lock);
    }

    if (!pool->running) {
        pthread_mutex_unlock(&pool->lock);
        return -1;
    }

    /* ★ LIFO pop：从栈顶取出最近回收的线程 */
    int idx = pool->idle_stack[pool->idle_top--];

    pool->tasks[idx]     = func;
    pool->task_args[idx] = arg;

    log_thread("thread %d dispatched (LIFO pop, remaining idle=%d)", idx, pool->idle_top + 1);

    /* 唤醒该线程的私有条件变量 */
    pthread_cond_signal(&pool->workers[idx].cond);

    pthread_mutex_unlock(&pool->lock);
    return 0;
}

/* ================================================================
 * thread_pool_destroy —— 销毁线程池
 * ================================================================ */
void thread_pool_destroy(thread_pool_t *pool)
{
    if (!pool->workers) return;

    pthread_mutex_lock(&pool->lock);
    pool->running = 0;

    /* 广播唤醒所有线程 */
    pthread_cond_broadcast(&pool->cond);
    for (int i = 0; i < pool->pool_size; i++) {
        pthread_cond_signal(&pool->workers[i].cond);
    }
    pthread_mutex_unlock(&pool->lock);

    /* 等待所有线程退出 */
    for (int i = 0; i < pool->pool_size; i++) {
        pthread_join(pool->workers[i].tid, NULL);
        pthread_cond_destroy(&pool->workers[i].cond);
    }

    pthread_mutex_destroy(&pool->lock);
    pthread_cond_destroy(&pool->cond);

    free(pool->workers);
    free(pool->idle_stack);
    free(pool->tasks);
    free(pool->task_args);

    pool->workers    = NULL;
    pool->idle_stack = NULL;
    pool->tasks      = NULL;
    pool->task_args  = NULL;

    log_write("thread pool destroyed");
}
