#include <stdio.h>
#include <unistd.h>
#include <sys/types.h>
#include <time.h>

int main() 
{
    pid_t pid = getpid();
    int a = 0;
    while (1) 
    {
        // 运行状态：执行忙等待，占用CPU
        printf("[RUNNING] PID %d 正在运行（CPU忙等待5秒）\n", pid);
        time_t start = time(NULL);
        while (time(NULL) - start < 5) 
        {
            a++;// 空循环模拟CPU计算
        }
        // 阻塞状态：调用sleep进入可中断睡眠
        printf("[SLEEPING] PID %d 进入睡眠5秒（状态变为S）\n", pid);
        sleep(5);
    }
    return 0;
}