#include <algorithm>
#include <stdio.h>
#include <cuda.h>

#define THREADS 1024
#define TILE    16384
#define PAIRS_PER_THREAD (TILE / 2 / THREADS)   // = 8

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

// 版本 2: n/2 线程 + Insert_zero 全局内存版（用于 j > 1024）
__device__ inline unsigned Insert_zero(unsigned val, unsigned p) {
	unsigned left_ones = (~0u) << p;
	return ((left_ones & val) << 1) | (~left_ones & val);
}

__global__ void bitonic_step(float* a, int j, int k) {
	int tid = blockIdx.x * blockDim.x + threadIdx.x;
	int p = __ffs(j) - 1;
	int i = Insert_zero(tid, p);
	int partner = i ^ j;
	bool asc = ((i & k) == 0);
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

// 版本 3a: 共享内存初始排序（k ≤ TILE，一次 kernel 完成所有小 k）
__global__ void bitonic_init_shared(float* a) {
	extern __shared__ float s[];
	int tid = threadIdx.x;
	int base = blockIdx.x * TILE;

	for (int t = tid; t < TILE; t += THREADS)
		s[t] = a[base + t];
	__syncthreads();

	for (int k = 2; k <= TILE; k <<= 1) {
		for (int j = k >> 1; j > 0; j >>= 1) {
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
			__syncthreads();
		}
	}

	for (int t = tid; t < TILE; t += THREADS)
		a[base + t] = s[t];
}

// 版本 3b: 共享内存合并（k > TILE 时，合并 j < TILE 的剩余阶段）
__global__ void bitonic_merge_shared(float* a, int k) {
	extern __shared__ float s[];
	int tid = threadIdx.x;
	int base = blockIdx.x * TILE;

	for (int t = tid; t < TILE; t += THREADS)
		s[t] = a[base + t];
	__syncthreads();

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
		__syncthreads();
	}

	for (int t = tid; t < TILE; t += THREADS)
		a[base + t] = s[t];
}

void configure_shared() {
	int shared_bytes = TILE * sizeof(float);
	cudaFuncSetAttribute(bitonic_init_shared, cudaFuncAttributeMaxDynamicSharedMemorySize, shared_bytes);
	cudaFuncSetAttribute(bitonic_merge_shared, cudaFuncAttributeMaxDynamicSharedMemorySize, shared_bytes);
	cudaFuncSetCacheConfig(bitonic_init_shared, cudaFuncCachePreferShared);
	cudaFuncSetCacheConfig(bitonic_merge_shared, cudaFuncCachePreferShared);
}

int main(void) {
	int n = 1 << 25, blk_ct_global = n / 2 / THREADS, blk_ct_tile = n / TILE, shared_bytes = TILE * sizeof(float);
	float* a, * b, * da;
	a = (float*)malloc(n * sizeof(float));
	b = (float*)malloc(n * sizeof(float));
	cudaMalloc(&da, n * sizeof(float));
	srand(0);
	for (int i = 0; i < n; i++)
		a[i] = b[i] = rand() * 1.0 / RAND_MAX;
	configure_shared();

	cudaMemcpy(da, a, n * sizeof(float), cudaMemcpyHostToDevice);
	struct timespec start, finish;
	timespec_get(&start, TIME_UTC);

	bitonic_init_shared<<<blk_ct_tile, THREADS, shared_bytes>>>(da);

	for (int k = TILE << 1; k <= n; k <<= 1) {
		for (int j = k >> 1; j >= TILE; j >>= 1)
			bitonic_step<<<blk_ct_global, THREADS>>>(da, j, k);
		bitonic_merge_shared<<<blk_ct_tile, THREADS, shared_bytes>>>(da, k);
	}
	cudaDeviceSynchronize();
	timespec_get(&finish, TIME_UTC);
	printf("GPU time = %f\n", finish.tv_sec - start.tv_sec + (finish.tv_nsec - start.tv_nsec) / 1e9);
	timespec_get(&start, TIME_UTC);
	std::sort(b, b + n);
	timespec_get(&finish, TIME_UTC);
	printf("CPU time = %f\n", finish.tv_sec - start.tv_sec + (finish.tv_nsec - start.tv_nsec) / 1e9);
	cudaMemcpy(a, da, n * sizeof(float), cudaMemcpyDeviceToHost);
	for (int i = 0; i < n; i++)
		if (a[i] != b[i])
			printf("error\n");
	free(a);
	free(b);
	cudaFree(da);
}
