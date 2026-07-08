#include <unistd.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include <sys/shm.h>
#include <sys/wait.h>
#include <semaphore.h>
#include "shm_com_sem.h"  

int main() {
    void* shared_memory = (void*)0;
    struct shared_mem_st* shared_stuff;

    int shmid;
    int num_read;
    pid_t fork_result;
    sem_t* sem_queue, * sem_queue_empty, * sem_queue_full;

    shmid = shmget((key_t)1234, sizeof(struct shared_mem_st), 0666 | IPC_CREAT);
    if (shmid == -1) {
        perror("shmger failed");
        exit(1);
    }
    shared_memory = shmat(shmid, NULL, 0);
    if (shared_memory == (void*)-1) {
        perror("shmat failed");
        exit(1);
    }

    shared_stuff = (struct shared_mem_st*)shared_memory;

    sem_queue = sem_open(queue_mutex, 0);
    sem_queue_empty = sem_open(queue_empty, 0);
    sem_queue_full = sem_open(queue_full, 0);
    if (sem_queue == SEM_FAILED || sem_queue_empty == SEM_FAILED || sem_queue_full == SEM_FAILED) {
        perror("sem_open failed");
        exit(EXIT_FAILURE);
    }

    fork_result = fork();
    if (fork_result == -1) {
        fprintf(stderr, "Fork failure\n");
    }

    if (fork_result == 0) {
        while (1) {
            sem_wait(sem_queue_full);
            sem_wait(sem_queue);

            if (strcmp(shared_stuff->buffer[shared_stuff->line_read], "quit") == 0) {
                break;
            }
            printf("[Child PID : %d] Consumed: %s\n", getpid(), shared_stuff->buffer[shared_stuff->line_read]);

            shared_stuff->line_read++;
            shared_stuff->line_read %= NUM_LINE;

            sem_post(sem_queue);
            sem_post(sem_queue_empty);

            usleep(500000);
        }

        sem_post(sem_queue);
        sem_post(sem_queue_full); 
        sem_post(sem_queue_empty); 
        printf("[Child] Received quit signal.Exiting now......\n");
        exit(EXIT_SUCCESS);
    }

    else {
        while (1) {

            sem_wait(sem_queue_full);
            sem_wait(sem_queue);

            if (strcmp(shared_stuff->buffer[shared_stuff->line_read], "quit") == 0) {

                sem_post(sem_queue);
                sem_post(sem_queue_full);
                sem_post(sem_queue_empty);
                break;
            }
            printf("[Parent PID : %d] Consumed: %s\n", getpid(), shared_stuff->buffer[shared_stuff->line_read]);

            shared_stuff->line_read++;
            shared_stuff->line_read %= NUM_LINE;

            sem_post(sem_queue);
            sem_post(sem_queue_empty);

            usleep(500000);
        }

        waitpid(fork_result, NULL, 0);
        printf("[Parent] Received quit signal. Exiting...\n");
        sem_close(sem_queue);
        sem_close(sem_queue_full);
        sem_close(sem_queue_empty);


        sem_unlink(queue_mutex);
        sem_unlink(queue_empty);
        sem_unlink(queue_full);

        shmdt(shared_memory);   
        shmctl(shmid, IPC_RMID, NULL);  
    }
    exit(EXIT_SUCCESS);
}