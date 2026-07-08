#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>
#include <semaphore.h>

#define ROUNDS 5

sem_t sem1, sem2, sem3, sem4;

void *p1_func(void *arg) {
    for (int i = 0; i < ROUNDS; i++) {
        sem_wait(&sem1);
        printf("p%lu*", (unsigned long)pthread_self());
        sem_post(&sem2);
    }
    return NULL;
}

void *p2_func(void *arg) {
    for (int i = 0; i < ROUNDS; i++) {
        sem_wait(&sem2);
        printf("p%lu**", (unsigned long)pthread_self());
        sem_post(&sem3);
    }
    return NULL;
}

void *p3_func(void *arg) {
    for (int i = 0; i < ROUNDS; i++) {
        sem_wait(&sem3);
        printf("p%lu***", (unsigned long)pthread_self());
        sem_post(&sem4);
    }
    return NULL;
}

void *p4_func(void *arg) {
    for (int i = 0; i < ROUNDS; i++) {
        sem_wait(&sem4);
        printf("p%lu****", (unsigned long)pthread_self());
        sem_post(&sem1);
    }
    return NULL;
}

int main() {
    pthread_t t1, t2, t3, t4;

    sem_init(&sem1, 0, 1);   // p1 最先执行
    sem_init(&sem2, 0, 0);
    sem_init(&sem3, 0, 0);
    sem_init(&sem4, 0, 0);

    pthread_create(&t1, NULL, p1_func, NULL);
    pthread_create(&t2, NULL, p2_func, NULL);
    pthread_create(&t3, NULL, p3_func, NULL);
    pthread_create(&t4, NULL, p4_func, NULL);

    pthread_join(t1, NULL);
    pthread_join(t2, NULL);
    pthread_join(t3, NULL);
    pthread_join(t4, NULL);

    printf("\n");  // 换行美观
    sem_destroy(&sem1);
    sem_destroy(&sem2);
    sem_destroy(&sem3);
    sem_destroy(&sem4);
    return 0;
}