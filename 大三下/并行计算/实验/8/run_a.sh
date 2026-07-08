#!/bin/bash

# CUDA 双调排序实验脚本
# 用法: ./run_a.sh
# 对 n = 2^23 .. 2^30 各运行 5 次，记录 GPU/CPU 平均时间

PROG="./a.out"
EXP_LIST=(23 24 25 26 27 28 29 30)             # 指数列表, n = 2^exp
N=5                                              # 每个规模重复次数

SUMMARY="results.txt"                            # 汇总: 每规模的平均值
RAW_DATA="all_results.txt"                       # 原始: 每次运行的时间

> "$SUMMARY"
> "$RAW_DATA"

echo "# n        avg_gpu     avg_cpu" >> "$SUMMARY"
echo "# n        run   gpu_time     cpu_time" >> "$RAW_DATA"

for exp in "${EXP_LIST[@]}"; do
    n=$((1 << exp))                              # n = 2^exp (仅用于文件记录)
    echo "n = $n (2^$exp)"
    for ((i=1; i<=N; i++)); do
        echo "  Run $i ..."
        # ═══════════════════════════════════════════
        # ↓↓↓ 核心运行命令: 传指数, a.out 内部算 n=2^exp ↓↓↓
        out=$("$PROG" "$exp")
        # ↑↑↑ 核心运行命令 ↑↑↑
        # ═══════════════════════════════════════════
        gpu_time=$(echo "$out" | grep "GPU time" | awk '{print $4}')   # "GPU time = X.XXX s"
        cpu_time=$(echo "$out" | grep "CPU time" | awk '{print $4}')   # "CPU time = X.XXX s"

        [[ -z "$gpu_time" ]] && gpu_time="NaN"
        [[ -z "$cpu_time" ]] && cpu_time="NaN"

        echo "$n $i $gpu_time $cpu_time" >> "$RAW_DATA"
        #      1  2      3          4         ← awk 字段编号
        sleep 2
    done

    # 计算该规模下 5 次的平均值
    # all_results.txt 格式: n run gpu_time cpu_time
    avg_gpu=$(awk -v n="$n" '$1==n && $3!="NaN" {sum+=$3; cnt++} END {if(cnt) printf "%.6f", sum/cnt; else print "NaN"}' "$RAW_DATA")
    avg_cpu=$(awk -v n="$n" '$1==n && $4!="NaN" {sum+=$4; cnt++} END {if(cnt) printf "%.6f", sum/cnt; else print "NaN"}' "$RAW_DATA")

    echo "$n $avg_gpu $avg_cpu" >> "$SUMMARY"
    echo ""
done

echo "Done. Summary: $SUMMARY, raw data: $RAW_DATA"
