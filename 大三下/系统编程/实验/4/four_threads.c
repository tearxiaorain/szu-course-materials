#include <stdio.h>       /* printf, fprintf, fopen, fclose, fflush */
#include <stdlib.h>      /* exit */
#include <pthread.h>     /* pthread_create, pthread_join */
#include <semaphore.h>   /* sem_init, sem_wait, sem_post, sem_destroy */
#include <unistd.h>      /* sleep (for demo) */

#define NUM_THREADS    4
#define NUM_ROUNDS     4          /* 循环 4 轮，共 16 次写入 */

typedef struct {
    int  thread_id;               /* 线程编号 1~4 */
    char *output_str;             /* 输出字符串: "1", "22", "333", "4444" */
    sem_t *my_sem;                /* 指向自己的信号量 */
    sem_t *next_sem;              /* 指向下一个线程的信号量 */
} ThreadArg;

static sem_t sems[NUM_THREADS];   /* 4 个信号量：sems[0]→T1, sems[1]→T2, ... */
static FILE *files[4];            /* 4 个文件指针：A, B, C, D */
static const char *file_names[] = {"A", "B", "C", "D"};

static void *thread_func(void *arg)
{
    ThreadArg *ta = (ThreadArg *) arg;
    for (int i = 0; i < NUM_ROUNDS; i++) {
        sem_wait(ta->my_sem);                        /* P：等待自己回合 */

        /* 计算本轮写入的目标文件索引：每个线程用自身的轮次 i */
        int file_idx = ((ta->thread_id - 1 - i) % 4 + 4) % 4;

        printf("[T%d → %s] %s\n",
               ta->thread_id, file_names[file_idx], ta->output_str);

        fprintf(files[file_idx], "%s", ta->output_str);
        fflush(files[file_idx]);                     /* 确保即时写入 */

        sem_post(ta->next_sem);                      /* V：唤醒下一个线程 */
    }

    sem_post(ta->next_sem);
    return NULL;
}

int main(void)
{
    pthread_t threads[NUM_THREADS];
    ThreadArg args[NUM_THREADS];
    char *outputs[] = {"1 ", "22 ", "333 ", "4444 "};

    /* 1. 创建/清空四个文件 */
    for (int i = 0; i < 4; i++) {
        files[i] = fopen(file_names[i], "w");
        if (files[i] == NULL) {
            perror("fopen");
            exit(1);
        }
    }

    /* 2. 初始化信号量：只有 T1 初始值为 1，其余为 0 */
    for (int i = 0; i < NUM_THREADS; i++)
        sem_init(&sems[i], 0, (i == 0) ? 1 : 0);

    /* 3. 创建 4 个线程 */
    for (int i = 0; i < NUM_THREADS; i++) {
        args[i].thread_id  = i + 1;
        args[i].output_str = outputs[i];
        args[i].my_sem     = &sems[i];
        args[i].next_sem   = &sems[(i + 1) % NUM_THREADS];
        pthread_create(&threads[i], NULL, thread_func, &args[i]);
    }

    /* 4. 等待所有线程完成 */
    for (int i = 0; i < NUM_THREADS; i++)
        pthread_join(threads[i], NULL);

    for (int i = 0; i < 4; i++)
        fclose(files[i]);

    for (int i = 0; i < NUM_THREADS; i++)
        sem_destroy(&sems[i]);

    /* 7. 输出最终结果 */
    printf("\n========== 最终结果 ==========\n");
    for (int i = 0; i < 4; i++) {
        char buf[256];
        files[i] = fopen(file_names[i], "r");
        fgets(buf, sizeof(buf), files[i]);
        printf("%s: %s\n", file_names[i], buf);
        fclose(files[i]);
    }

    return 0;
}
