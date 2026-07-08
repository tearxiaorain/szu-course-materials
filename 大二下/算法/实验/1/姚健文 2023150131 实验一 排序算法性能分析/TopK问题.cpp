#include <iostream>
#include <fstream>
#include <vector>
#include <cstdlib>
#include <sys/time.h>
#include <ctime>
#include <algorithm>
#include <queue>
#include <functional> // for greater<int>

using namespace std;

// 算法声明：找前K大的元素（不完整排序）
void selection_topk(vector<int>& arr, int k);
void heap_select_topk(vector<int>& arr, int k);
void quick_select_topk(vector<int>& arr, int k);

// 辅助函数
void generate_random_array(vector<int>& arr);
bool is_sorted(const vector<int>& arr);
bool is_topk_valid(const vector<int>& arr, const vector<int>& original, int k); // 验证前K大元素是否正确
double get_current_time();
void test_topk_algorithm(vector<int>& original, void(*topk_func)(vector<int>&, int), const char* name, ofstream& fout, int k);

// 全局配置
const int K = 10;              // 找前10个最大元素
const int TOTAL_SAMPLES = 20;  // 测试20个样本
const int N = 1000000;      // 数据规模10亿（实际运行时调小测试）

int main() {
    ofstream fout("topk_results.txt");
    if (!fout) {
        cerr << "无法打开输出文件！" << endl;
        return 1;
    }
    srand(time(nullptr));

    // 测试20个样本（每个样本规模为N）
    for (int sample = 1; sample <= TOTAL_SAMPLES; ++sample) {
        cout<<N<<endl;
        cout << "正在生成样本 " << sample << "/" << TOTAL_SAMPLES << " ..." << endl;
        vector<int> original_arr(N);
        generate_random_array(original_arr);

        fout << "\n样本 " << sample << " (n=" << N << "):" << endl;

        // 测试各算法
        test_topk_algorithm(original_arr, selection_topk, "选择排序TopK", fout, K);
        test_topk_algorithm(original_arr, heap_select_topk, "堆选择TopK", fout, K);
        test_topk_algorithm(original_arr, quick_select_topk, "快速选择TopK", fout, K);

        cout << "样本 " << sample << " 测试完成" << endl;
    }

    fout.close();
    return 0;
}

// 选择算法实现

// 基于选择排序的TopK（部分排序）
void selection_topk(vector<int>& arr, int k) {
    const int n = arr.size();
    for (int i = 0; i < k; ++i) {
        int max_idx = i;
        for (int j = i + 1; j < n; ++j) {
            if (arr[j] > arr[max_idx]) {
                max_idx = j;
            }
        }
        swap(arr[i], arr[max_idx]);
    }
    // 前k个元素是最大的k个，且已按降序排列
}

// 基于堆的TopK（最小堆筛选）
void heap_select_topk(vector<int>& arr, int k) {
    priority_queue<int, vector<int>, greater<int>> min_heap; // 最小堆
    for (int num : arr) {
        if (min_heap.size() < k) {
            min_heap.push(num);
        } else if (num > min_heap.top()) {
            min_heap.pop();
            min_heap.push(num);
        }
    }
    // 将堆中元素按降序放入数组前k个位置
    int i = 0;
    while (!min_heap.empty()) {
        arr[i++] = min_heap.top();
        min_heap.pop();
    }
    reverse(arr.begin(), arr.begin() + k);
}

// 快速选择实现
int partition(vector<int>& arr, int left, int right) {
    int pivot_idx = left + rand() % (right - left + 1);
    swap(arr[pivot_idx], arr[right]);
    int pivot = arr[right];
    int i = left;
    for (int j = left; j < right; ++j) {
        if (arr[j] >= pivot) { // 降序分区
            swap(arr[i], arr[j]);
            i++;
        }
    }
    swap(arr[i], arr[right]);
    return i;
}

int quick_select(vector<int>& arr, int left, int right, int k) {
    if (left >= right) return left;
    int pos = partition(arr, left, right);
    int current_rank = pos - left + 1;
    if (current_rank == k) {
        return pos;
    } else if (current_rank > k) {
        return quick_select(arr, left, pos - 1, k);
    } else {
        return quick_select(arr, pos + 1, right, k - current_rank);
    }
}

void quick_select_topk(vector<int>& arr, int k) {
    const int n = arr.size();
    quick_select(arr, 0, n - 1, k);
    // 前k个元素是最大的，但未排序，需对前k个排序
    sort(arr.begin(), arr.begin() + k, greater<int>());
}

// 辅助函数

// 生成随机数组（实际运行时需调小N）
void generate_random_array(vector<int>& arr) {
    for (auto& num : arr) {
        num = rand() % (arr.size() * 10); // 数值范围设为 [0, 10n)
    }
}

// 验证前K个元素是否正确
bool is_topk_valid(const vector<int>& arr, const vector<int>& original, int k) {
    vector<int> copy(original);
    sort(copy.begin(), copy.end(), greater<int>());
    for (int i = 0; i < k; ++i) {
        if (arr[i] != copy[i]) {
            return false;
        }
    }
    return true;
}

// 时间获取函数
double get_current_time() {
    timeval tv;
    gettimeofday(&tv, nullptr);
    return tv.tv_sec + tv.tv_usec / 1e6;
}

// 测试TopK算法
void test_topk_algorithm(vector<int>& original, void(*topk_func)(vector<int>&, int), const char* name, ofstream& fout, int k) {
    vector<int> temp = original;
    double start = get_current_time();
    topk_func(temp, k);  // 调用TopK算法
    double end = get_current_time();

    // 验证结果
    if (!is_topk_valid(temp, original, k)) {
        fout << "[ERROR] " << name << " 验证失败！" << endl;
        exit(1);
    }

    fout << name << ": \t" << (end - start) * 1000 << " ms" << endl;
}
