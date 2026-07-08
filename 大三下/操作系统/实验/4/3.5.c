// task5.c
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <string.h>

#define SIZE (256UL * 1024 * 1024)   // 256 MB

int main() {
    printf("实验任务5：观察物理内存的惰性分配\n");
    printf("进程 PID: %d\n", getpid());

    volatile char *arr;
    volatile char tmp;

    // ========== 阶段1：分配后不访问 ==========
    printf("\n====== 阶段1: 分配256MB但不读写 ======\n");
    arr = (volatile char *)malloc(SIZE);
    if (arr == NULL) {
        printf("malloc 失败\n");
        return 1;
    }
    printf("已分配256MB虚拟内存，起始地址: %p\n", (void*)arr);
    printf("请立即查看 /proc/%d/status (VmSize, VmRSS)，按回车继续...\n", getpid());
    getchar();

    // ========== 阶段2：每4KB进行读操作 ==========
    printf("\n====== 阶段2: 每隔4KB进行一次读操作 ======\n");
    for (size_t i = 0; i < SIZE; i += 4096) {
        tmp = arr[i];   // 只读，触发缺页分配物理内存
    }
    printf("读操作完成（tmp=%d，避免优化）\n", tmp);
    printf("请再次查看 /proc/%d/status (VmRSS 应接近 256MB)，按回车继续...\n", getpid());
    getchar();

    // ========== 阶段3：释放后重新分配，执行写操作 ==========
    printf("\n====== 阶段3: 释放并重新分配256MB，然后每4KB写操作 ======\n");
    free((void*)arr);
    arr = (volatile char *)malloc(SIZE);
    if (arr == NULL) {
        printf("第二次 malloc 失败\n");
        return 1;
    }
    printf("重新分配256MB，起始地址: %p\n", (void*)arr);
    printf("此时物理内存应尚未分配，查看 status 确认，按回车开始写操作...\n");
    getchar();

    for (size_t i = 0; i < SIZE; i += 4096) {
        arr[i] = (char)(i & 0xFF);  // 写操作
    }
    printf("写操作完成。\n");
    printf("最后查看 /proc/%d/status (VmRSS 应再次接近 256MB)，按回车退出...\n", getpid());
    getchar();

    free((void*)arr);
    return 0;
}