#include "mpi.h"
#include <iostream>
#include <cmath>
#include <algorithm>
using namespace std;
int main(void)
{
	int rank, p;
	int n = 2048;
	MPI_Init(NULL, NULL);
	MPI_Comm_rank(MPI_COMM_WORLD, &rank);
	MPI_Comm_size(MPI_COMM_WORLD, &p);
	int m = n / p;
	int w = n + 1;
	double* a = new double[m * w]; //a[i*w+n]表示b[i]
	double* z = new double[m * w]; //验证需要
	double* x = new double[n];
	for (int i = 0; i < m; i++)
	{
		srand((rank * m + i) * 10);
		for (int j = 0; j < w; j++)
			a[i * w + j] = z[i * w + j] = rand() * 1.0 / RAND_MAX;
	}
	double start = MPI_Wtime();
	/*用户代码开始位置：只可在此补充代码，其他勿动*/

    double* pivot_row = new double[w];

    for (int k = 0; k < n; k++) {
        int owner = k / m;
        int local_k = k % m;

        int local_pivot_row = local_k;
        double pivot = 0.0;

        if (rank == owner) {
            pivot = fabs(a[local_k * w + k]);
            for (int i = local_k + 1; i < m; i++) {
                double val = fabs(a[i * w + k]);
                if (val > pivot) {
                    pivot = val;
                    local_pivot_row = i;
                }
            }

            if (local_pivot_row != local_k) {
                for (int j = k; j < w; j++) {
                    swap(a[local_k * w + j], a[local_pivot_row * w + j]);
                }
            }

            double pivot_value = a[local_k * w + k];
            for (int j = k; j < w; j++) {
                a[local_k * w + j] /= pivot_value;
            }

            for (int j = k; j < w; j++) {
                pivot_row[j] = a[local_k * w + j];
            }
        }

        MPI_Bcast(pivot_row + k, w - k, MPI_DOUBLE, owner, MPI_COMM_WORLD);

        for (int i = 0; i < m; i++) {
            int global_i = rank * m + i;
            if (global_i != k) {
                double factor = a[i * w + k];
                if (fabs(factor) > 1e-12) {  
                    for (int j = k; j < w; j++) {
                        a[i * w + j] -= factor * pivot_row[j];
                    }
                }
            }
        }
    }

    for (int i = 0; i < m; i++) {
        x[rank * m + i] = a[i * w + n];
    }

    MPI_Allgather(MPI_IN_PLACE, m, MPI_DOUBLE,
        x, m, MPI_DOUBLE, MPI_COMM_WORLD);

    delete[] pivot_row;

	/*用户代码结束位置：只可在此补充代码，其他勿动*/
	MPI_Barrier(MPI_COMM_WORLD);
	double finish = MPI_Wtime();
	if (rank == 0)
		cout << "execution time = " << finish - start << endl;
	//验证开始
	double max_dif;
	double local_dif = 0;
	for (int i = 0; i < m; i++)
	{
		double dif = z[i * w + n];
		for (int j = 0; j < n; j++)
			dif -= z[i * w + j] * x[j];
		local_dif = max(local_dif, abs(dif));
	}
	MPI_Reduce(&local_dif, &max_dif, 1, MPI_DOUBLE, MPI_MAX, 0, MPI_COMM_WORLD);
	if (rank == 0)
		cout << "max difference = " << max_dif << endl;
	delete[] a;
	delete[] z;
	delete[] x;
	MPI_Finalize();
	return 0;
}