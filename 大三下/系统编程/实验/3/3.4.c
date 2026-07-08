#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>
#include <semaphore.h>

#define ROUNDS 5

sem_t sem_thread, sem_main;

void *thread_func(void *arg) {
    for (int r = 0; r < ROUNDS; r++) {
        sem_wait(&sem_thread);          // 等待子线程的回合
        for (int i = 0; i < 2; i++) {
            printf("New thread loop %d, round %d\n", i+1, r+1);
        }
        sem_post(&sem_main);            // 通知主线程
    }
    return NULL;
}

int main() {
    pthread_t tid;
    sem_init(&sem_thread, 0, 1);   // 子线程先运行
    sem_init(&sem_main, 0, 0);

    pthread_create(&tid, NULL, thread_func, NULL);

    for (int r = 0; r < ROUNDS; r++) {
        sem_wait(&sem_main);            // 等待主线程的回合
        for (int i = 0; i < 4; i++) {
            printf("Main thread loop %d, round %d\n", i+1, r+1);
        }
        sem_post(&sem_thread);          // 通知子线程
    }

    pthread_join(tid, NULL);
    sem_destroy(&sem_thread);
    sem_destroy(&sem_main);
    return 0;
}