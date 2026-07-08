#include <algorithm>
#include <float.h>
#include <iostream>
#include <omp.h>
using namespace std;
int main(void)
{
	int n = 1e7;
	int p = 8;
	double* a = new double[n];
	double* b = new double[n];
	double* c = new double[n];
	for (int i = 0; i < n; i++)
		a[i] = c[i] = rand() * 1.0 / RAND_MAX;
	double start, finish;
	start = omp_get_wtime();
    int local_n = n / p;
    int offset = local_n / p;
    double *sample = new double[p*p];
    double *pivot = new double[p-1];

    #pragma omp parallel num_threads(p)
    {
        int my_id = omp_get_thread_num();
        sort(a + my_id * local_n, a + (my_id + 1) * local_n);
        for (int i = 0; i < p; i++)
        {
            sample[my_id * p + i] = a[my_id * local_n + i * offset];
        }
    }
    sort(sample, sample + p*p);
    for (int i = 1; i < p; i++)
    {
        pivot[i-1] = sample[i*p];
    }
    int **pos = new int*[p];
    for (int i = 0; i < p; i++)
    {
        pos[i] = new int[p + 1];
    }
    int *counts = new int[p * p];
    int *bucket_sizes = new int[p];
    int *bucket_starts = new int[p];

    #pragma omp parallel num_threads(p)
    {
        int my_id = omp_get_thread_num();
        pos[my_id][0] = 0;
        pos[my_id][p] = local_n;
        int l, r, mid;
        for (int i = 0; i < p - 1; i++)
        {
            l = my_id * local_n;
            r = (my_id + 1) * local_n;
            mid = (l + r) / 2;
            while (l < r)
            {
                if (a[mid] < pivot[i])
                {
                    l = mid + 1;
                }
                else
                {
                    r = mid;
                }
                mid = (l + r) / 2;
            }
            pos[my_id][i + 1] = l - my_id * local_n;
        }
        for (int k = 0; k < p; k++)
        {
            counts[my_id * p + k] = pos[my_id][k + 1] - pos[my_id][k];
        }
        #pragma omp barrier
        #pragma omp single
        {
            int running = 0;
            for (int k = 0; k < p; k++)
            {
                int sum = 0;
                for (int t = 0; t < p; t++)
                {
                    sum += counts[t * p + k];
                }
                bucket_sizes[k] = sum;
                bucket_starts[k] = running;
                running += sum;
            }
        }
    }
    #pragma omp parallel for num_threads(p)
    for (int k = 0; k < p; k++)
    {
        int total = bucket_sizes[k];
        if (total == 0)
        {
            continue;
        }
        int *idx = new int[p];
        for (int t = 0; t < p; t++)
        {
            idx[t] = 0;
        }
        for (int out = 0; out < total; out++)
        {
            int best_t = -1;
            double best_val = 0.0;
            for (int t = 0; t < p; t++)
            {
                int len = counts[t * p + k];
                if (idx[t] >= len)
                {
                    continue;
                }
                int base = t * local_n + pos[t][k];
                double val = a[base + idx[t]];
                if (best_t == -1 || val < best_val)
                {
                    best_t = t;
                    best_val = val;
                }
            }
            b[bucket_starts[k] + out] = best_val;
            idx[best_t]++;
        }
        delete[] idx;
    }

    finish = omp_get_wtime();
	cout << "parallel time with "<< p << " threads = " << finish-start << endl;
	start = omp_get_wtime();
	sort(c, c + n);
	finish = omp_get_wtime();
	cout << "serial time = " << finish - start << endl;
	for (int i = 0; i < n; i++)
		if (b[i] != c[i])
			cout << "error" << endl;
	delete[] a;
	delete[] b;
	delete[] c;
    delete[] sample;
    delete[] pivot;
    for (int i = 0; i < p; i++)
    {
        delete[] pos[i];
    }
    delete[] pos;
    delete[] counts;
    delete[] bucket_sizes;
    delete[] bucket_starts;
	return 0;
}
