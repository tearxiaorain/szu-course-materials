#include<iostream>
#include<utility>
#include<vector>
#include<math.h>
#include<limits.h>
#include<algorithm>
#include <cmath>
#include <cstdlib>
#include <sys/time.h>
#include <fstream>
using namespace std;

pair<int, int> p1(0, 0);
pair<int, int> p2(0, 0);
pair<int, int> p3(0, 0);
pair<int, int> p4(0, 0);
long long dis2_1 = INT_MAX;
long long dis2_2 = INT_MAX;

bool cmpy(pair<int, int> p1, pair<int, int> p2)
{
	if (p1.second == p2.second) return (p1.first < p2.first);
	else return (p1.second < p2.second);
}
bool cmpx(pair<int, int> p1, pair<int, int> p2)
{
	if (p1.first == p2.first) return (p1.second < p2.second);
	else return (p1.first < p2.first);
}

long long dis2(pair<int, int> p1, pair<int, int> p2)
{
	double dx = p1.first - p2.first;
	double dy = p1.second - p2.second;
	long long d = dx * dx + dy * dy;
	return d;
}

void fun_hebin(pair<int, int>* arr, int l, int r, int mid, long long& d2min,
	int& flag, pair<int, int>& pl, pair<int, int>& pr)
{
	vector<pair<int, int>> temp;
	for (int i = mid; i >= l; i--)
	{
		long long fx = fabs(arr[i].first - arr[mid].first);
		if (fx * fx < d2min)
		{
			temp.push_back(arr[i]);
		}
		else break;
	}
	for (int i = mid + 1; i <= r; i++)
	{
		long long fx = fabs(arr[i].first - arr[mid].first);
		if (fx * fx < d2min)
		{
			temp.push_back(arr[i]);
		}
		else break;
	}
	sort(temp.begin(), temp.end(), cmpy);
	for (int i = 0; i < temp.size(); i++)
	{
		for (int j = 1; j <= 4 && i + j < temp.size(); j++)
		{
			long long d2 = dis2(temp[i], temp[i + j]);
			if (d2 < d2min)
			{
				flag++;
				d2min = d2;
				pl = temp[i];
				pr = temp[i + j];
			}
		}
	}
	return;
}

long long fun(pair<int, int>* arr, int l, int r, pair<int, int>& pl, pair<int, int>& pr)
{
	if (r - l <= 3)
	{
		long long min_d = INT_MAX;
		for (int i = l; i <= r; i++)
		{
			for (int j = i + 1; j <= r; j++)
			{
				long long d = dis2(arr[i], arr[j]);
				if (d < min_d)
				{
					min_d = d;
					pl = arr[i];
					pr = arr[j];
				}
			}
		}
		return min_d;
	}

	pair<int, int> tpll(0, 0);
	pair<int, int> tplr(0, 0);
	pair<int, int> tprl(0, 0);
	pair<int, int> tprr(0, 0);
	pair<int, int> tpml(0, 0);
	pair<int, int> tpmr(0, 0);
	long long d2_l = fun(arr, l, (l + r) / 2, tpll, tplr);
	long long d2_r = fun(arr, (l + r) / 2 + 1, r, tprl, tprr);
	long long d2min = min(d2_l, d2_r);
	int flag = 0;
	fun_hebin(arr, l, r, (l + r) / 2, d2min, flag, tpml, tpmr);
	if (flag)
	{
		pl = tpml;
		pr = tpmr;
	}
	else if (d2min == d2_l)
	{
		pl = tpll;
		pr = tplr;
	}
	else
	{
		pl = tprl;
		pr = tprr;
	}
	return d2min;
}

double get_current_time()
{
	timeval tv;
	gettimeofday(&tv, nullptr);
	return tv.tv_sec + tv.tv_usec / 1e6;
}

void generate_random_points(pair<int, int>*& p, int n)
{
	int range = 10 * n;
	
	for (int i = 0; i < n; i++)
	{
		p[i].first = rand() % range;
		p[i].second = rand() % range;
	}
}


int main()
{
	srand(time(nullptr));
	int N = 1000000;
	ofstream fout("result.txt", ios::app);
	fout << N << endl;
	for (int k = 0; k < 1; k++)
	{
		dis2_1 = INT_MAX;
		dis2_2 = INT_MAX;
		
		pair<int, int>* points = new pair<int, int>[N];

		// 生成随机点集
		generate_random_points(points, N);

		//蛮力
		//记录时间t0
		double t0 = get_current_time();
		for (int i = 0; i < N - 1; i++)
		{
			for (int j = i + 1; j < N; j++)
			{
				long long d2 = dis2(points[i], points[j]);
				if (d2 < dis2_1)
				{
					p1.first = points[i].first;
					p2.first = points[j].first;
					p1.second = points[i].second;
					p2.second = points[j].second;
					dis2_1 = d2;
				}
			}
		}
		double t1 = get_current_time();
		//记录p1p2和dis
		//记录时间t1
		
		//分治法
		sort(points, points + N, cmpx);
		dis2_2 = fun(points, 0, N - 1, p3, p4);
		double t2 = get_current_time();
		//记录时间t2
		fout << k << endl;
		fout << "蛮力:\n";
		fout << p1.first << "," << p1.second << " " << p2.first << "," << p2.second
			<< ": " << sqrt(dis2_1) << endl;
		fout << "time: " << t1 - t0 << endl;
		fout << "分治:\n";
		fout << p3.first << "," << p3.second << " " << p4.first << "," << p4.second
			<< ": " << sqrt(dis2_2) << endl;
		fout << "time: " << t2 - t1 << endl;
		fout << endl;

		delete[] points;
	}
	fout << "over" <<endl<<endl;
}