/* chatserver.c */

#include <unistd.h>
#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <sys/types.h>
#include <fcntl.h>
#include "clientinfo.h"
#include <signal.h> 
#include <sys/stat.h>
#include <sys/select.h>
#include <errno.h>

#define FIFO_1 "/home/yaojianwen2023150131/chatsystem/data/server_fifo/chat_server_fifo_1"
#define FIFO_2 "/home/yaojianwen2023150131/chatsystem/data/server_fifo/chat_server_fifo_2"
#define FIFO_3 "/home/yaojianwen2023150131/chatsystem/data/server_fifo/chat_server_fifo_3"
#define USERS_FILE "/home/yaojianwen2023150131/chatsystem/data/users.txt"
#define MAX_USERS 128

typedef struct {
    char name[256];
    char passwd[256];
    char clientfifo[256];
    int online;
} USERINFO;

static USERINFO users[MAX_USERS];
static int users_count = 0;

static int find_user_index(const char *name) {
    int i;
    for (i = 0; i < users_count; i++) {
        if (strcmp(users[i].name, name) == 0) {
            return i;
        }
    }
    return -1;
}

static void load_users(void) {
    FILE *fp;
    char name[256];
    char passwd[256];

    fp = fopen(USERS_FILE, "r");
    if (fp == NULL) {
        return;
    }

    while (users_count < MAX_USERS && fscanf(fp, "%255s %255s", name, passwd) == 2) {
        strcpy(users[users_count].name, name);
        strcpy(users[users_count].passwd, passwd);
        users[users_count].clientfifo[0] = '\0';
        users[users_count].online = 0;
        users_count++;
    }

    fclose(fp);
}

static int save_user(const char *name, const char *passwd) {
    FILE *fp;

    fp = fopen(USERS_FILE, "a");
    if (fp == NULL) {
        return -1;
    }

    fprintf(fp, "%s %s\n", name, passwd);
    fclose(fp);
    return 0;
}


void handler(int sig) {
    unlink(FIFO_1);
    unlink(FIFO_2);
    unlink(FIFO_3);
    exit(1);
}

int register_user(CLIENTINFOPTR_1 info) {
    int idx;

    if (info == NULL || info->name[0] == '\0') {
        return -1;
    }

    idx = find_user_index(info->name);
    if (idx >= 0) {
        return -1;
    }

    if (users_count >= MAX_USERS) {
        return -1;
    }

    strcpy(users[users_count].name, info->name);
    strcpy(users[users_count].passwd, info->passwd);
    strcpy(users[users_count].clientfifo, info->clientfifo);
    users[users_count].online = 0;
    users_count++;

    if (save_user(info->name, info->passwd) != 0) {
        return -1;
    }

    return 0;
}
int login(CLIENTINFOPTR_2 info) {
    int idx;

    if (info == NULL || info->name[0] == '\0') {
        return -1;
    }

    idx = find_user_index(info->name);
    if (idx < 0) {
        return -1;
    }

    if (strcmp(users[idx].passwd, info->passwd) != 0) {
        return -1;
    }

    strcpy(users[idx].clientfifo, info->clientfifo);
    users[idx].online = 1;
    return 0;
}
int send_message(CLIENTINFOPTR_3 info) {
    int from_idx;
    int to_idx;
    int fd;
    char msgbuf[512];

    if (info == NULL || info->from_user[0] == '\0' || info->to_user[0] == '\0') {
        return -1;
    }

    from_idx = find_user_index(info->from_user);
    if (from_idx < 0 || users[from_idx].online == 0) {
        return -1;
    }

    to_idx = find_user_index(info->to_user);
    if (to_idx < 0 || users[to_idx].online == 0) {
        return -1;
    }

    snprintf(msgbuf, sizeof(msgbuf), "[%s]: %s", info->from_user, info->message);
    fd = open(users[to_idx].clientfifo, O_WRONLY | O_NONBLOCK);
    if (fd == -1) {
        return -1;
    }

    write(fd, msgbuf, strlen(msgbuf) + 1);
    close(fd);
    return 0;
}

int main() {
    int res;
    int res1, res2, res3;
    int i;
    int fifo_fd_1, fifo_fd_2, fifo_fd_3, fdl;
    int fifo_w_1, fifo_w_2, fifo_w_3;
    CLIENTINFO_1 info1;
    CLIENTINFO_2 info2;
    CLIENTINFO_3 info3;

    char buffer[100];

    signal(SIGKILL, handler);
    signal(SIGINT, handler);
    signal(SIGTERM, handler);

    load_users();

    /* create FIFO, if necessary */
    if (access(FIFO_1, F_OK) == -1) {
        res = mkfifo(FIFO_1, 0777);
        if (res != 0) {
            printf("FIFO %s was not created\n", FIFO_1);
            exit(EXIT_FAILURE);
        }
    }

    if (access(FIFO_2, F_OK) == -1) {
        res = mkfifo(FIFO_2, 0777);
        if (res != 0) {
            printf("FIFO %s was not created\n", FIFO_2);
            exit(EXIT_FAILURE);
        }
    }

    if (access(FIFO_3, F_OK) == -1) {
        res = mkfifo(FIFO_3, 0777);
        if (res != 0) {
            printf("FIFO %s was not created\n", FIFO_3);
            exit(EXIT_FAILURE);
        }
    }

    /* open FIFO for reading (non-blocking) */
    fifo_fd_1 = open(FIFO_1, O_RDONLY | O_NONBLOCK);
    if (fifo_fd_1 == -1) {
        printf("Could not open %s for read only access\n", FIFO_1);
        exit(EXIT_FAILURE);
    }

    fifo_fd_2 = open(FIFO_2, O_RDONLY | O_NONBLOCK);
    if (fifo_fd_2 == -1) {
        printf("Could not open %s for read only access\n", FIFO_2);
        exit(EXIT_FAILURE);
    }

    fifo_fd_3 = open(FIFO_3, O_RDONLY | O_NONBLOCK);
    if (fifo_fd_3 == -1) {
        printf("Could not open %s for read only access\n", FIFO_3);
        exit(EXIT_FAILURE);
    }

    /* keep write ends open to avoid EOF when no writers */
    fifo_w_1 = open(FIFO_1, O_WRONLY | O_NONBLOCK);
    fifo_w_2 = open(FIFO_2, O_WRONLY | O_NONBLOCK);
    fifo_w_3 = open(FIFO_3, O_WRONLY | O_NONBLOCK);

    printf("\nServer is rarin' to go!\n");

    while (1) {
        fd_set readfds;
        int maxfd;

        FD_ZERO(&readfds);
        FD_SET(fifo_fd_1, &readfds);
        FD_SET(fifo_fd_2, &readfds);
        FD_SET(fifo_fd_3, &readfds);

        maxfd = fifo_fd_1;
        if (fifo_fd_2 > maxfd) {
            maxfd = fifo_fd_2;
        }
        if (fifo_fd_3 > maxfd) {
            maxfd = fifo_fd_3;
        }

        res = select(maxfd + 1, &readfds, NULL, NULL, NULL);
        if (res < 0) {
            if (errno == EINTR) {
                continue;
            }
            perror("select");
            break;
        }

        if (FD_ISSET(fifo_fd_1, &readfds)) {
            res1 = read(fifo_fd_1, &info1, sizeof(CLIENTINFO_1));
        } else {
            res1 = 0;
        }

        if (FD_ISSET(fifo_fd_2, &readfds)) {
            res2 = read(fifo_fd_2, &info2, sizeof(CLIENTINFO_2));
        } else {
            res2 = 0;
        }

        if (FD_ISSET(fifo_fd_3, &readfds)) {
            res3 = read(fifo_fd_3, &info3, sizeof(CLIENTINFO_3));
        } else {
            res3 = 0;
        }

        if (res1 > 0) {
            printf("Client arrived!!\n");
            res = register_user((CLIENTINFOPTR_1)&info1);
            if(res == 0) {
                sprintf(buffer, "Registration successful");
            } else {
                sprintf(buffer, "Registration failed");
            }
            fdl = open(info1.clientfifo, O_WRONLY | O_NONBLOCK);
            write(fdl, buffer, strlen(buffer)+1);
            close(fdl);
        }

        if (res2 > 0) {
            printf("Client arrived!!\n");
            res = login((CLIENTINFOPTR_2)&info2);
            if(res == 0) {
                sprintf(buffer, "Login successful");
            } else {
                sprintf(buffer, "Login failed");
            }
            fdl = open(info2.clientfifo, O_WRONLY | O_NONBLOCK);
            write(fdl, buffer, strlen(buffer)+1);
            close(fdl);
        }

        if (res3 > 0) {
            printf("Client arrived!!\n");
            res = send_message((CLIENTINFOPTR_3)&info3);
            if(res == 0) {
                sprintf(buffer, "Message sent successfully");
            } else {
                sprintf(buffer, "Failed to send message");
            }
            fdl = open(info3.clientfifo, O_WRONLY | O_NONBLOCK);
            write(fdl, buffer, strlen(buffer)+1);
            close(fdl);
        }
    }

    exit(0);
}