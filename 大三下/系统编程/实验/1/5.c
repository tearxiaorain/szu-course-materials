#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/types.h>
#include <sys/wait.h>

int main(int argc, char *argv[])
{
    const char *name = (argc > 1) ? argv[1] : "proc";
    fprintf(stderr, "%s: PID=%d PPID=%d PGID=%d SID=%d\n",
            name, getpid(), getppid(), getpgrp(), getsid(0));
    sleep(30);
    return 0;
}