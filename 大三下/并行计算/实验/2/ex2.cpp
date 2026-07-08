#include "mpi.h"
#include <math.h>
#include <iostream>
using namespace std;
int main(void)
{
	int n = 2100; //矩阵大小为n*n  420  840  1260  1680  2100  2520
	int m; //子块大小为m*m
	int rank, p, q;
	MPI_Init(NULL, NULL);
	MPI_Comm_rank(MPI_COMM_WORLD, &rank);
	MPI_Comm_size(MPI_COMM_WORLD, &p);
	q = int(sqrt(double(p)));
	m = n / q;
	double* a = new double[m * m]; //a[i*m+j]为子块第i行第j列元素
	double* b = new double[m * m];
	double* c = new double[m * m];
	double* a_buf = new double[m * m];
	double* b_buf = new double[m * m];
	double* a_check = new double[m * m]; //验证需要
	double* b_check = new double[m * m]; //验证需要
	double* c_check = new double[m * m]; //验证需要
	for (int i = 0; i < m * m; i++)
	{
		a[i] = a_check[i] = rand() * 1.0 / RAND_MAX;
		b[i] = b_check[i] = rand() * 1.0 / RAND_MAX;
		c[i] = c_check[i] = 0;
	}
	double start = MPI_Wtime();
	/*用户代码开始位置：只可在此补充代码，其他勿动*/

    // 初始化对准
    int my_i = rank/ q;
    int my_j = rank % q;

    // 通信
    int a_dest = my_i * q + (my_j - my_i + q) % q; // my_i  (my_j-my_i+q)%q
    int b_dest = (my_i - my_j + q) % q * q + my_j; // (my_i-my_j+q)%q  my_j
    int a_sourse = my_i * q + (my_j + my_i) % q;   // my_i  (my_j+my_i)%q
    int b_sourse = (my_i + my_j) % q * q + my_j;   // (my_i+my_j)%q  my_j

    MPI_Sendrecv(a, m * m, MPI_DOUBLE, a_dest, 0, a_buf, m * m, MPI_DOUBLE, a_sourse, 0, MPI_COMM_WORLD, MPI_STATUS_IGNORE);
    MPI_Sendrecv(b, m * m, MPI_DOUBLE, b_dest, 0, b_buf, m * m, MPI_DOUBLE, b_sourse, 0, MPI_COMM_WORLD, MPI_STATUS_IGNORE);

    double* tmp = a;
    a = a_buf;
    a_buf = tmp;

    tmp = b;
    b = b_buf;
    b_buf = tmp;

    for (int i = 0; i < m; i++)
    {
        for (int j = 0; j < m; j++)
        {
            for (int k = 0; k < m; k++)
            {
                c[i * m + j] += a[i * m + k] * b[k * m + j];
            }
        }
    }

    // 循环q次  初始已经有1次
    for (int x = 0; x < q - 1; x++)
    {
        a_dest = my_i * q + (my_j - 1 + q) % q; // my_i  (my_j-1+q)%q
        b_dest = (my_i - 1 + q) % q * q + my_j; // (my_i-1+q)%q  my_j
        a_sourse = my_i * q + (my_j + 1) % q;   // my_i  (my_j+1)%q
        b_sourse = (my_i + 1) % q * q + my_j;   // (my_i+1)%q  my_j

        MPI_Sendrecv(a, m * m, MPI_DOUBLE, a_dest, 0, a_buf, m * m, MPI_DOUBLE, a_sourse, 0, MPI_COMM_WORLD, MPI_STATUS_IGNORE);
        MPI_Sendrecv(b, m * m, MPI_DOUBLE, b_dest, 0, b_buf, m * m, MPI_DOUBLE, b_sourse, 0, MPI_COMM_WORLD, MPI_STATUS_IGNORE);

        tmp = a;
    	a = a_buf;
    	a_buf = tmp;

    	tmp = b;
    	b = b_buf;
    	b_buf = tmp;

        for (int i = 0; i < m; i++)
        {
            for (int j = 0; j < m; j++)
            {
                for (int k = 0; k < m; k++)
                {
                    c[i * m + j] += a[i * m + k] * b[k * m + j];
                }
            }
        }
    }

    /*用户代码结束位置：只可在此补充代码，其他勿动*/
	MPI_Barrier(MPI_COMM_WORLD);
	double finish = MPI_Wtime();
	if (rank == 0)
		cout << "execution time = " << finish - start << endl;
	//验证开始
	double* aa = new double[m * n]; //存储当前子块所在行的A子块
	double* bb = new double[n * m]; //存储当前子块所在列的B子块
	MPI_Comm rowComm, columnComm;
	MPI_Comm_split(MPI_COMM_WORLD, rank / q, rank % q, &rowComm);
	MPI_Comm_split(MPI_COMM_WORLD, rank % q, rank / q, &columnComm);
	MPI_Allgather(a_check, m * m, MPI_DOUBLE, aa, m * m, MPI_DOUBLE, rowComm);
	MPI_Allgather(b_check, m * m, MPI_DOUBLE, bb, m * m, MPI_DOUBLE, columnComm);
	for (int x = 0; x < q; x++)
	{
		int offset = x * m * m;
		for (int i = 0; i < m; i++)
			for (int k = 0; k < m; k++)
				for (int j = 0; j < m; j++)
					c_check[i * m + j] += aa[offset + i * m + k] * bb[offset + k * m + j];
	}
	for (int i = 0; i < m * m; i++)
		if (abs(c[i] - c_check[i]) > 0)
			cout << "error!" << endl;
	delete[] aa;
	delete[] bb;
	//验证结束
	delete[] a;
	delete[] b;
	delete[] c;
	delete[] a_buf;
	delete[] b_buf;
	delete[] a_check;
	delete[] b_check;
	delete[] c_check;
	MPI_Finalize();
	return 0;
}
