// sem_cat.c
#include <semaphore.h>
#include <stdio.h>
#include <stdlib.h>

int main(int argc, char *argv[]) {
    if (argc != 2) {
        fprintf(stderr, "Usage: %s <sem_name>\n", argv[0]);
        exit(1);
    }
    sem_t *sem = sem_open(argv[1], 0);
    if (sem == SEM_FAILED) {
        perror("sem_open");
        exit(1);
    }
    int val;
    if (sem_getvalue(sem, &val) == -1) {
        perror("sem_getvalue");
        sem_close(sem);
        exit(1);
    }
    printf("Semaphore %s value = %d\n", argv[1], val);
    sem_close(sem);
    return 0;
}