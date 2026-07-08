#include <fcntl.h>      /* O_CREAT, O_RDWR, O_RDONLY */
#include <stdio.h>       /* fprintf, sprintf, perror */
#include <stdlib.h>      /* exit, getpid */
#include <stdbool.h>     /* bool, true, false */
#include <unistd.h>      /* read, write, lseek, close, unlink, getpid */

/* ===== 宏定义 ===== */
#define BUFFER_SIZE  4096        /* 复制缓冲区大小 */
#define NAME_SIZE    12          /* 临时文件名最大长度 */
#define MAX_LINES    100000      /* 文件最大行数 */

/* ===== 全局变量 ===== */
static const char *fileName = NULL;      /* 指向输入文件名 */
static char  tmpName[NAME_SIZE];         /* 临时文件名缓冲区 */
static bool  charOption     = false;     /* -c 选项：反转每行字符 */
static bool  standardInput  = false;     /* 是否从标准输入读取 */
static int   lineCount      = 0;         /* 输入总行数 */
static int   lineStart[MAX_LINES];       /* 每行在文件中的偏移量 */
static int   fileOffset     = 0;         /* 当前文件读取位置 */
static int   fd;                         /* 输入文件描述符 */

/* ===== 函数原型声明 ===== */
static void parseCommandLine(int argc, char *argv[]);
static void processOptions(const char *str);
static void usageError(void);
static void pass1(void);
static void trackLines(const char *buffer, int charsRead);
static int  pass2(void);
static void processLine(int i);
static void reverseLine(char *buffer, int size);
static void fatalError(void);

/* ===== main ===== */
int main(int argc, char *argv[])
{
    parseCommandLine(argc, argv);   /* 解析命令行参数 */
    pass1();                        /* 第一遍：扫描输入，记录行偏移 */
    pass2();                        /* 第二遍：逆序输出各行 */
    return 0;
}

/* ===== parseCommandLine：解析命令行参数 ===== */
static void parseCommandLine(int argc, char *argv[])
{
    for (int i = 1; i < argc; i++) {
        if (argv[i][0] == '-')
            processOptions(argv[i]);          /* 处理 -c 等选项 */
        else if (fileName == NULL)
            fileName = argv[i];               /* 第一个非选项参数 = 文件名 */
        else
            usageError();                     /* 多余参数 → 报错 */
    }
    standardInput = (fileName == NULL);       /* 无文件名 → 从标准输入读取 */
}

/* ===== processOptions：解析选项字符串（如 "-c"） ===== */
static void processOptions(const char *str)
{
    for (int j = 1; str[j] != '\0'; j++) {
        switch (str[j]) {
        case 'c':
            charOption = true;
            break;
        default:
            usageError();
            break;
        }
    }
}

/* ===== usageError：打印用法并退出 ===== */
static void usageError(void)
{
    fprintf(stderr, "Usage: reverse -c [filename]\n");
    exit(1);
}

/* ===== pass1：第一遍扫描 —— 记录每行在文件中的起始偏移 ===== */
static void pass1(void)
{
    int  tmpfd, charsRead, charsWritten;
    char buffer[BUFFER_SIZE];

    if (standardInput) {
        /* 从标准输入读取 → 先写入临时文件（因为stdin不支持lseek） */
        fd = STDIN_FILENO;
        sprintf(tmpName, ".rev.%d", getpid());   /* 生成唯一临时文件名 */
        tmpfd = open(tmpName, O_CREAT | O_RDWR, 0600);
        if (tmpfd == -1) fatalError();
    } else {
        /* 打开命名文件 */
        fd = open(fileName, O_RDONLY);
        if (fd == -1) fatalError();
    }

    lineStart[0] = 0;   /* 第一行从偏移 0 开始 */

    while (true) {
        charsRead = (int) read(fd, buffer, BUFFER_SIZE);
        if (charsRead == 0)  break;            /* EOF */
        if (charsRead == -1) fatalError();     /* 读错误 */
        trackLines(buffer, charsRead);         /* 扫描换行符并记录偏移 */

        if (standardInput) {
            /* 同时将数据写入临时文件，供 pass2 回读 */
            charsWritten = (int) write(tmpfd, buffer, charsRead);
            if (charsWritten != charsRead) fatalError();
        }
    }

    /* 记录末尾行偏移（即文件总大小） */
    lineStart[lineCount + 1] = fileOffset;

    /* 若为标准输入，将 fd 切换到临时文件供 pass2 使用 */
    if (standardInput) fd = tmpfd;
}

/* ===== trackLines：扫描缓冲区中的换行符，记录每行起始偏移 ===== */
static void trackLines(const char *buffer, int charsRead)
{
    for (int i = 0; i < charsRead; i++) {
        ++fileOffset;                               /* 累计文件偏移 */
        if (buffer[i] == '\n')
            lineStart[++lineCount] = fileOffset;    /* 记录下一行起始位置 */
    }
}

/* ===== pass2：第二遍扫描 —— 逆序读取并输出每一行 ===== */
static int pass2(void)
{
    for (int i = lineCount - 1; i >= 0; i--)
        processLine(i);                    /* 从最后一行往前逐行处理 */

    close(fd);                             /* 关闭文件 */
    if (standardInput)
        unlink(tmpName);                   /* 删除临时文件 */

    return 0;
}

/* ===== processLine：读取第 i 行并输出（可选反转字符） ===== */
static void processLine(int i)
{
    char buffer[BUFFER_SIZE];
    int  lineLen = lineStart[i + 1] - lineStart[i];   /* 行长度（含换行符） */

    lseek(fd, lineStart[i], SEEK_SET);                 /* 定位到行首 */
    int charsRead = (int) read(fd, buffer, lineLen);   /* 读取整行 */

    if (charOption)
        reverseLine(buffer, charsRead);                /* -c：反转行内字符 */

    write(STDOUT_FILENO, buffer, charsRead);           /* 输出到标准输出 */
}

/* ===== reverseLine：原地反转缓冲区中的字符（保留末尾换行符） ===== */
static void reverseLine(char *buffer, int size)
{
    int start = 0, end = size - 1;
    char tmp;

    if (buffer[end] == '\n') --end;   /* 保留末尾换行符不动 */

    while (start < end) {
        tmp           = buffer[start];
        buffer[start] = buffer[end];
        buffer[end]   = tmp;
        ++start;
        --end;
    }
}

/* ===== fatalError：打印系统错误并退出 ===== */
static void fatalError(void)
{
    perror("reverse:");
    exit(1);
} 
