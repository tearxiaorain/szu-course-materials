#include <stdio.h>
#include <unistd.h>
#include <stdlib.h>

int main() 
{
    int pid = fork();
    int a = 0;
    sleep(10);
    if (pid == 0) 
    {
        // 子进程：睡眠确保父进程先退出
        sleep(2);
        // 保持存活以便观察
        while (1)
        {
            a++;
        }
    } 
    else if(pid > 0)
    {
        // 父进程：立即退出，使子进程成为孤儿
        exit(0);
    }
}