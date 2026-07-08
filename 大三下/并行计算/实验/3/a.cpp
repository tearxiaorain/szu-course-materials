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

	int *flag = new int[n];
	int *where = new int[n];
	double *pivot = new double[w];
	int flag_0 = 0;
	for (int i = 0; i < n; i++)
	{
		flag[i] = 0;
		where[i] = -1;
		pivot[i] = 0;
	}
	pivot[n] = 0;

	for (int i = 0; i < n; i++)
	{
		double my_max = 0;
		int my_index = -1;
		struct
		{
			double val;
			int idx;
		} in, out;

		for (int j = 0; j < m; j++)
		{
			if (flag[rank * m + j] == 0)
			{
				if (fabs(a[j * w + i]) > my_max)
				{
					my_max = abs(a[j * w + i]);
					my_index = j;
				}
			}
		}

		in.val = my_max;
		in.idx = (my_index == -1) ? n : (rank * m + my_index);
		MPI_Allreduce(&in, &out, 1, MPI_DOUBLE_INT, MPI_MAXLOC, MPI_COMM_WORLD);
		double global_max = out.val;
		int global_index = out.idx;

		if (global_max < 1e-15)
		{
			flag_0 = 1;
			break;
		}

		if (rank == global_index / m)
		{
			int local_index = global_index % m;
			double piv = a[local_index * w + i];
			for (int j = 0; j < w; j++)
			{
				pivot[j] = a[local_index * w + j] / piv;
				a[local_index * w + j] = pivot[j];
			}
		}

		MPI_Bcast(pivot + i, w - i, MPI_DOUBLE, global_index / m, MPI_COMM_WORLD);
		flag[global_index] = 1;
		where[i] = global_index;

		for (int j = 0; j < m; j++)
		{
			if (rank * m + j != global_index)
			{
				double factor = a[j * w + i];
				if (factor != 0)
				{
					for (int k = i + 1; k < w; k++)
					{
						a[j * w + k] -= factor * pivot[k];
					}
				}
			}
		}
	}

	if (flag_0 == 1)
	{
		for (int i = 0; i < n; i++)
			x[i] = 0;
	}
	else
	{
		for (int i = 0; i < n; i++)
		{
			x[i] = 0;
			if (where[i] >= rank * m && where[i] < (rank + 1) * m)
				x[i] = a[(where[i] % m) * w + n];
		}
		MPI_Allreduce(MPI_IN_PLACE, x, n, MPI_DOUBLE, MPI_SUM, MPI_COMM_WORLD);
	}
	delete[] flag;
	delete[] where;
	delete[] pivot;

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
