#ifndef CONFIG_H
#define CONFIG_H

#include "common.h"

/* ================================================================
 * config.h —— 配置文件解析模块
 *
 * 解析 conf/chatserver.conf，格式：key=value（每行一项）。
 * 支持 # 开头注释行和空行。
 * ================================================================ */

/* 全局配置实例（定义在 config.c，此处仅声明） */
extern config_t g_config;

/* 解析配置文件，成功返回 0，失败返回 -1 */
int parse_config(const char *path);

/* 创建必要的目录结构 */
void create_directories(void);

#endif /* CONFIG_H */
