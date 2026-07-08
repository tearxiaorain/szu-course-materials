#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/types.h>
#include <sys/wait.h>

int main(void)
{
    if (fork() == 0)
    {
        printf("Child, PID = %d\n", getpid());
        exit(0);
    }
    else
    {
        printf("Parent, PID = %d\n", getpid());
        sleep(60);
    }
}
