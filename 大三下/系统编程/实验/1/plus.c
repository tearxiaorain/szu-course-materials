#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/types.h>
#include <sys/wait.h>

int i = 5;

int main(void)
{
    int pid = fork();
    if (pid == 0)
    {
        printf("Child, i = %d\n", i);
    }
    else
    {
        i++;
        printf("Parent, i = %d\n", i);
    }
    exit(0);
}
