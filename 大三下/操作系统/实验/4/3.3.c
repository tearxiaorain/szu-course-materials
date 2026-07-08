// task3.c
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <stdint.h>

int main() {
    printf("实验任务3：观察虚拟内存分配与释放\n");
    printf("进程 PID: %d\n", getpid());

    const size_t MB128 = 128 * 1024 * 1024;
    const size_t MB1024 = 1024 * 1024 * 1024;
    const size_t MB64 = 64 * 1024 * 1024;

    void *ptr[6] = {NULL};

    // ---------- 1. 连续分配六个 128MB ----------
    printf("\n=== 步骤1: 连续分配六个 128MB 空间 ===\n");
    for (int i = 0; i < 6; i++) {
        ptr[i] = malloc(MB128);
        if (ptr[i] == NULL) {
            printf("分配第 %d 个 128MB 失败\n", i + 1);
            return 1;
        }
        printf("已分配第 %d 块 128MB，起始地址: %p\n", i + 1, ptr[i]);
    }
    printf("请查看 /proc/%d/status 和 maps，然后按回车继续...\n", getpid());
    getchar();

    // ---------- 2. 释放第 2、3、5 号（索引 1、2、4） ----------
    printf("\n=== 步骤2: 释放第2、3、5号 128MB 空间 ===\n");
    void *old2 = ptr[1];
    void *old3 = ptr[2];
    void *old5 = ptr[4];
    free(ptr[1]);  ptr[1] = NULL;
    printf("已释放第2号 (原地址 %p)\n", old2);
    free(ptr[2]);  ptr[2] = NULL;
    printf("已释放第3号 (原地址 %p)\n", old3);
    free(ptr[4]);  ptr[4] = NULL;
    printf("已释放第5号 (原地址 %p)\n", old5);
    printf("请再次查看 /proc/%d/status 和 maps，按回车继续...\n", getpid());
    getchar();

    // ---------- 3. 再分配一个 1024MB ----------
    printf("\n=== 步骤3: 分配 1024MB 空间 ===\n");
    void *big = malloc(MB1024);
    if (big == NULL) {
        printf("分配 1024MB 失败\n");
        return 1;
    }
    printf("1024MB 分配成功，起始地址: %p\n", big);
    printf("查看 /proc/%d/status 和 maps，按回车继续...\n", getpid());
    getchar();

    // ---------- 4. 再分配一个 64MB，记录其位置 ----------
    printf("\n=== 步骤4: 再分配 64MB 空间 ===\n");
    printf("预测：64MB 可能复用已释放的某个 128MB 空洞（候选起始地址：%p / %p / %p）\n",
           old2, old3, old5);
    void *small = malloc(MB64);
    if (small == NULL) {
        printf("分配 64MB 失败\n");
        return 1;
    }
    printf("64MB 分配成功，起始地址: %p\n", small);
    int in_hole2 = ((uintptr_t)small >= (uintptr_t)old2) && ((uintptr_t)small < (uintptr_t)old2 + MB128);
    int in_hole3 = ((uintptr_t)small >= (uintptr_t)old3) && ((uintptr_t)small < (uintptr_t)old3 + MB128);
    int in_hole5 = ((uintptr_t)small >= (uintptr_t)old5) && ((uintptr_t)small < (uintptr_t)old5 + MB128);
    if (in_hole2 || in_hole3 || in_hole5) {
        printf("对比结果：64MB 地址落入已释放的 128MB 空洞，和“复用空洞”预测一致。\n");
    } else {
        printf("对比结果：64MB 地址未落入这3个已释放空洞，和“复用空洞”预测不一致。\n");
    }
    printf("最后一次查看 /proc/%d/maps，按回车结束程序...\n", getpid());
    getchar();

    // 清理（实际上程序退出后系统会回收，但保持良好习惯）
    free(ptr[0]); free(ptr[3]); free(ptr[5]); // 释放剩余的三块
    free(big);
    free(small);

    return 0;
}