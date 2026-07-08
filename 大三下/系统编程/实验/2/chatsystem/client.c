/* client.c */

#include <unistd.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <signal.h>
#include <errno.h>
#include <pthread.h>
#include "clientinfo.h"

#define FIFO_1 "/home/yaojianwen2023150131/chatsystem/data/server_fifo/chat_server_fifo_1"
#define FIFO_2 "/home/yaojianwen2023150131/chatsystem/data/server_fifo/chat_server_fifo_2"
#define FIFO_3 "/home/yaojianwen2023150131/chatsystem/data/server_fifo/chat_server_fifo_3"

#define BUFF_SZ 100

char mypipename[BUFF_SZ];
static int g_my_fifo = -1;
static volatile sig_atomic_t g_running = 1;
static pthread_t g_recv_thread;
static int g_recv_thread_started = 0;

void handler(int sig) {  /* remove pipe if signaled */
    g_running = 0;
    if (g_my_fifo != -1) {
        close(g_my_fifo);
    }
    unlink(mypipename);
    exit(1);
}

static void *recv_loop(void *arg) {
    char buf[BUFF_SZ];
    int res;

    (void)arg;
    while (g_running) {
        if (g_my_fifo == -1) {
            usleep(100000);
            continue;
        }

        memset(buf, '\0', sizeof(buf));
        res = read(g_my_fifo, buf, sizeof(buf));
        if (res > 0) {
            printf("\n[recv] %s\n", buf);
            fflush(stdout);
        } else if (res == -1 && errno != EAGAIN) {
            usleep(100000);
        } else {
            usleep(100000);
        }
    }

    return NULL;
}

int main(int argc, char *argv[]) {
    int res;
    int fifo_fd = -1, my_fifo = -1;
    int fd;
    CLIENTINFO_1 info_1;
    CLIENTINFO_2 info_2;
    CLIENTINFO_3 info_3;
    int mode = 0; // 1 for register, 2 for login, 3 for send message
    int logged_in = 0;
    char current_user[256];
    char buffer[BUFF_SZ];

    /* handle some signals */
    signal(SIGKILL, handler);
    signal(SIGINT, handler);
    signal(SIGTERM, handler);

    while(1)
    {
        switch(mode) {
            case 0: printf("Please enter 1 to register, 2 to login, 3 to send message\n");
                    scanf("%d", &mode);
                    break;

            case 1: printf("Please enter username and password for registration\n");
                    scanf("%s %s", info_1.name, info_1.passwd);

                    /* check if server fifo exists */
                    if (access(FIFO_1, F_OK) == -1) {
                        printf("Could not open FIFO %s\n", FIFO_1);
                        exit(EXIT_FAILURE);
                    }
                    /* open server fifo for write */
                    fifo_fd = open(FIFO_1, O_WRONLY);
                    if (fifo_fd == -1) {
                        printf("Could not open %s for write access\n", FIFO_1);
                        exit(EXIT_FAILURE);
                    }

                    /* create my own FIFO */
                    sprintf(mypipename, "/home/yaojianwen2023150131/chatsystem/data/client_fifo/chat_client_fifo_%s", info_1.name);
                    res = mkfifo(mypipename, 0777);
                    if (res != 0) {
                        printf("FIFO %s was not created\n", mypipename);
                        exit(EXIT_FAILURE);
                    }

                    /* open my own FIFO for reading */
                    my_fifo = open(mypipename, O_RDONLY | O_NONBLOCK);
                    if (my_fifo == -1) {
                        printf("Could not open %s for read only access\n", mypipename);
                        exit(EXIT_FAILURE);
                    }
                    g_my_fifo = my_fifo;

                    /* construct client info */
                    strcpy(info_1.clientfifo, mypipename);

                    /* write client info to server fifo */
                    write(fifo_fd, &info_1, sizeof(CLIENTINFO_1));
                    close(fifo_fd);

                    /* get result from server */
                    memset(buffer, '\0', BUFF_SZ);
                    while (1) {
                        res = read(my_fifo, buffer, BUFF_SZ);
                        if (res > 0) {
                            printf("Received from server: %s\n", buffer);
                            break;
                        }
                    }

                    mode = 0;
                    break;

            case 2: printf("Please enter username and password for login\n");
                    scanf("%s %s", info_2.name, info_2.passwd);

                    /* check if server fifo exists */
                    if (access(FIFO_2, F_OK) == -1) {
                        printf("Could not open FIFO %s\n", FIFO_2);
                        exit(EXIT_FAILURE);
                    }
                    /* open server fifo for write */
                    fifo_fd = open(FIFO_2, O_WRONLY);
                    if (fifo_fd == -1) {
                        printf("Could not open %s for write access\n", FIFO_2);
                        exit(EXIT_FAILURE);
                    }

                    /* create/open my own FIFO */
                    sprintf(mypipename, "/home/yaojianwen2023150131/chatsystem/data/client_fifo/chat_client_fifo_%s", info_2.name);
                    res = mkfifo(mypipename, 0777);
                    if (res != 0 && errno != EEXIST) {
                        printf("FIFO %s was not created\n", mypipename);
                        exit(EXIT_FAILURE);
                    }

                    if (my_fifo == -1) {
                        my_fifo = open(mypipename, O_RDONLY | O_NONBLOCK);
                        if (my_fifo == -1) {
                            printf("Could not open %s for read only access\n", mypipename);
                            exit(EXIT_FAILURE);
                        }
                        g_my_fifo = my_fifo;
                    }

                    /* construct client info */
                    strcpy(info_2.clientfifo, mypipename);

                    /* write client info to server fifo */
                    write(fifo_fd, &info_2, sizeof(CLIENTINFO_2));
                    close(fifo_fd);

                    /* get result from server */
                    memset(buffer, '\0', BUFF_SZ);
                    while (1) {
                        res = read(my_fifo, buffer, BUFF_SZ);
                        if (res > 0) {
                            printf("Received from server: %s\n", buffer);
                            break;
                        }
                    }

                    if (strstr(buffer, "successful") != NULL) {
                        logged_in = 1;
                        strcpy(current_user, info_2.name);
                        if (!g_recv_thread_started) {
                            pthread_create(&g_recv_thread, NULL, recv_loop, NULL);
                            g_recv_thread_started = 1;
                        }
                    } else {
                        logged_in = 0;
                        current_user[0] = '\0';
                    }

                    mode = 0;
                    break;

            case 3: if (!logged_in) {
                        printf("Please login first\n");
                        mode = 0;
                        break;
                    }

                    printf("Please enter recipient's name and message\n");
                    scanf("%s %s", info_3.to_user, info_3.message);

                    /* check if server fifo exists */
                    if (access(FIFO_3, F_OK) == -1) {
                        printf("Could not open FIFO %s\n", FIFO_3);
                        exit(EXIT_FAILURE);
                    }
                    /* open server fifo for write */
                    fifo_fd = open(FIFO_3, O_WRONLY);
                    if (fifo_fd == -1) {
                        printf("Could not open %s for write access\n", FIFO_3);
                        exit(EXIT_FAILURE);
                    }

                    strcpy(info_3.from_user, current_user);
                    strcpy(info_3.clientfifo, mypipename);

                    /* write chat info to server fifo */
                    write(fifo_fd, &info_3, sizeof(CLIENTINFO_3));
                    close(fifo_fd);

                    mode = 0;
                    break;
        }
    } 

    printf("Client %d is terminating\n", getpid());

    /* delete fifo from system */
    if (my_fifo != -1) {
        close(my_fifo);
    }
    (void)unlink(mypipename);

    exit(0);
}