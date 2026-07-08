#include "mpi.h"
#include <iostream>
using namespace std;
int main(void)
{
	const int n = 1000;
	double* a = new double[n * n]; //用一维数组表示矩阵，a[i*n+j]为矩阵第i行第j列元素
	double* b = new double[n * n];
	double* c = new double[n * n];
	int rank, size;
	MPI_Init(NULL, NULL);
	MPI_Comm_rank(MPI_COMM_WORLD, &rank);
	MPI_Comm_size(MPI_COMM_WORLD, &size);
	if (rank == 0)
	{
		srand(0);
		for (int i = 0; i < n; i++)
			for (int j = 0; j < n; j++)
			{
				a[i * n + j] = rand() * 1.0 / RAND_MAX;
				b[i * n + j] = rand() * 1.0 / RAND_MAX;
			}
	}
	double start = MPI_Wtime();

	//并行代码
    //每个进程负责矩阵a的部分行，与完整的矩阵b相乘，再收集回进程0
    MPI_Bcast(b, n * n, MPI_DOUBLE, 0, MPI_COMM_WORLD);
    int base = n / size;
    int rem = n % size;
    int local_rows = (rank < rem) ? base + 1 : base;
    //每个进程负责local_rows行，余数分配给前rem个进程使得尽量平均

    //分配矩阵a
    int* sendcounts = nullptr;
    int* displs = nullptr;
    if (rank == 0) 
    {
        sendcounts = new int[size];
        displs = new int[size];
        int offset = 0;
        for (int i = 0; i < size; i++) 
        {
            int rows = (i < rem) ? base + 1 : base;
            sendcounts[i] = rows * n;
            displs[i] = offset * n;
            offset += rows;
        }
    }
    double* local_a = new double[local_rows * n];
    MPI_Scatterv(a, sendcounts, displs, MPI_DOUBLE, local_a, local_rows * n, MPI_DOUBLE, 0, MPI_COMM_WORLD);

    //本地计算矩阵c
    double* local_c = new double[local_rows * n]();
    for (int i = 0; i < local_rows; i++) 
    {
        for (int j = 0; j < n; j++)
        {
            for(int k = 0; k < n; k++)
            {
                local_c[i * n + j] += local_a[i * n + k] * b[k * n + j];
            }
        }
    }

    //收集矩阵c
    int* recvcounts = nullptr;
    int* recvdispls = nullptr;
    if (rank == 0) 
    {
        recvcounts = new int[size];
        recvdispls = new int[size];
        int offset = 0;
        for (int i = 0; i < size; i++)
        {
            int rows = (i < rem) ? base + 1 : base;
            recvcounts[i] = rows * n;
            recvdispls[i] = offset * n;
            offset += rows;
        }
    }
    MPI_Gatherv(local_c, local_rows * n, MPI_DOUBLE, c, recvcounts, recvdispls, MPI_DOUBLE, 0, MPI_COMM_WORLD);

    //释放内存
    delete[] local_a;
    delete[] local_c;
    if (rank == 0) 
    {
        delete[] sendcounts;
        delete[] displs;
        delete[] recvcounts;
        delete[] recvdispls;
    }

    //并行程序结束
	
	double finish = MPI_Wtime();
	if (rank == 0)
	{
		cout << "execution time = " << finish - start << endl;
		for (int i = 0; i < n; i++)
			for (int j = 0; j < n; j++)
			{
				double s = 0;
				for (int k = 0; k < n; k++)
					s += a[i * n + k] * b[k * n + j];
				if (s != c[i * n + j])
					cout << "error" << endl;
			}
	}
	MPI_Finalize();
	delete[] a;
	delete[] b;
	delete[] c;
	return 0;
}
