#include <algorithm>
#include <stdio.h>
#include <cuda.h>
__device__ inline unsigned Insert_zero(unsigned val, unsigned j)
{
    unsigned left_bits, right_bits, left_ones, right_ones;
    left_ones = (~0) << j;
    right_ones = ~left_ones;
    left_bits = left_ones & val;
    right_bits = right_ones & val;
    return (left_bits << 1) | right_bits;
}
__device__ inline void Compare_swap(float a[], unsigned elt, unsigned partner, unsigned inc_dec)
{
    float tmp;
    if (inc_dec == 0 && a[elt] > a[partner] || inc_dec != 0 && a[elt] < a[partner])
    {
        tmp = a[elt];
        a[elt] = a[partner];
        a[partner] = tmp;
    }
}
__global__ void Pbitonic_sort(float a[], int n)
{
    unsigned bf_sz, stage, my_elt1, my_elt2;
    unsigned th = blockDim.x * blockIdx.x + threadIdx.x;
    unsigned initial_bit = 0;
    for (bf_sz = 2; bf_sz <= n; bf_sz = bf_sz << 1)
    {
        unsigned which_bit = initial_bit;
        for (stage = bf_sz >> 1; stage > 0; stage = stage >> 1)
        {
            my_elt1 = Insert_zero(th, which_bit);
            my_elt2 = my_elt1 ^ stage;
            Compare_swap(a, my_elt1, my_elt2, my_elt1 & bf_sz);
            which_bit--;
        }
        initial_bit++;
    }
}
int main(void)
{
    int n = 8;
    float *a, *b, *da;
    a = (float *)malloc(n * sizeof(float));
    b = (float *)malloc(n * sizeof(float));
    cudaMalloc(&da, n * sizeof(float));
    srand(time(NULL));
    for (int i = 0; i < n; i++)
        a[i] = b[i] = rand() * 1.0 / RAND_MAX;
    cudaMemcpy(da, a, n * sizeof(float), cudaMemcpyHostToDevice);
    struct timespec start, finish;
    timespec_get(&start, TIME_UTC);
    Pbitonic_sort<<<1, n / 2>>>(da, n);
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
