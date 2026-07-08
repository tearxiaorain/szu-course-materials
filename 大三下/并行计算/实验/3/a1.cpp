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
	double * a = new double[m * w]; //a[i*w+n]表示b[i]
	double * z = new double[m * w]; //验证需要
	double * x = new double[n];
	for (int i = 0; i < m; i++)
	{
		srand((rank * m + i) * 10);
		for (int j = 0; j < w; j++)
			a[i * w + j] = z[i * w + j] = rand() * 1.0 / RAND_MAX;
	}
	double start = MPI_Wtime();
	/*用户代码开始位置：只可在此补充代码，其他勿动*/
    struct {
        double val;
        int rank;
    } local_max, global_max;

    double* pivot_row = new double[w];

    for (int k = 0; k < n; k++) {
        local_max.val = -1;
        local_max.rank = -1;

        int owner = k / m;
        int local_k = k % m;

        int start_i = (rank < owner) ? m : ((rank == owner) ? local_k : 0);
        
        for (int i = start_i; i < m; i++) {
            if (abs(a[i * w + k]) > local_max.val) {
                local_max.val = abs(a[i * w + k]);
                local_max.rank = rank * m + i; 
            }
        }

        MPI_Allreduce(&local_max, &global_max, 1, MPI_DOUBLE_INT, MPI_MAXLOC, MPI_COMM_WORLD);
        
        int pivot_global = global_max.rank;
        int pivot_owner = pivot_global / m;
        int pivot_local = pivot_global % m;

        if (owner == pivot_owner) {
            if (rank == owner) {
                for (int j = 0; j < w; j++) {
                    swap(a[local_k * w + j], a[pivot_local * w + j]);
                }
            }
        } else {
            if (rank == owner) {
                MPI_Send(&a[local_k * w], w, MPI_DOUBLE, pivot_owner, 0, MPI_COMM_WORLD);
                MPI_Recv(&a[local_k * w], w, MPI_DOUBLE, pivot_owner, 0, MPI_COMM_WORLD, MPI_STATUS_IGNORE);
            } else if (rank == pivot_owner) {
                double* temp = new double[w];
                MPI_Recv(temp, w, MPI_DOUBLE, owner, 0, MPI_COMM_WORLD, MPI_STATUS_IGNORE);
                MPI_Send(&a[pivot_local * w], w, MPI_DOUBLE, owner, 0, MPI_COMM_WORLD);
                for (int j = 0; j < w; j++) {
                    a[pivot_local * w + j] = temp[j];
                }
                delete[] temp;
            }
        }

        if (rank == owner) {
            for (int j = 0; j < w; j++) {
                pivot_row[j] = a[local_k * w + j];
            }
            double div = pivot_row[k];
            for (int j = k; j < w; j++) {
                pivot_row[j] /= div;
                a[local_k * w + j] = pivot_row[j];
            }
        }

        MPI_Bcast(pivot_row, w, MPI_DOUBLE, owner, MPI_COMM_WORLD);

        for (int i = 0; i < m; i++) {
            if (rank == owner && i == local_k) continue;
            double factor = a[i * w + k];
            for (int j = k; j < w; j++) {
                a[i * w + j] -= factor * pivot_row[j];
            }
        }
    }

    double* local_x = new double[m];
    for (int i = 0; i < m; i++) {
        local_x[i] = a[i * w + n];
    }
    MPI_Allgather(local_x, m, MPI_DOUBLE, x, m, MPI_DOUBLE, MPI_COMM_WORLD);

    delete[] pivot_row;
    delete[] local_x;
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
