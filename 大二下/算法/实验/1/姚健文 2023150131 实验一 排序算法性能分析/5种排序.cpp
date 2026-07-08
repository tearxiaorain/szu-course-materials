#include <iostream>
#include <fstream> 
#include <vector>
#include <cstdlib>
#include <sys/time.h>
#include <ctime>
#include <algorithm>
using namespace std;

// 排序算法声明
void selection_sort(vector<int>& arr);
void bubble_sort(vector<int>& arr);
void insertion_sort(vector<int>& arr);
void merge_sort(vector<int>& arr);
void quick_sort(vector<int>& arr);

// 辅助函数
void generate_random_array(vector<int>& arr);
bool is_sorted(const vector<int>& arr);
double get_current_time();
void test_sort_algorithm(vector<int>& original, void(*sort_func)(vector<int>&), const char* name, ofstream& fout);

int main() {
    ofstream fout("sort_results.txt");
    if (!fout) {
        cerr << "无法打开输出文件！" << endl;
        return 1;
    }
    srand(time(nullptr)); //初始化随机数
    vector<int> n_values = {10000}; // 测试规模，初始为1个1w
    
    int x = 1;
    for (int n : n_values) {
        fout << "\nTesting n = " << n << endl;
        fout << x++ << endl;

        vector<int> original_arr(n);
        generate_random_array(original_arr); //使用同一组数据的副本进行排序

        test_sort_algorithm(original_arr, selection_sort, "选择排序", fout);
        test_sort_algorithm(original_arr, bubble_sort, "冒泡排序", fout);
        test_sort_algorithm(original_arr, insertion_sort, "插入排序", fout);
        test_sort_algorithm(original_arr, merge_sort, "归并排序", fout);
        test_sort_algorithm(original_arr, quick_sort, "快速排序", fout);
        cout<<x-1<<endl;
    }
    fout.close();
    return 0;
}

// 排序算法实现

// 选择排序
void selection_sort(vector<int>& arr) {
    const size_t n = arr.size();
    for (size_t i = 0; i < n - 1; ++i) {
        size_t min_idx = i;
        for (size_t j = i + 1; j < n; ++j) {
            if (arr[j] < arr[min_idx]) min_idx = j;
        }
        swap(arr[i], arr[min_idx]);
    }
}

// 冒泡排序
void bubble_sort(vector<int>& arr) {
    const size_t n = arr.size();
    for (size_t i = 0; i < n - 1; ++i) {
        for (size_t j = 0; j < n - i - 1; ++j) {
            if (arr[j] > arr[j + 1]) {
                swap(arr[j], arr[j + 1]);
            }
        }
    }
}

// 插入排序
void insertion_sort(vector<int>& arr) {
    const size_t n = arr.size();
    for (size_t i = 1; i < n; ++i) {
        int key = arr[i];
        int j = i - 1;
        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];
            --j;
        }
        arr[j + 1] = key;
    }
}

// 归并排序实现
void merge(vector<int>& arr, int left, int mid, int right,
    vector<int>& temp) {
    int i = left, j = mid + 1, k = 0;
    while (i <= mid && j <= right) {
        temp[k++] = (arr[i] <= arr[j]) ? arr[i++] : arr[j++];
    }
    while (i <= mid) temp[k++] = arr[i++];
    while (j <= right) temp[k++] = arr[j++];
    copy(temp.begin(), temp.begin() + k, arr.begin() + left);
}

void merge_sort_impl(vector<int>& arr, int left, int right,
    vector<int>& temp) {
    if (left >= right) return;
    int mid = left + (right - left) / 2;
    merge_sort_impl(arr, left, mid, temp);
    merge_sort_impl(arr, mid + 1, right, temp);
    merge(arr, left, mid, right, temp);
}

void merge_sort(vector<int>& arr) {
    vector<int> temp(arr.size());
    merge_sort_impl(arr, 0, arr.size() - 1, temp);
}

// 快速排序实现
int partition(vector<int>& arr, int low, int high) {
    int pivotIndex = low + rand() % (high - low + 1);
    swap(arr[pivotIndex], arr[high]);
    int pivot = arr[high];

    int i = low - 1;
    for (int j = low; j < high; ++j) {
        if (arr[j] < pivot) {
            swap(arr[++i], arr[j]);
        }
    }
    swap(arr[i + 1], arr[high]);
    return i + 1;
}

void quick_sort_impl(vector<int>& arr, int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high);
        quick_sort_impl(arr, low, pi - 1);
        quick_sort_impl(arr, pi + 1, high);
    }
}

void quick_sort(vector<int>& arr) {
    quick_sort_impl(arr, 0, arr.size() - 1);
}

// 辅助函数

// 生成随机数组
void generate_random_array(vector<int>& arr) {
    for (auto& num : arr) {
        num = rand() % (arr.size() * 10);
    }
}

// 验证数组有序性
bool is_sorted(const vector<int>& arr) {
    for (size_t i = 0; i < arr.size() - 1; ++i) {
        if (arr[i] > arr[i + 1]) return false;
    }
    return true;
}

// 获取当前时间（s）
double get_current_time() {
    timeval tv;
    gettimeofday(&tv, nullptr);
    return tv.tv_sec + tv.tv_usec / 1e6;
}

// 通用测试函数
void test_sort_algorithm(vector<int>& original, void(*sort_func)(vector<int>&), const char* name, ofstream& fout) {
    vector<int> temp = original; // 复制数据
    const double start = get_current_time();
    sort_func(temp); //调用排序
    const double end = get_current_time();

    if (!is_sorted(temp)) {
        fout << "[ERROR] " << name << " failed!" << endl;
        exit(1);
    } //检测排序成功

    fout << name << ": \t" << (end - start) * 1000 << " ms\n";
}