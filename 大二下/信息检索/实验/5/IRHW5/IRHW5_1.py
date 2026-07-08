import heapq
import math
import jieba

mydict = [{}, {}, {}, {}, {}]
Title_str = []
word_count = []
Iuc = [{}, {}, {}, {}, {}]
X2 = [{}, {}, {}, {}, {}]
stop_word = ['，', '。', '？', '/', '：', '；', '·', '→', '《', '》', '（', '）', '、', ' '
             '年', '月', '日']
file_name_pre = ['d://docs//A_国际交流与合作部//', 'd://docs//B_教务部//',
                 'd://docs//C_人力资源部//', 'd://docs//D_图书馆//', 'd://docs//E_校医院//']


# 获取每个class的倒排索引
def get_doc_index(class_i):
    for Doc_ID in range(1, 101):
        file_name = file_name_pre[class_i] + "%03d" % Doc_ID + '.txt'
        with open(file_name, 'r', encoding='UTF-8') as f:
            line_count = 0
            for line in f.readlines():
                line_count += 1
                line = line.strip("\n")
                if line_count < 6:
                    continue
                if line_count == 6:
                    Title_str.append(line)
                # if line_count == 7:
                #     continue
                if '深大新闻网 ｜ 公文通' in line:
                    break

                line = line.strip()
                if not line:
                    continue

                for word in jieba.cut(line):
                    if word in stop_word:
                        continue
                    if word not in mydict[class_i]:
                        mydict[class_i][word] = []
                    if Doc_ID not in mydict[class_i][word]:
                        mydict[class_i][word].append(Doc_ID)

# 互信息特征计算
def calculate_A(word, class_i):
    N = 500
    N11 = len(mydict[class_i][word])
    N10 = 0
    for ind in range(0, 5):
        if ind != class_i:
            if word in mydict[ind]:
                N10 += len(mydict[ind][word])
    N01 = 100 - N11
    N00 = 400 - N10
    N1_ = N11 + N10
    N_1 = 100
    N0_ = N00 + N01
    N_0 = 400

    I = 0.0

    # 避免除以零错误
    if N11 > 0:
        term1 = ((N11 / N) * math.log2((N * N11) / (N1_ * N_1))) if N1_ * N_1 > 0 else 0
        I += term1

    if N01 > 0:
        term2 = ((N01 / N) * math.log2((N * N01) / (N0_ * N_1))) if N0_ * N_1 > 0 else 0
        I += term2

    if N10 > 0:
        term3 = ((N10 / N) * math.log2((N * N10) / (N1_ * N_0))) if N1_ * N_0 > 0 else 0
        I += term3

    if N00 > 0:
        term4 = ((N00 / N) * math.log2((N * N00) / (N0_ * N_0))) if N0_ * N_0 > 0 else 0
        I += term4

    I = round(I, 2)
    return I


# 取前10个特征信息
def get10(class_i, arr):
    heap = []
    for k in arr[class_i]:
        s = -arr[class_i][k]
        heapq.heappush(heap, (s, k))

    Top10 = []
    for ind in range(10):
        s, ind = heapq.heappop(heap)
        Top10.append((ind, -s))
        print(str(ind) + ' ' + str(-s))


# 卡方特征计算
def calculate_x(word, class_i):
    N = 500
    N11 = len(mydict[class_i][word])
    N10 = 0
    for ind in range(0, 5):
        if ind != class_i:
            if word in mydict[ind]:
                N10 += len(mydict[ind][word])
    N01 = 100 - N11
    N00 = 400 - N10
    N1_ = N11 + N10
    N_1 = 100
    N0_ = N00 + N01
    N_0 = 400

    x2 = 0.0
    x2 = (N*(N11*N00-N10*N01)*(N11*N00-N10*N01))/(N1_*N_1*N0_*N_0) if N1_*N_1*N0_*N_0 > 0 else 0
    x2 = round(x2, 2)
    return x2


for i in range(0, 5):
    get_doc_index(i)

# for i in range(0, 5):
#     for k in mydict[i]:
#         Iuc[i][k] = calculate_A(k, i)
#
# for i in range(0, 5):
#     get10(i, Iuc)
#     print("\n")

for i in range(0, 5):
    for k in mydict[i]:
        X2[i][k] = calculate_x(k, i)

for i in range(0, 5):
    get10(i, X2)
    print("\n")
