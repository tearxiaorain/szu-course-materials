#include <stdio.h>       /* printf, fprintf, fflush, sprintf, perror */
#include <stdlib.h>      /* exit */
#include <string.h>      /* strcmp, strcpy */
#include <ctype.h>       /* isdigit */
#include <unistd.h>      /* sleep */
#include <dirent.h>      /* opendir, readdir, closedir, struct dirent */
#include <sys/stat.h>    /* stat, S_ISDIR, S_ISREG, S_ISCHR, S_ISBLK */
#include <stdbool.h>     /* bool, true, false */
#include <time.h>        /* localtime, asctime */

/* ===== 宏定义 ===== */
#define MAX_FILES           100
#define MAX_FILENAME        50
#define NOT_FOUND           -1
#define FOREVER             -1
#define DEFAULT_DELAY_TIME  10
#define DEFAULT_LOOP_COUNT  FOREVER

/* ===== 状态结构体：每个被监控文件对应一个 ===== */
typedef struct {
    char        fileName[MAX_FILENAME];  /* 文件名 */
    bool        lastCycle;               /* 上一轮是否存在 */
    bool        thisCycle;               /* 本轮是否存在 */
    struct stat status;                  /* stat() 获取的文件信息 */
} StatStruct;

/* ===== 全局变量 ===== */
static char      *fileNames[MAX_FILES];              /* 命令行传入的文件名列表 */
static int        fileCount;                          /* 命令行文件数量 */
static StatStruct stats[MAX_FILES];                   /* 状态数组 */
static int        loopCount = DEFAULT_LOOP_COUNT;     /* 循环次数（-1=无限） */
static int        delayTime = DEFAULT_DELAY_TIME;     /* 轮询间隔（秒） */

/* ===== 函数原型声明 ===== */
static void processOptions(const char *str);
static void parseCommandLine(int argc, char *argv[]);
static int  getNumber(const char *str, int *i);
static void usageError(void);
static void monitorLoop(void);
static void monitorFiles(void);
static void monitorFile(const char *fileName);
static void processDirectory(const char *dirName);
static void updateStat(const char *fileName, const struct stat *statBuf);
static int  findEntry(const char *fileName);
static int  addEntry(const char *fileName, const struct stat *statBuf);
static int  nextFree(void);
static void updateEntry(int index, const struct stat *statBuf);
static void printEntry(int index);
static void printStat(const struct stat *statBuf);
static void fatalError(void);

/* ===== main：程序入口 ===== */
int main(int argc, char *argv[])
{
    parseCommandLine(argc, argv);   /* 解析命令行参数 */
    monitorLoop();                  /* 进入主监控循环 */
    return 0;
}

/* ===== parseCommandLine：解析命令行参数 ===== */
static void parseCommandLine(int argc, char *argv[])
{
    for (int i = 1; (i < argc) && (fileCount < MAX_FILES); i++) {
        if (argv[i][0] == '-')
            processOptions(argv[i]);          /* -t10 或 -l5 等选项 */
        else
            fileNames[fileCount++] = argv[i]; /* 记录要监控的文件/目录名 */
    }
    if (fileCount == 0)
        usageError();  /* 至少需要一个文件名 */
}

/* ===== processOptions：解析选项字符串（如 "-t10"、"-l5"） ===== */
static void processOptions(const char *str)
{
    for (int j = 1; str[j] != '\0'; j++) {
        switch (str[j]) {
        case 't':
            delayTime = getNumber(str, &j);   /* -t<秒数>：设置轮询间隔 */
            break;
        case 'l':
            loopCount = getNumber(str, &j);   /* -l<次数>：设置循环次数 */
            break;
        default:
            usageError();
            break;
        }
    }
}

/* ===== getNumber：从选项字符串中提取紧跟的数字（如 "-t10" → 10） ===== */
static int getNumber(const char *str, int *i)
{
    int number = 0;
    int digits = 0;

    while (isdigit(str[(*i) + 1])) {
        number = number * 10 + str[++(*i)] - '0';
        ++digits;
    }
    if (digits == 0)
        usageError();   /* 选项后必须跟数字 */
    return number;
}

/* ===== usageError：打印用法提示并退出 ===== */
static void usageError(void)
{
    fprintf(stderr, "Usage: monitor -t<seconds> -l<loops> {filename}+\n");
    exit(1);
}

/* ===== monitorLoop：主监控循环 ===== */
static void monitorLoop(void)
{
    do {
        monitorFiles();          /* 扫描所有文件 */
        fflush(stdout);
        fflush(stderr);
        sleep(delayTime);       /* 等待指定秒数 */
    } while (loopCount == FOREVER || --loopCount > 0);
}

/* ===== monitorFiles：遍历所有命令行文件，并清理状态数组 ===== */
static void monitorFiles(void)
{
    /* 第一遍：对命令行指定的每个文件/目录调用 monitorFile */
    for (int i = 0; i < fileCount; i++)
        monitorFile(fileNames[i]);

    /* 第二遍：检查哪些文件消失了，并重置周期标记 */
    for (int i = 0; i < MAX_FILES; i++) {
        if (stats[i].lastCycle && !stats[i].thisCycle)
            printf("DELETED %s\n", stats[i].fileName);

        stats[i].lastCycle = stats[i].thisCycle;
        stats[i].thisCycle = false;
    }
}

/* ===== monitorFile：对单个文件/目录进行 stat 并分类处理 ===== */
static void monitorFile(const char *fileName)
{
    struct stat statBuf;

    if (stat(fileName, &statBuf) == -1) {
        fprintf(stderr, "Cannot stat %s\n", fileName);
        return;
    }

    mode_t mode = statBuf.st_mode;
    if (S_ISDIR(mode))
        processDirectory(fileName);                       /* 目录 → 递归处理 */
    else if (S_ISREG(mode) || S_ISCHR(mode) || S_ISBLK(mode))
        updateStat(fileName, &statBuf);                   /* 普通文件/设备 → 更新状态 */
}

/* ===== processDirectory：打开目录，递归处理其中每个条目 ===== */
static void processDirectory(const char *dirName)
{
    DIR *dp = opendir(dirName);
    if (dp == NULL) {
        perror("monitor: opendir");
        return;
    }

    struct dirent *entry;
    while ((entry = readdir(dp)) != NULL) {
        /* 跳过 "." 和 ".." */
        if (strcmp(entry->d_name, ".") == 0 ||
            strcmp(entry->d_name, "..") == 0)
            continue;

        char fileName[MAX_FILENAME];
        sprintf(fileName, "%s/%s", dirName, entry->d_name);
        monitorFile(fileName);                                  /* 递归处理子条目 */
    }
    closedir(dp);
}

/* ===== updateStat：更新或新增文件的状态条目 ===== */
static void updateStat(const char *fileName, const struct stat *statBuf)
{
    int entryIndex = findEntry(fileName);                 /* 查找已有条目 */

    if (entryIndex == NOT_FOUND)
        entryIndex = addEntry(fileName, statBuf);         /* 新文件 → 添加 */
    else
        updateEntry(entryIndex, statBuf);                 /* 已有 → 检查变更 */

    if (entryIndex != NOT_FOUND)
        stats[entryIndex].thisCycle = true;               /* 标记本轮存活 */
}

/* ===== findEntry：在状态数组中按文件名查找索引 ===== */
static int findEntry(const char *fileName)
{
    for (int i = 0; i < MAX_FILES; i++)
        if (stats[i].lastCycle && strcmp(stats[i].fileName, fileName) == 0)
            return i;
    return NOT_FOUND;
}

/* ===== addEntry：向状态数组添加新文件条目 ===== */
static int addEntry(const char *fileName, const struct stat *statBuf)
{
    int index = nextFree();                               /* 找空闲槽位 */
    if (index == NOT_FOUND) return NOT_FOUND;

    strcpy(stats[index].fileName, fileName);
    stats[index].status = *statBuf;
    printf("ADDED ");
    printEntry(index);
    return index;
}

/* ===== nextFree：返回状态数组中第一个空闲位置 ===== */
static int nextFree(void)
{
    for (int i = 0; i < MAX_FILES; i++)
        if (!stats[i].lastCycle && !stats[i].thisCycle)
            return i;
    return NOT_FOUND;
}

/* ===== updateEntry：若文件修改时间变化，则报告 CHANGED ===== */
static void updateEntry(int index, const struct stat *statBuf)
{
    if (stats[index].status.st_mtime != statBuf->st_mtime) {
        stats[index].status = *statBuf;                   /* 更新缓存的 stat */
        printf("CHANGED ");
        printEntry(index);
    }
}

/* ===== printEntry：打印文件名和状态信息 ===== */
static void printEntry(int index)
{
    printf("%s   ", stats[index].fileName);
    printStat(&stats[index].status);
}

/* ===== printStat：打印 stat 结构体中的大小和修改时间 ===== */
static void printStat(const struct stat *statBuf)
{
    printf("size %lu bytes, mod. time = %s",
           (unsigned long) statBuf->st_size,
           asctime(localtime(&statBuf->st_mtime)));
}

/* ===== fatalError：打印系统错误并退出 ===== */
static void fatalError(void)
{
    perror("monitor: ");
    exit(1);
} 

