#include <iostream>
#include <sys/time.h>
#include <string>
#include <fstream>
#include <sstream>
#include <vector>
#include <algorithm>
using namespace std;

long long sum = 0;
int country = 450;
int color_num = 15;
int* colors; // 记录每个国家实际使用的颜色
int* color_rest_num; // 记录每个国家能使用的颜色
int* flag_country; // 记录每个国家是否已经被选
int* degree;
double t0, t1, t2, tt;
int color_used = 0;
int* current_choice;
int edge = 240000;
int realedge = 0;
int break_f = 0;
int final_sum = 0;

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

void MRV(vector<int>& mrv)
{
    int ind = -1;
    int min = color_num + 1;
    for (int i = 0; i < country; i++)
    {
        if (color_rest_num[i] < min && !flag_country[i])
        {
            ind = i;
            min = color_rest_num[i];
        }
    }
    mrv.push_back(ind);
    for (int i = 0; i < country; i++)
    {
        if (color_rest_num[i] == min && !flag_country[i])
        {
            mrv.push_back(i);
        }
    }
    return;
}

int DH(vector<int> mrv)
{
    int ind = -1;
    int max = -1;
    for (int i = 0; i < mrv.size(); i++)
    {
        if (mrv[i] == -1)
        {
            break;
        }
        if (degree[mrv[i]] > max)
        {
            max = degree[mrv[i]];
            ind = mrv[i];
        }
    }
    return ind;
}

// 回溯函数
void fun(int p, int** arr, int selected_num)
{
    if (break_f)
    {
        return;
    }
    if (sum >= 1) //超过1000w解
    {
        break_f = 1;
        final_sum = sum;
        return;
    }
    if (selected_num == country)
    {
        sum += color_rest_num[p];
        current_choice[p] = color_rest_num[p];
        tt = get_current_time();
        if (sum == 1)
        {
            t1 = tt;
        }
        cout << "第" << sum << "个解时间：" << (tt - t0) * 1000 << "ms" << endl;
        return;
    }
    current_choice[p] = 0;
    for (int c = 0; c < color_num; c++)
    {
        if (isSafe(p, c, arr))
        {
            flag_country[p] = 1;
            colors[p] = c; // 记录国家p选择的颜色
            vector<int> change; //被改变过的邻接点
            int bro_f = 0; //向前探查
            for (int j = 0; j < country; j++)
            {
                if (arr[p][j] && !flag_country[j])
                {
                    int sub_f = 0; //是否减少该邻接点可选数目
                    for (int k = 0; k < country; k++)
                    {
                        if (arr[j][k] && flag_country[k] && colors[k] == c && k != p)
                        {
                            sub_f = 1;  //这个颜色本来就不能选
                            break;
                        }
                    }
                    if (!sub_f)
                    {
                        color_rest_num[j]--;
                        change.push_back(j);
                        if (!color_rest_num[j]) //有邻接点无色可填
                        {
                            bro_f = 1;
                            break;
                        }
                    }
                }
            }
            int newcolor = c + 1 > color_used;
            int pre = 0;
            if (!bro_f)
            {
                //int x=p+1;
                vector<int> mrv; //MRV相同的点
                MRV(mrv);
                //int x = mrv[0];
                int x = DH(mrv); //取度更大的点
                if (x != -1)
                    if (!mrv.empty())
                        if (newcolor)
                        {
                            color_used++;
                        }

                fun(x, arr, selected_num + 1);
                pre = current_choice[x];
            }
            for (int j = 0; j < change.size(); j++)
            {
                color_rest_num[change[j]]++;
            }
            colors[p] = -1; // 回溯
            flag_country[p] = 0;
            if (newcolor)
            {
                current_choice[p] += pre * (color_num - color_used + 1);
                sum += pre * (color_num - color_used);
                color_used--;
                break;
            }
            current_choice[p] += pre;
        }
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
                degree[u - 1]++;
                degree[v - 1]++;
            }
        }
    }
    return;
}

void randomarr(int** arr) //产生可以四色填涂的图  限制度最大为10
{
    int p[6] = { 0,0,0,1,1,2 };
    int q[6] = { 1,2,3,2,3,3 };
    for (int i = 0; i < 6; i++)
    {
        for (int j = 0; j < edge / 6; j++)
        {
            int u, v;
            u = v = 0;//随机序数
            u = rand() % ((country / 4));
            v = rand() % ((country / 4));
            u += p[i] * country / 4;
            v += q[i] * country / 4;
            if (u == v || arr[u][v])
            {
                continue;
            }

            if (degree[u] < 10 && degree[v] < 10)
            {
                arr[u][v] = arr[v][u] = 1;
                degree[u]++;
                degree[v]++;
                realedge++;
            }
        }
    }
}

int main() {
    srand(time(nullptr));
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

    // arr[0][1] = arr[1][0] = 1;
    // arr[0][3] = arr[3][0] = 1;
    // arr[0][4] = arr[4][0] = 1;
    // arr[1][2] = arr[2][1] = 1;
    // arr[1][3] = arr[3][1] = 1;
    // arr[1][4] = arr[4][1] = 1;
    // arr[2][4] = arr[4][2] = 1;
    // arr[2][5] = arr[5][2] = 1;
    // arr[2][6] = arr[6][2] = 1;
    // arr[3][4] = arr[4][3] = 1;
    // arr[4][5] = arr[5][4] = 1;
    // arr[4][7] = arr[7][4] = 1;
    // arr[5][6] = arr[6][5] = 1;
    // arr[5][7] = arr[7][5] = 1;
    // arr[5][8] = arr[8][5] = 1;
    // arr[6][8] = arr[8][6] = 1;
    // arr[7][8] = arr[8][7] = 1;



    colors = new int[country];
    for (int i = 0; i < country; i++) {
        colors[i] = -1; // 初始化颜色为-1（未着色）
    }
    color_rest_num = new int[country];
    for (int i = 0; i < country; i++) {
        color_rest_num[i] = color_num; // 初始化颜色为color_num（全部可选）
    }
    flag_country = new int[country];
    for (int i = 0; i < country; i++) {
        flag_country[i] = 0; // 初始化flag为0（都未被选）
    }
    degree = new int[country];
    for (int i = 0; i < country; i++) {
        degree[i] = 0; // 初始化度为0
    }
    current_choice = new int[country];
    for (int i = 0; i < country; i++) {
        current_choice[i] = 0; // 初始化可选为0
    }


    // for (int i = 0; i < country; i++)
    // {
    //     for (int j = i + 1; j < country; j++)
    //     {
    //         if (arr[i][j])
    //         {
    //             degree[i]++;
    //             degree[j]++;
    //         }

    //     }
    // }

    readGraphFromFile("le450_15b.txt", country, arr);
    // randomarr(arr);
    // for(int i=0;i<country;i++)
    // {
    //     for(int j=0;j<country;j++)
    //     {
    //         cout<<arr[i][j]<<" ";
    //     }
    //     cout<<endl;
    // }

    t0 = tt = get_current_time();
    fun(3, arr, 1);
    t2 = get_current_time();
    cout << "Total valid colorings: " << sum << endl;
    cout << "总时间：" << (t2 - t0) * 1000 << "ms" << endl;
    cout << "第一个解时间：" << (t1 - t0) * 1000 << "ms" << endl;
    cout << "10分钟内共解出" << final_sum << "个解" << endl;

    //cout<<"country:"<<country<<endl<<"realedge:"<<realedge<<endl;    // The line below will not compile as max() needs two arguments or a container.
    // To find the maximum value in the degree array, use the following approach:
    // int max_degree = degree[0];
    // for (int i = 1; i < country; i++) {
    //     if (degree[i] > max_degree) {
    //         max_degree = degree[i];
    //     }
    // }
    // cout << max_degree;    return 0;
}