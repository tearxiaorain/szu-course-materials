#include <algorithm>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <cuda_runtime.h>

#define THREADS 1024
#define TILE    16384
#define PAIRS_PER_THREAD (TILE / 2 / THREADS)

#if (TILE % (2 * THREADS)) != 0
#error "TILE must be divisible by 2 * THREADS"
#endif

__global__ 
void bitonicGlobalStep(float* __restrict__ da, int j, int k) {
    int tid = blockIdx.x * blockDim.x + threadIdx.x;

    int low = tid & (j - 1);
    int i = ((tid - low) << 1) + low;
    int ixj = i + j;

    float ai = da[i];
    float aj = da[ixj];

    if ((i & k) == 0) {
        if (ai > aj) {
            da[i] = aj;
            da[ixj] = ai;
        }
    }
    else {
        if (ai < aj) {
            da[i] = aj;
            da[ixj] = ai;
        }
    }
}

__global__ 
void bitonicInitShared(float* __restrict__ da) {
    extern __shared__ float s[];

    int tid = threadIdx.x;
    int base = blockIdx.x * TILE;

    for (int t = tid; t < TILE; t += THREADS) {
        s[t] = da[base + t];
    }

    __syncthreads();

    for (int k = 2; k <= TILE; k <<= 1) {
        for (int j = k >> 1; j > 0; j >>= 1) {

            #pragma unroll
            for (int r = 0; r < PAIRS_PER_THREAD; r++) {
                int p = tid + r * THREADS;

                int low = p & (j - 1);
                int i = ((p - low) << 1) + low;
                int ixj = i + j;

                float ai = s[i];
                float aj = s[ixj];

                int gi = base + i;

                if ((gi & k) == 0) {
                    if (ai > aj) {
                        s[i] = aj;
                        s[ixj] = ai;
                    }
                }
                else {
                    if (ai < aj) {
                        s[i] = aj;
                        s[ixj] = ai;
                    }
                }
            }

            __syncthreads();
        }
    }

    for (int t = tid; t < TILE; t += THREADS) {
        da[base + t] = s[t];
    }
}

__global__ 
void bitonicSharedMerge(float* __restrict__ da, int k) {
    extern __shared__ float s[];

    int tid = threadIdx.x;
    int base = blockIdx.x * TILE;

    for (int t = tid; t < TILE; t += THREADS) {
        s[t] = da[base + t];
    }

    __syncthreads();

    for (int j = TILE >> 1; j > 0; j >>= 1) {

        #pragma unroll
        for (int r = 0; r < PAIRS_PER_THREAD; r++) {
            int p = tid + r * THREADS;

            int low = p & (j - 1);
            int i = ((p - low) << 1) + low;
            int ixj = i + j;

            float ai = s[i];
            float aj = s[ixj];

            int gi = base + i;

            if ((gi & k) == 0) {
                if (ai > aj) {
                    s[i] = aj;
                    s[ixj] = ai;
                }
            }
            else {
                if (ai < aj) {
                    s[i] = aj;
                    s[ixj] = ai;
                }
            }
        }

        __syncthreads();
    }

    for (int t = tid; t < TILE; t += THREADS) {
        da[base + t] = s[t];
    }
}

void configureSharedMemory() {
    int shared_bytes = TILE * sizeof(float);

    cudaFuncSetAttribute(
        bitonicInitShared,
        cudaFuncAttributeMaxDynamicSharedMemorySize,
        shared_bytes
    );

    cudaFuncSetAttribute(
        bitonicSharedMerge,
        cudaFuncAttributeMaxDynamicSharedMemorySize,
        shared_bytes
    );

    cudaFuncSetCacheConfig(bitonicInitShared, cudaFuncCachePreferShared);
    cudaFuncSetCacheConfig(bitonicSharedMerge, cudaFuncCachePreferShared);
}

int main(void) {
    int n = 1 << 25;
    int blk_ct = n / TILE;
    int global_blk_ct = n / 2 / THREADS;
    int shared_bytes = TILE * sizeof(float);

    float* a, * b, * da;

    a = (float*)malloc(n * sizeof(float));
    b = (float*)malloc(n * sizeof(float));
    cudaMalloc(&da, n * sizeof(float));

    srand(0);
    for (int i = 0; i < n; i++) {
        a[i] = b[i] = rand() * 1.0f / RAND_MAX;
    }

    configureSharedMemory();

    cudaMemcpy(da, a, n * sizeof(float), cudaMemcpyHostToDevice);

    struct timespec start, finish;
    timespec_get(&start, TIME_UTC);

    bitonicInitShared<<<blk_ct, THREADS, shared_bytes>>>(da);

    for (int k = TILE << 1; k <= n; k <<= 1) {

        for (int j = k >> 1; j >= TILE; j >>= 1) {
            bitonicGlobalStep<<<global_blk_ct, THREADS>>>(da, j, k);
        }

        bitonicSharedMerge<<<blk_ct, THREADS, shared_bytes>>>(da, k);
    }

    cudaDeviceSynchronize();

    timespec_get(&finish, TIME_UTC);

    printf("GPU time = %f\n",
           finish.tv_sec - start.tv_sec +
           (finish.tv_nsec - start.tv_nsec) / 1e9);

    timespec_get(&start, TIME_UTC);
    std::sort(b, b + n);
    timespec_get(&finish, TIME_UTC);

    printf("CPU time = %f\n",
           finish.tv_sec - start.tv_sec +
           (finish.tv_nsec - start.tv_nsec) / 1e9);

    cudaMemcpy(a, da, n * sizeof(float), cudaMemcpyDeviceToHost);

    int error_count = 0;

    for (int i = 0; i < n; i++) {
        if (a[i] != b[i]) {
            error_count++;
            if (error_count <= 10) {
                printf("error at %d: GPU = %.8f, CPU = %.8f\n",
                       i, a[i], b[i]);
            }
        }
    }

    if (error_count == 0) {
        printf("check passed\n");
    }
    else {
        printf("check failed, error_count = %d\n", error_count);
    }

    free(a);
    free(b);
    cudaFree(da);

    return 0;
}