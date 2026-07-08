// task4.c
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

int main() {
    printf("实验任务4：测试单进程最大虚拟内存\n");
    printf("进程 PID: %d\n", getpid());

    // 从较大步长开始尝试，失败则减半，直到步长为0
    size_t step = 1024UL * 1024 * 1024;   // 1 GiB
    size_t total = 0;
    int count = 0;

    while (step > 0) {
        void *p = malloc(step);
        if (p != NULL) {
            total += step;
            count++;
            printf("第 %d 次分配成功, ", count);
            printf("分配 %zu KiB (%zu MiB) 成功，累计 %zu MiB (%.2f GiB)\n",
                   step / 1024, step / (1024 * 1024), total / (1024 * 1024), total / (1024.0 * 1024.0 * 1024.0));
            // 不写入任何数据，只测试虚拟地址空间
        } else {
            printf("分配 %zu KiB (%zu MiB) 失败，缩小步长重试...\n", step / 1024, step / (1024 * 1024));
            sleep(3);
            step /= 2;
            if(step < 1024) { // 最小步长为1kB
                break;
            }
        }
    }

    printf("\n单个进程最大可分配虚拟内存: %zu 字节 (%.2f GiB)\n",
           total, total / (1024.0 * 1024.0 * 1024.0));
    printf("按回车退出...\n");
    getchar();
    return 0;
}