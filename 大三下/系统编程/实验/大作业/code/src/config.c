#include "config.h"

/* 全局配置实例 —— 唯一定义在此处 */
config_t g_config;

/* ================================================================
 * parse_config —— 解析配置文件
 *
 * 格式：key=value，每行一项。
 * 跳过空行和 # 开头注释行。
 * 支持键：server_name, version, pool_size,
 *         fifo_dir, log_dir, log_server_dir
 * ================================================================ */
int parse_config(const char *path)
{
    FILE *fp = fopen(path, "r");
    if (!fp) {
        fprintf(stderr, "[config] 无法打开配置文件: %s\n", path);
        return -1;
    }

    /* 初始化默认值 */
    strncpy(g_config.server_name,    "chatserver_yjw_1.0", sizeof(g_config.server_name) - 1);
    strncpy(g_config.version,        "1.0",               sizeof(g_config.version) - 1);
    g_config.pool_size = POOLSIZE;
    strncpy(g_config.fifo_dir,       DEFAULT_FIFO_DIR,    sizeof(g_config.fifo_dir) - 1);
    strncpy(g_config.log_dir,        DEFAULT_LOG_DIR,     sizeof(g_config.log_dir) - 1);
    strncpy(g_config.log_server_dir, DEFAULT_LOG_SERVER_DIR, sizeof(g_config.log_server_dir) - 1);

    char line[MAX_LINE_LEN];
    while (fgets(line, sizeof(line), fp)) {
        /* 去除末尾换行 */
        size_t len = strlen(line);
        while (len > 0 && (line[len - 1] == '\n' || line[len - 1] == '\r')) {
            line[--len] = '\0';
        }

        /* 跳过空行和注释 */
        if (len == 0 || line[0] == '#') continue;

        /* 查找 = */
        char *eq = strchr(line, '=');
        if (!eq) continue;

        *eq = '\0';
        char *key   = line;
        char *value = eq + 1;

        /* 去除 key 尾部空格 */
        char *kp = key + strlen(key) - 1;
        while (kp >= key && (*kp == ' ' || *kp == '\t')) *kp-- = '\0';

        /* 去除 value 前导空格 */
        while (*value == ' ' || *value == '\t') value++;

        if (strcmp(key, "server_name") == 0) {
            strncpy(g_config.server_name, value, sizeof(g_config.server_name) - 1);
        } else if (strcmp(key, "version") == 0) {
            strncpy(g_config.version, value, sizeof(g_config.version) - 1);
        } else if (strcmp(key, "pool_size") == 0) {
            int ps = atoi(value);
            if (ps > 0 && ps <= 1000) g_config.pool_size = ps;
        } else if (strcmp(key, "fifo_dir") == 0) {
            strncpy(g_config.fifo_dir, value, sizeof(g_config.fifo_dir) - 1);
        } else if (strcmp(key, "log_dir") == 0) {
            strncpy(g_config.log_dir, value, sizeof(g_config.log_dir) - 1);
        } else if (strcmp(key, "log_server_dir") == 0) {
            strncpy(g_config.log_server_dir, value, sizeof(g_config.log_server_dir) - 1);
        }
    }

    fclose(fp);
    return 0;
}

/* ================================================================
 * make_dirs —— 递归创建目录（类似 mkdir -p）
 * ================================================================ */
void make_dirs(const char *path)
{
    char tmp[512];
    strncpy(tmp, path, sizeof(tmp) - 1);
    tmp[sizeof(tmp) - 1] = '\0';

    size_t len = strlen(tmp);
    if (len > 0 && tmp[len - 1] == '/') tmp[len - 1] = '\0';

    for (char *p = tmp + 1; *p; p++) {
        if (*p == '/') {
            *p = '\0';
            mkdir(tmp, 0755);
            *p = '/';
        }
    }
    mkdir(tmp, 0755);
}

/* ================================================================
 * create_directories —— 创建所有需要的目录
 * ================================================================ */
void create_directories(void)
{
    make_dirs(g_config.fifo_dir);
    make_dirs(g_config.log_dir);
    make_dirs(g_config.log_server_dir);
}
