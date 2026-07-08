#include <stdio.h>
#include <stdlib.h>
#include <fcntl.h>
#include <unistd.h>
#include <sys/types.h>

int main() {
    pid_t pid = getpid();
    char cmd[256];
    int fd1, fd2, fd3, fd4;

    // 打印当前进程 PID, 查看 /proc/PID/fd
    printf("进程 PID: %d\n", pid);

    // 打开前查看 /proc/PID/fd 
    printf("\n[1] 打开任何文件之前，/proc/%d/fd 内容：\n", pid);
    snprintf(cmd, sizeof(cmd), "ls -l /proc/%d/fd", pid);
    system(cmd);
    sleep(20);

    // 打开三个文件
    fd1 = open("file1.txt", O_CREAT | O_WRONLY | O_TRUNC, 0644);
    fd2 = open("file2.txt", O_CREAT | O_WRONLY | O_TRUNC, 0644);
    fd3 = open("file3.txt", O_CREAT | O_WRONLY | O_TRUNC, 0644);

    if (fd1 < 0 || fd2 < 0 || fd3 < 0) {
        perror("文件打开失败");
        return 1;
    }
    printf("\n打开的三个文件的文件描述符：fd1 = %d, fd2 = %d, fd3 = %d\n", fd1, fd2, fd3);

    // 打开后查看 /proc/PID/fd 
    printf("\n[2] 打开三个文件后，/proc/%d/fd 内容：\n", pid);
    system(cmd);
    sleep(20);

    // 关闭第二个文件
    close(fd2);
    printf("\n[3] 关闭第二个文件 (fd = %d) 后：\n", fd2);
    sleep(20);

    // 打开第四个文件 
    fd4 = open("file4.txt", O_CREAT | O_WRONLY | O_TRUNC, 0644);
    printf("新打开第四个文件的描述符：fd4 = %d\n", fd4);
    sleep(20);

    // 再次查看 /proc/PID/fd 
    printf("\n[4] 打开第四个文件后，/proc/%d/fd 内容：\n", pid);
    system(cmd);
    sleep(20);

    return 0;
}