# 计算机系统（2）

- **学期**：大二下（2024-2025 学年第二学期）
- **教材**：《深入理解计算机系统》（CS:APP）
- **实验平台**：Linux x86-64、Docker

## 目录结构

```
计算机系统（2）/
├── README.md
├── ppt/                        # 课堂课件
│   ├── Chapter 1 计算机系统简介.pptx
│   ├── Chapter 2 信息表示与处理.pptx
│   ├── Chapter 3 程序的机器级表示.pptx
│   ├── Chapter 6 存储层次结构.pptx
│   └── Chapter 7 链接.pptx
├── 实验/                       # 课程实验
│   ├── 1/                      # 实验一：实验环境配置与 Linux 使用
│   ├── 2/                      # 实验二：DataLab（数据表示实验）
│   ├── 3/                      # 实验三：BombLab（逆向工程实验）
│   ├── 4/                      # 实验四：BufferLab（缓冲区溢出攻击）
│   ├── 5/                      # 实验五：CacheLab（存储体系实验）
│   └── 容器实验/               # 实验六：Docker 容器实验
├── 习题/                       # 期中测试及参考答案
├── 共享/                       # 实验共享代码与工具
│   ├── bits.c                  # DataLab 代码
│   ├── bomb_64 / bomb_64.c     # BombLab 二进制文件
│   ├── datalab-handout/        # DataLab 实验包
│   └── buflab-handout/         # BufferLab 实验包
└── 练习/                       # 练习作业
```

## 实验概览

| 实验 | 主题 | 技术点 |
|------|------|--------|
| 1 | 环境配置与 Linux 使用 | Linux 命令行、GCC、GDB、Makefile |
| 2 | DataLab | 位运算、整数/浮点数表示、位级操作 |
| 3 | BombLab | x86-64 汇编、GDB 调试、逆向分析 |
| 4 | BufferLab | 缓冲区溢出、栈帧、Shellcode 注入 |
| 5 | CacheLab | 缓存模拟、局部性原理、缓存优化 |
| 6 | Docker 容器实验 | Docker 基础、容器化部署 |

## 运行说明

所有实验在 Linux (Ubuntu) 环境下运行，实验一包含环境配置指南。BombLab 和 BufferLab 需在指定的实验包中进行。
