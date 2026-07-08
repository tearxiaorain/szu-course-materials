/*
 * CUDA 并行双调排序 (Bitonic Sort)
 * 策略: j ≥ TILE → 全局内存, j < TILE → 共享内存合并
 * 共有 5 个函数: Insert_zero(映射), bitonic_step(全局), bitonic_init_shared(初始排序),
 *               bitonic_merge_shared(合并), configure_shared(配置共享内存)
 */

#include <algorithm>
#include <stdio.h>
#include <stdlib.h>
#include <cuda.h>

#define THREADS 1024                          // 每 block 线程数
#define TILE    16384                         // 共享内存 tile 大小 (64KB = GPU 最大值)
#define PAIRS_PER_THREAD (TILE / 2 / THREADS) // 每线程每轮处理的比较对数 (= 8)

// 版本 1: 最简全局内存版（保留参考）
// __global__ void bitonic_step(float* a, int n, int j, int k) { ... }
// __global__ void bitonic_step(float* a, int n, int j, int k) {
// 	int i = blockIdx.x * blockDim.x + threadIdx.x;
// 	if (i >= n) return;
// 	int partner = i ^ j;
// 	if (partner > i) {
// 		bool asc = ((i & k) == 0);
// 		float tmp;
// 		if (asc) {
// 			if (a[i] > a[partner]) {
// 				tmp = a[i]; a[i] = a[partner]; a[partner] = tmp;
// 			}
// 		} else {
// 			if (a[i] < a[partner]) {
// 				tmp = a[i]; a[i] = a[partner]; a[partner] = tmp;
// 			}
// 		}
// 	}
// }

// ═══════════════════════════════════════════════════════════════
// Insert_zero: 在 val 的二进制第 p 位插入一个 0
// 例: Insert_zero(0b101, 1) → 0b1001 (第1位插入0)
// 用途: 将线程号 tid 映射为「第 p 位为 0」的元素下标,
//       保证 n/2 个线程恰好覆盖 n/2 个比较对，每个对一次
// ═══════════════════════════════════════════════════════════════
__device__ inline unsigned Insert_zero(unsigned val, unsigned p) {
	unsigned left_ones = (~0u) << p;                    // p 位及以上全 1
	return ((left_ones & val) << 1) | (~left_ones & val); // 高位左移 1 位, 低位不动
}

// ═══════════════════════════════════════════════════════════════
// bitonic_step: 全局内存蝶式交换，j ≥ TILE 时使用
// 参数: a — 设备端数组, j — 比较距离 (2 的幂), k — 当前双调块大小
// 启动: n/2 个线程，每线程处理一对 (i, i^j)
// ═══════════════════════════════════════════════════════════════
__global__ void bitonic_step(float* a, int j, int k) {
	int tid = blockIdx.x * blockDim.x + threadIdx.x;    // 线程 ID ∈ [0, n/2)
	int p = __ffs(j) - 1;                               // j = 2^p, 取比特位置
	int i = Insert_zero(tid, p);                        // 线程 → 元素映射 (第 p 位 = 0)
	int partner = i ^ j;                                // 蝶式配对 (翻转第 p 位 → 必 > i)
	bool asc = ((i & k) == 0);                          // k-bit=0 → 升序, =1 → 降序
	if (asc) {
		if (a[i] > a[partner]) {
			float tmp = a[i]; a[i] = a[partner]; a[partner] = tmp;
		}
	} else {
		if (a[i] < a[partner]) {
			float tmp = a[i]; a[i] = a[partner]; a[partner] = tmp;
		}
	}
}

// ═══════════════════════════════════════════════════════════════
// bitonic_init_shared: 一次性共享内存初始排序
// 功能: 把整个数组按 TILE=16384 分块, 每块在共享内存内完成 k=2..16384 全部排序
// 启动: n/TILE 个 block (每 block 负责 16384 个元素), 每个 1024 线程
// 每线程处理 PAIRS_PER_THREAD=8 个比较对 (grid-stride)
// 结束后: 每个 TILE 内部完全有序
// ═══════════════════════════════════════════════════════════════
__global__ void bitonic_init_shared(float* a) {
	extern __shared__ float s[];                         // 动态共享内存, 大小 = TILE * sizeof(float) = 64KB
	int tid = threadIdx.x;                               // 线程在 block 内的 ID [0, 1023]
	int base = blockIdx.x * TILE;                        // 本 block 在全局数组中的起始偏移

	// ① grid-stride 加载: 1024 线程 × 16 次迭代 = 16384 元素读入共享内存
	for (int t = tid; t < TILE; t += THREADS)
		s[t] = a[base + t];
	__syncthreads();                                     // 确保全部加载完

	// ② 双层循环: k 翻倍 (2→16384), j 折半 (k/2→1)
	for (int k = 2; k <= TILE; k <<= 1) {
		for (int j = k >> 1; j > 0; j >>= 1) {
			#pragma unroll
			for (int r = 0; r < PAIRS_PER_THREAD; r++) { // 每线程处理 8 个 pair
				int p = tid + r * THREADS;               // pair 编号 [0, TILE/2)
				int low = p & (j - 1);                   // p 模 j (j 是 2 的幂)
				int i = ((p - low) << 1) + low;          // pair 映射 → 元素下标
				int ixj = i + j;                         // 搭档下标 = i + j
				// 方向: (全局下标 & k) 为 0 → 升序, 非 0 → 降序
				if ((base + i) & k) {
					if (s[i] < s[ixj]) { float t = s[i]; s[i] = s[ixj]; s[ixj] = t; }
				} else {
					if (s[i] > s[ixj]) { float t = s[i]; s[i] = s[ixj]; s[ixj] = t; }
				}
			}
			__syncthreads();                             // 一个 j 阶段完成, 同步后进入下一个 j
		}
	}

	// ③ grid-stride 写回: 共享内存 → 全局内存
	for (int t = tid; t < TILE; t += THREADS)
		a[base + t] = s[t];
}

// ═══════════════════════════════════════════════════════════════
// bitonic_merge_shared: 共享内存合并 (k > TILE 时)
// 功能: 在全局内存完成 j ≥ TILE 的蝶式交换后, 把 j < TILE 的剩余阶段
//       合并进一次 kernel (共享内存内完成 j=TILE/2..1)
// 参数: k — 当前双调块大小 (k > TILE)
// 与 init_shared 的区别: 只做 merge (j 从 TILE/2 到 1), 不做 k 翻倍循环
// ═══════════════════════════════════════════════════════════════
__global__ void bitonic_merge_shared(float* a, int k) {
	extern __shared__ float s[];
	int tid = threadIdx.x;
	int base = blockIdx.x * TILE;

	// ① grid-stride 加载 tile 到共享内存
	for (int t = tid; t < TILE; t += THREADS)
		s[t] = a[base + t];
	__syncthreads();

	// ② 单层循环: j 从 TILE/2 折半到 1 (不做 k 翻倍)
	for (int j = TILE >> 1; j > 0; j >>= 1) {
		#pragma unroll
		for (int r = 0; r < PAIRS_PER_THREAD; r++) {
			int p = tid + r * THREADS;
			int low = p & (j - 1);
			int i = ((p - low) << 1) + low;
			int ixj = i + j;
			if ((base + i) & k) {
				if (s[i] < s[ixj]) { float t = s[i]; s[i] = s[ixj]; s[ixj] = t; }
			} else {
				if (s[i] > s[ixj]) { float t = s[i]; s[i] = s[ixj]; s[ixj] = t; }
			}
		}
		__syncthreads();                                 // j 阶段间必须同步
	}

	// ③ grid-stride 写回
	for (int t = tid; t < TILE; t += THREADS)
		a[base + t] = s[t];
}

// ═══════════════════════════════════════════════════════════════
// configure_shared: 配置共享内存核函数的 GPU 属性
//   cudaFuncSetAttribute → 声明最大动态共享内存 (64KB)
//   cudaFuncSetCacheConfig → 优先使用共享内存 (减少 L1 缓存)
// ═══════════════════════════════════════════════════════════════
void configure_shared() {
	int shared_bytes = TILE * sizeof(float);
	cudaFuncSetAttribute(bitonic_init_shared, cudaFuncAttributeMaxDynamicSharedMemorySize, shared_bytes);
	cudaFuncSetAttribute(bitonic_merge_shared, cudaFuncAttributeMaxDynamicSharedMemorySize, shared_bytes);
	cudaFuncSetCacheConfig(bitonic_init_shared, cudaFuncCachePreferShared);
	cudaFuncSetCacheConfig(bitonic_merge_shared, cudaFuncCachePreferShared);
}

// ═══════════════════════════════════════════════════════════════
// main: 主机端调度
// 流程: init_shared(1次) → for k=TILE*2..n: global_step + merge_shared
// n 通过修改 n = 1 << 23..30 控制规模，每次运行只测一个 n
// ═══════════════════════════════════════════════════════════════
int main(int argc, char* argv[]) {
	// ── 命令行参数: ./a.out <exp> → n = 2^exp ──
	int exp = 25, n;                                   // 默认 2^25
	if (argc > 1) exp = atoi(argv[1]);                 // 从命令行读取指数
	n = 1 << exp;                                      // n = 2^exp
	printf("n = %d (2^%d)\n", n, exp);                 // 打印当前规模
	int blk_ct_global = n / 2 / THREADS;               // bitonic_step 用: n/2 线程 → n/2/1024 块
	int blk_ct_tile   = n / TILE;                      // 共享内存核函数用: n 线程 → n/16384 块
	int shared_bytes  = TILE * sizeof(float);          // 动态共享内存大小 = 64KB

	// ── 主机端内存分配 ──
	float* a, * b, * da;
	a  = (float*)malloc(n * sizeof(float));            // GPU 结果读回用
	b  = (float*)malloc(n * sizeof(float));            // CPU std::sort 基准
	cudaMalloc(&da, n * sizeof(float));                // GPU 设备端数组

	// ── 数据生成 (固定种子保证可复现) ──
	srand(0);
	for (int i = 0; i < n; i++)
		a[i] = b[i] = rand() * 1.0f / RAND_MAX;

	// ── 配置 GPU 共享内存属性 ──
	configure_shared();

	// ── 数据拷贝到 GPU ──
	cudaMemcpy(da, a, n * sizeof(float), cudaMemcpyHostToDevice);

	// ══════════════════════════════════════════════════════
	// GPU 计时开始
	// ══════════════════════════════════════════════════════
	struct timespec start, finish;
	timespec_get(&start, TIME_UTC);

	// 阶段 1: 一次性 tile 内排序 (k=2..16384, 1 次 kernel)
	bitonic_init_shared<<<blk_ct_tile, THREADS, shared_bytes>>>(da);

	// 阶段 2: 逐层跨 tile 归并 (k=32768..n)
	for (int k = TILE << 1; k <= n; k <<= 1) {
		// 2a: j ≥ TILE → 全局内存蝶式交换 (逐个 launch)
		for (int j = k >> 1; j >= TILE; j >>= 1)
			bitonic_step<<<blk_ct_global, THREADS>>>(da, j, k);
		// 2b: j < TILE → 共享内存合并 (1 次 kernel, 内部跑完 j=TILE/2..1)
		bitonic_merge_shared<<<blk_ct_tile, THREADS, shared_bytes>>>(da, k);
	}

	cudaDeviceSynchronize();                            // 等待 GPU 完成
	timespec_get(&finish, TIME_UTC);
	printf("GPU time = %f s\n", finish.tv_sec - start.tv_sec
	       + (finish.tv_nsec - start.tv_nsec) / 1e9);

	// ══════════════════════════════════════════════════════
	// CPU 基准计时 (std::sort)
	// ══════════════════════════════════════════════════════
	timespec_get(&start, TIME_UTC);
	std::sort(b, b + n);
	timespec_get(&finish, TIME_UTC);
	printf("CPU time = %f s\n", finish.tv_sec - start.tv_sec
	       + (finish.tv_nsec - start.tv_nsec) / 1e9);

	// ── 正确性验证 ──
	cudaMemcpy(a, da, n * sizeof(float), cudaMemcpyDeviceToHost);
	for (int i = 0; i < n; i++)
		if (a[i] != b[i]) {
			printf("error at index %d\n", i);
			break;                                       // 发现错误即停止
		}

	// ── 释放资源 ──
	free(a); free(b);
	cudaFree(da);
}
