/*
 * 双调排序演示版 — 最简全局内存核函数
 * n=16, 固定数据, 每步 (k,j) 后打印数组状态
 */

#include <stdio.h>
#include <cuda.h>

// 版本 1: 最简全局内存版
__global__ void bitonic_step(float* a, int n, int j, int k) {
	int i = blockIdx.x * blockDim.x + threadIdx.x;
	if (i >= n) return;
	int partner = i ^ j;
	if (partner > i) {
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
}

int main(void) {
	int n = 16;
	float data[16] = {47,12,89,33,75,21,56,90,18,64,29,51,82,37,70,44};
	float* da;

	printf("初始数组:  ");
	for (int i = 0; i < n; i++) printf("%3.0f ", data[i]);
	printf("\n\n");

	cudaMalloc(&da, n * sizeof(float));
	cudaMemcpy(da, data, n * sizeof(float), cudaMemcpyHostToDevice);

	// 双调排序: k 翻倍, j 折半
	for (int k = 2; k <= n; k <<= 1) {
		for (int j = k >> 1; j > 0; j >>= 1) {
			bitonic_step<<<1, n>>>(da, n, j, k);
			cudaDeviceSynchronize();
			cudaMemcpy(data, da, n * sizeof(float), cudaMemcpyDeviceToHost);
			printf("k=%2d, j=%2d:  ", k, j);
			for (int i = 0; i < n; i++) printf("%3.0f ", data[i]);
			printf("\n");
		}
	}

	cudaFree(da);
	return 0;
}
