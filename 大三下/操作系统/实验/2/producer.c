#include <unistd.h>     
#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <sys/shm.h>    
#include "shm_com_sem.h" 

int main(void) {
    void* shared_memory = (void*)0;          
    struct shared_mem_st* shared_stuff;       

    char key_line[256];      
    int shmid; 
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

    sem_queue = sem_open(queue_mutex, O_CREAT, 0644, 1);
    sem_queue_empty = sem_open(queue_empty, O_CREAT, 0644, NUM_LINE);
    sem_queue_full = sem_open(queue_full, O_CREAT, 0644, 0);

    if (sem_queue == SEM_FAILED || sem_queue_empty == SEM_FAILED || sem_queue_full == SEM_FAILED) {
        perror("sem_open failed");
        exit(EXIT_FAILURE);
    }

    shared_stuff->line_write = 0;
    shared_stuff->line_read = 0;

    while (1) {
        printf("Enter your text ('quit' to exit): ");
        fgets(key_line, LINE_SIZE, stdin);
        key_line[strcspn(key_line, "\n")] = '\0';

        if (strcmp(key_line, "quit") == 0) {
            sem_wait(sem_queue_empty);
            sem_wait(sem_queue);

            strncpy(shared_stuff->buffer[shared_stuff->line_write], key_line, LINE_SIZE);

            sem_post(sem_queue);
            sem_post(sem_queue_full);

            sleep(2);
            break;
        }

        sem_wait(sem_queue_empty);
        sem_wait(sem_queue);

        strncpy(shared_stuff->buffer[shared_stuff->line_write], key_line, LINE_SIZE);

        shared_stuff->line_write++;
        shared_stuff->line_write %= NUM_LINE;

        sem_post(sem_queue);
        sem_post(sem_queue_full);
    }

    sem_close(sem_queue);
    sem_close(sem_queue_empty);
    sem_close(sem_queue_full);

    shmdt(shared_memory);

    return 0;
}