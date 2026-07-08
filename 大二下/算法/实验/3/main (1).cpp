#include <iostream>
#include <sys/time.h>
#include <string>
#include <fstream>
#include <sstream>
#include <vector>
using namespace std;

int sum = 0;
int country = 9;
int color_num = 4;
int* colors; // 记录每个国家实际使用的颜色
int* color_rest_num; // 记录每个国家实际使用的颜色
int* flag_country; // 记录每个国家实际使用的颜色
double t0, t1, t2;

double get_current_time()
{
    timeval tv;
    gettimeofday(&tv, nullptr);
    return tv.tv_sec + tv.tv_usec / 1e6;
}

// 检查国家p选择颜色c是否有效
bool isSafe(int p, int c, int** arr) {
    for (int i = 0; i < country; i++) {
        if (arr[p][i] && colors[i] == c) {
            return false;
        }
    }
    return true;
}

int MRV()
{
    int ind = -1;
    int min = color_num+1;
    for (int i = 0; i < country; i++)
    {
        if (color_rest_num[i] < min)
        {
            ind = i;
            min = color_rest_num[i];
        }
    }
    return ind;
}

// 回溯函数
void fun(int p, int** arr, int selected_num) {
    if (selected_num == country) {
        sum++;
        if (sum == 1)
        {
            t1 = get_current_time();
        }
        return;
    }
    for (int c = 0; c < color_num; c++) {
        flag_country[p] = 1;
        if (isSafe(p, c, arr)) {
            colors[p] = c; // 记录国家p选择的颜色
            for (int j = 0; j < country; j++)
            {
                if (arr[p][j]&&!flag_country[j])
                {
                    color_rest_num[j]--;
                }
            }
            int x = MRV();
            fun(x, arr,selected_num+1);
            for (int j = 0; j < country; j++)
            {
                if (arr[p][j] && !flag_country[j])
                {
                    color_rest_num[j]++;
                }
            }
            colors[p] = -1; // 回溯
        }
        flag_country[p] = 0;
    }
}

void readGraphFromFile(const string& filename, int& country, int** arr) {
    ifstream File;
    File.open(filename);
    if (!File) {
        cout << "File open failed!" << endl;
        exit(1);
    }
    if (File) {
        string line;
        while (getline(File, line))
        {
            int len = line.length();
            if (line[0] == 'e')
            {
                int u = 0;
                int v = 0;
                int flag = 0;
                for (int i = 2; i < len; i++)
                {
                    if (line[i] == ' ')
                    {
                        flag++;
                        continue;
                    }
                    if (line[i] >= '0' && line[i] <= '9')
                    {
                        if (flag)
                        {
                            v *= 10;
                            v += (line[i] - '0');
                        }
                        else
                        {
                            u *= 10;
                            u += (line[i] - '0');
                        }
                    }

                }
                arr[u - 1][v - 1] = arr[v - 1][u - 1] = 1;
            }
        }
    }
}



int main() {
    int** arr;
    arr = new int* [country];
    for (int i = 0; i < country; i++)
    {
        arr[i] = new int[country];
        for (int j = 0; j < country; j++)
        {
            arr[i][j] = 0;
        }
    }

    // 初始化邻接矩阵

    arr[0][1] = arr[1][0] = 1;
    arr[0][3] = arr[3][0] = 1;
    arr[0][4] = arr[4][0] = 1;
    arr[1][2] = arr[2][1] = 1;
    arr[1][3] = arr[3][1] = 1;
    arr[1][4] = arr[4][1] = 1;
    arr[2][4] = arr[4][2] = 1;
    arr[2][5] = arr[5][2] = 1;
    arr[2][6] = arr[6][2] = 1;
    arr[3][4] = arr[4][3] = 1;
    arr[4][5] = arr[5][4] = 1;
    arr[4][7] = arr[7][4] = 1;
    arr[5][6] = arr[6][5] = 1;
    arr[5][7] = arr[7][5] = 1;
    arr[5][8] = arr[8][5] = 1;
    arr[6][8] = arr[8][6] = 1;
    arr[7][8] = arr[8][7] = 1;

    //readGraphFromFile("le450_5a .txt", country, arr);

    colors = new int[country];
    for (int i = 0; i < country; i++) {
        colors[i] = -1; // 初始化颜色为-1（未着色）
    }
    color_rest_num = new int[country];
    for (int i = 0; i < country; i++) {
        color_rest_num[i] = color_num; // 初始化颜色为-1（未着色）
    }
   flag_country = new int[country];
    for (int i = 0; i < country; i++) {
        flag_country[i] = 0; // 初始化颜色为-1（未着色）
    }

    t0 = get_current_time();
    fun(0, arr,0);
    t2 = get_current_time();
    cout << "Total valid colorings: " << sum << endl;
    cout << "总时间：" << (t2 - t0) * 1000 << "ms" << endl;
    cout << "第一个解时间：" << (t1 - t0) * 1000 << "ms" << endl;
    return 0;
}