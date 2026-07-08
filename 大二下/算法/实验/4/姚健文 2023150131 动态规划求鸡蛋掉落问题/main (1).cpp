#include <iostream>
#include <sys/time.h>
#include <algorithm>
#include <climits>
#include <chrono>
using namespace std;
int** dparr;
int** dpmidarr;
int** dpin2;
int** dpc;
double get_current_time()
{
	timeval tv;
	gettimeofday(&tv, nullptr);
	return tv.tv_sec + tv.tv_usec / 1e6;
}

double get_current_time2() {
    auto now = std::chrono::high_resolution_clock::now();
    return std::chrono::duration<double>(now.time_since_epoch()).count();
}

int force(int e, int f) //蛮力
{
	if (e == 1 || f <= 1)
		return f;
	int ans = INT_MAX;
	for (int i = 1; i <= f; i++)
	{
		int a = max(force(e, f - i), force(e - 1, i - 1)) + 1;
		ans = min(ans, a);
	}
	return ans;
}

void dp(int e, int f, int** dparr)  //朴素dp
{
	for (int i = 2; i < e + 1; i++)
	{
		for (int j = 2; j < f + 1; j++)
		{
			int min = INT_MAX;
			for (int k = 2; k <= j; k++)
			{
				int temp = max(dparr[i][j - k], dparr[i - 1][k - 1]);
				if (min > temp)
					min = temp;
			}
			dparr[i][j] = min + 1;
		}
	}
}

void dp_middle(int e, int f, int** dpmidarr)  //二分dp
{
	for (int i = 2; i < e + 1; i++)
	{
		for (int j = 2; j < f + 1; j++)
		{
			int left = 1;
			int right = j;
			while (left < right - 1)
			{
				int mid = (left + right) / 2;
				if (dpmidarr[i - 1][mid - 1] < dpmidarr[i][j - mid])
				{
					left = mid;
				}
				else if (dpmidarr[i - 1][mid - 1] > dpmidarr[i][j - mid])
				{
					right = mid;
				}
				else
				{
					left = right = mid;
				}
			}
			int l = max(dpmidarr[i - 1][left - 1], dpmidarr[i][j - left]);
			int r = max(dpmidarr[i - 1][right - 1], dpmidarr[i][j - right]);
			dpmidarr[i][j] = min(l, r) + 1;
		}
	}
}

void dp_middle2(int e, int f, int** dpin2)  //二分dp优化
{
	for (int i = 2; i < e + 1; i++)
	{
		for (int j = 2; j < f + 1; j++)
		{
			int left = 1;
			int right = j;
			while (left < right - 1)
			{
				int mid = (left + right) / 2;
				if (dpin2[1][mid - 1] < dpin2[2][j - mid])
				{
					left = mid;
				}
				else if (dpin2[1][mid - 1] > dpin2[2][j - mid])
				{
					right = mid;
				}
				else
				{
					left = right = mid;
				}
			}
			int l = max(dpin2[1][left - 1], dpin2[2][j - left]);
			int r = max(dpin2[1][right - 1], dpin2[2][j - right]);
			dpin2[2][j] = min(l, r) + 1;
		}
		for (int j = 1; j < f + 1; j++)
		{
			dpin2[1][j] = dpin2[2][j];
		}
	}
}

long long dp_change(long long e, long long f, long long** dpc)  //逆向dp
{
	int t;
	if (e == 1)
	{
		return f;
	}

	for (t = 1; dpc[1][e] < f; t++)
	{
		for (long long i = 1; i < e + 1; i++)
		{
			dpc[2][i] = dpc[1][i - 1] + dpc[1][i] + 1;
		}
		for (long long i = 0; i < e + 1; i++)
		{
			dpc[1][i] = dpc[2][i];
		}
	}

	return t;
}

int main()
{
	for (int i = 0; i < 20; i++)//固定f为100，e从1到100间隔5
	{
		int** dparr;
		int** dpmidarr;
		int** dpin2;
		long long** dpc;

		int e = 2;
		long long f = i*50000000000000;
		if (!f)
		{
			f = 1;
		}

		// dparr = new int* [e + 1];
		// for (int i = 0; i < e + 1; i++)
		// {
		// 	dparr[i] = new int[f + 1];
		// }
		// for (int i = 0; i < e + 1; i++)
		// {
		// 	for (int j = 0; j < f + 1; j++)
		// 	{
		// 		dparr[i][j] = INT_MAX;
		// 	}
		// }

		// for (int i = 1; i < e + 1; i++)
		// {
		// 	dparr[i][1] = 1;
		// }
		// for (int i = 1; i < e + 1; i++)
		// {
		// 	dparr[i][0] = 0;
		// }
		// for (int i = 1; i < f + 1; i++)
		// {
		// 	dparr[1][i] = i;
		// }

		// dpmidarr = new int* [e + 1];
		// for (int i = 0; i < e + 1; i++)
		// {
		// 	dpmidarr[i] = new int[f + 1];
		// }
		// for (int i = 0; i < e + 1; i++)
		// {
		// 	for (int j = 0; j < f + 1; j++)
		// 	{
		// 		dpmidarr[i][j] = INT_MAX;
		// 	}
		// }

		// for (int i = 1; i < e + 1; i++)
		// {
		// 	dpmidarr[i][1] = 1;
		// }
		// for (int i = 1; i < e + 1; i++)
		// {
		// 	dpmidarr[i][0] = 0;
		// }
		// for (int i = 1; i < f + 1; i++)
		// {
		// 	dpmidarr[1][i] = i;
		// }

		// dpin2 = new int* [3];
		// for (int i = 0; i < 3; i++)
		// {
		// 	dpin2[i] = new int[f + 1];
		// }
		// for (int i = 0; i < 3; i++)
		// {
		// 	for (int j = 0; j < f + 1; j++)
		// 	{
		// 		dpin2[i][j] = INT_MAX;
		// 	}
		// }

		// for (int i = 1; i < 3; i++)
		// {
		// 	dpin2[i][1] = 1;
		// }
		// for (int i = 1; i < 3; i++)
		// {
		// 	dpin2[i][0] = 0;
		// }
		// for (int i = 1; i < f + 1; i++)
		// {
		// 	dpin2[1][i] = i;
		// }

		dpc = new long long* [3];
		for (long long i = 0; i < 3; i++)
		{
			dpc[i] = new long long[e + 1];
		}
		for (long long i = 0; i < 3; i++)
		{
			for (long long j = 0; j < e + 1; j++)
			{
				dpc[i][j] = 0;
			}
		}
		for (long long i = 0; i < e + 1; i++)
		{
			dpc[1][i] = 1;
		}
		dpc[1][1] = 1;



		double t0,t1,t2,t3,t4,t5;
		t0 = t1 = t2 = t3 = t4 = t5 = 0;

		t0 = get_current_time2();
		//int x = force(e, f);
		t1 = get_current_time2();
		//dp(e, f, dparr);
		t2 = get_current_time2();
		//dp_middle(e, f, dpmidarr);
		t3 = get_current_time2();
		//dp_middle2(e, f, dpin2);
		t4 = get_current_time2();
		int t = dp_change(e, f, dpc);
		t5 = get_current_time2();
		cout << "e: " << e << " f: " << f << endl;
		//cout<<x<<"蛮力时间："<<t1-t0<<endl;
		// cout << dparr[e][f] << "  朴素dp时间：" << t2 - t1 << endl;
		//cout << dpmidarr[e][f] << "  dp二分时间：" << t3 - t2 << endl;
		//cout << dpin2[1][f] << "  dp二分空间优化时间：" << t4 - t3 << endl;
		cout << t << "  逆向dp时间：" << t5 - t4 << endl;

	}
}