#include <stdio.h>
#include <cuda.h>
__global__ void Matrix_mult(const float dx[], const float dy[], float dz[], const int n) {
    // // 1. 计算当前线程负责的元素的全局行号(row)和列号(col)
    // // blockIdx, blockDim, threadIdx 都是CUDA内置变量
    // int row = blockIdx.y * blockDim.y + threadIdx.y;
    // int col = blockIdx.x * blockDim.x + threadIdx.x;

    // // 2. 边界检查：确保线程处理的元素在矩阵的有效范围内
    // // 因为我们启动的网格大小可能是为了对齐而略大于n, 所以这个检查是必须的
    // if (row < n && col < n) {
    //     float sum = 0.0f;

    //     // 3. 计算点积：dx的第row行 与 dy的第col列
    //     // 这是矩阵乘法定义的核心
    //     for (int k = 0; k < n; ++k) {
    //         // dx[row][k] 对应一维数组中的 dx[row * n + k]
    //         // dy[k][col] 对应一维数组中的 dy[k * n + col]
    //         sum += dx[row * n + k] * dy[k * n + col];
    //     }

    //     // 4. 将计算结果写入目标矩阵dz的相应位置
    //     dz[row * n + col] = sum;
    // }
    __shared__ float s_x[TILE_WIDTH][TILE_WIDTH];
    __shared__ float s_y[TILE_WIDTH][TILE_WIDTH];

    int tx = threadIdx.x;
    int ty = threadIdx.y;

    int row = blockIdx.y * TILE_WIDTH + ty;
    int col = blockIdx.x * TILE_WIDTH + tx;

    float sum = 0.0f;

    for (int t = 0; t < (n + TILE_WIDTH - 1) / TILE_WIDTH; t++) {
        int dx_row = row;
        int dx_col = t * TILE_WIDTH + tx;
        if (dx_row < n && dx_col < n) {
            s_x[ty][tx] = dx[dx_row * n + dx_col];
        } else {
            s_x[ty][tx] = 0.0f;
        }

        int dy_row = t * TILE_WIDTH + ty;
        int dy_col = col;
        if (dy_row < n && dy_col < n) {
            s_y[ty][tx] = dy[dy_row * n + dy_col];
        } else {
            s_y[ty][tx] = 0.0f;
        }

        __syncthreads();

        for (int k = 0; k < TILE_WIDTH; k++) {
            sum += s_x[ty][k] * s_y[k][tx];
        }

        __syncthreads();
    }

    if (row < n && col < n) {
        dz[row * n + col] = sum;
    }
}
__global__ void Sum(const float a[], int n, float* sum_p) {
    // 1. 局部求和：每个线程计算一部分元素的和
    // 使用网格跨步循环（grid-stride loop），确保所有元素都被处理，
    // 即使元素总数 n 远大于线程总数。
    float local_sum = 0.0f;
    for (int i = blockIdx.x * blockDim.x + threadIdx.x; i < n; i += gridDim.x * blockDim.x) {
        local_sum += a[i];
    }

    // 2. 线程束内归约 (Warp-level Reduction)
    // 使用 __shfl_down_sync 指令在32个线程的warp内部高效求和，无需使用共享内存。
    // 一个warp内的线程可以读取同一个warp内其他线程的寄存器值。
    // offset=16: 线程i把它自己的local_sum加给线程i-16
    // offset=8:  线程i把它自己的local_sum加给线程i-8
    // ...
    // 经过5次迭代后，每个warp的第一个线程(lane 0)将包含该warp的总和。
    for (int offset = 16; offset > 0; offset /= 2) {
        local_sum += __shfl_down_sync(0xffffffff, local_sum, offset);
    }

    // 3. 线程块内归约 (Block-level Reduction)
    // 将每个warp的总和再次相加，得到整个block的总和。
    
    // 声明一个共享内存数组，用于存放每个warp的归约结果。
    // 一个块最多有 1024/32 = 32 个warp。
    __shared__ float shared_sums[32];

    // 每个warp的第一个线程 (lane 0) 将其warp的总和写入共享内存。
    if (threadIdx.x % 32 == 0) {
        shared_sums[threadIdx.x / 32] = local_sum;
    }

    // 同步，确保所有warp都已将结果写入共享内存。
    __syncthreads();

    // 块内的第一个warp (即前32个线程) 负责对共享内存中的所有warp总和进行最后的归约。
    if (threadIdx.x < 32) {
        // 如果块内的warp数量少于32，需要做边界检查，避免读取无效共享内存。
        // blockDim.x / 32 是当前块内的warp总数。
        float final_sum = (threadIdx.x < blockDim.x / 32) ? shared_sums[threadIdx.x] : 0.0f;

        // 再次使用warp shuffle对这些warp总和进行归约。
        for (int offset = 16; offset > 0; offset /= 2) {
            final_sum += __shfl_down_sync(0xffffffff, final_sum, offset);
        }

        // 4. 全局归约 (Grid-level Reduction)
        // 最终，块内的第一个线程 (threadIdx.x == 0) 将该块的总和原子地加到全局总和上。
        // atomicAdd可以保证多个block同时写入sum_p时不会发生数据竞争。
        if (threadIdx.x == 0) {
            atomicAdd(sum_p, final_sum);
        }
    }
}
int main(void) {
	int n = 1024;
	float* x, * y, * z, * cz;
	float* dx, * dy, * dz;
	float sum, * sum_p;
	x = (float*)malloc(n * n * sizeof(float));
	y = (float*)malloc(n * n * sizeof(float));
	z = (float*)malloc(n * n * sizeof(float));
	cz = (float*)malloc(n * n * sizeof(float));
	cudaMalloc(&dx, n * n * sizeof(float));
	cudaMalloc(&dy, n * n * sizeof(float));
	cudaMalloc(&dz, n * n * sizeof(float));
	cudaMallocManaged(&sum_p, sizeof(float));
	srand(0);
	for (int i = 0; i < n * n; i++) {
		x[i] = rand() * 1.0 / RAND_MAX;
		y[i] = rand() * 1.0 / RAND_MAX;
		cz[i] = 0;
	}
	struct timespec start, finish;
	cudaMemcpy(dx, x, n * n * sizeof(float), cudaMemcpyHostToDevice);
	cudaMemcpy(dy, y, n * n * sizeof(float), cudaMemcpyHostToDevice);
    dim3 threadsPerBlock_mult(16, 16);
    dim3 numBlocks_mult((n + 15) / 16, (n + 15) / 16);
    int total_elements = n * n;
    int threadsPerBlock_sum = 256;
    int numBlocks_sum = (total_elements + threadsPerBlock_sum - 1) / threadsPerBlock_sum;

	timespec_get(&start, TIME_UTC);
	Matrix_mult << <numBlocks_mult, threadsPerBlock_mult>> > (dx, dy, dz, n);
	cudaDeviceSynchronize();
	*sum_p = 0;
	Sum <<<numBlocks_sum, threadsPerBlock_sum>>> (dz, total_elements, sum_p);
	cudaDeviceSynchronize();
	cudaMemcpy(z, dz, n * n * sizeof(float), cudaMemcpyDeviceToHost);
	timespec_get(&finish, TIME_UTC);
	printf("GPU time = %f\n", finish.tv_sec - start.tv_sec + (finish.tv_nsec - start.tv_nsec) / 1e9);
	timespec_get(&start, TIME_UTC);
	for (int i = 0; i < n; i++)
		for (int k = 0; k < n; k++)
			for (int j = 0; j < n; j++)
				cz[i * n + j] += x[i * n + k] * y[k * n + j];
	sum = 0;
	for (int i = 0; i < n * n; i++)
		sum += cz[i];
	timespec_get(&finish, TIME_UTC);
	printf("CPU time = %f\n", finish.tv_sec - start.tv_sec + (finish.tv_nsec - start.tv_nsec) / 1e9);
	double diff_norm = 0;
	for (int i = 0; i < n * n; i++) {
		double diff = z[i] - cz[i];
		diff_norm += diff * diff;
	}
	diff_norm = sqrt(diff_norm);
	printf("Two-norm of difference between GPU and CPU = %f\n", diff_norm);
	printf("Sum computed by GPU = %e\n", *sum_p);
	printf("Sum computed by CPU = %e\n", sum);
	free(x);
	free(y);
	free(z);
	free(cz);
	cudaFree(dx);
	cudaFree(dy);
	cudaFree(dz);
	cudaFree(sum_p);
	return 0;
}	
