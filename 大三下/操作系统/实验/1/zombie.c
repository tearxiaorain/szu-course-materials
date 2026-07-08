#include <stdio.h>
#include <unistd.h>
#include <stdlib.h>

int main() 
{
    int pid = fork();
    if (pid == 0) 
    {
        // 子进程立即退出，成为僵尸（如果父进程不wait）
        exit(0);
    }
    else if (pid > 0) 
    {
        // 父进程不调用wait，一直睡眠，让子进程保持僵尸态
        while (1) sleep(10);
    }
}