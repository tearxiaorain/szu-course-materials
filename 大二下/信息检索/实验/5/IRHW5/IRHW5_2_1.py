import heapq
import math
import jieba

mydict = [{}, {}, {}, {}, {}]
Title_str = []
word_count = []
Iuc = [{}, {}, {}, {}, {}]
X2 = [{}, {}, {}, {}, {}]
prior = [0.2, 0.2, 0.2, 0.2, 0.2]
V = []
V_L = []

Text_c = []
condprob = {}
stop_word = ['，', '。', '？', '/', '：', '；', '·', '→', '《', '》', '（', '）', '、', ' ',
             '年', '月', '日'] # , "的", "了", "和", "是"
file_name_pre = ['d://docs//A_国际交流与合作部//', 'd://docs//B_教务部//',
                 'd://docs//C_人力资源部//', 'd://docs//D_图书馆//', 'd://docs//E_校医院//']
doc_class = ['国际交流与合作部', '教务部', '人力资源部', '图书馆', '校医院']


# 获取每个class的倒排索引
def get_doc_index(class_i):
    Text_c.append('')
    for Doc_ID in range(1, 81):
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

                Text_c[class_i] += line
                for word in jieba.cut(line):
                    if word in stop_word:
                        continue
                    if word not in mydict[class_i]:
                        mydict[class_i][word] = []
                    if Doc_ID not in mydict[class_i][word]:
                        mydict[class_i][word].append(Doc_ID)
                    if word not in V:
                        V.append(word)


def get10(class_i, arr):
    heap = []
    for k in arr[class_i]:
        s = -arr[class_i][k]
        heapq.heappush(heap, (s, k))

    Top10 = []
    for ind in range(10):
        s, ind = heapq.heappop(heap)
        Top10.append((ind, -s))
        V_L.append(ind)
        print(str(ind) + ' ' + str(-s))


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


def Train(class_i):
    Tct = 0
    Tct_ = 0

    for t_ in V_L:
        Tct_ += Text_c[class_i].count(t_)
        Tct_ += 1

    for t in V_L:
        Tct = Text_c[class_i].count(t)
        Tct += 1
        if t not in condprob:
            condprob[t] = [{0: []},{1:[]},{2:[]},{3:[]},{4:[]}]
        condprob[t][class_i] = (Tct / Tct_)


def Apply(class_i, predict):
    for Doc_ID in range(81, 101):
        file_name = file_name_pre[class_i] + "%03d" % Doc_ID + '.txt'
        V_ = []
        with open(file_name, 'r', encoding='UTF-8') as f:
            line_count = 0
            for line in f.readlines():
                line_count += 1
                line = line.strip("\n")
                if line_count < 6:
                    continue

                if '深大新闻网 ｜ 公文通' in line:
                    break

                line = line.strip()
                if not line:
                    continue

                for word in jieba.cut(line):
                    if word in stop_word:
                        continue
                    if word in V_L:
                        if word not in V_:
                            V_.append(word)
        score = [math.log10(prior[0]), math.log10(prior[0]),
                 math.log10(prior[0]), math.log10(prior[0]), math.log10(prior[0])]
        for c_i in range(0, 5):
            for w in V_:
                score[c_i] += condprob[w][c_i]
        max = score[0]
        ind = 0
        for c_i in range(0, 5):
            if score[c_i] > max:
                max = score[c_i]
                ind = c_i
        predict.append(ind)


for i in range(0, 5):
    get_doc_index(i)

for i in range(0, 5):
    for k in mydict[i]:
        X2[i][k] = calculate_x(k, i)

for i in range(0, 5):
    get10(i, X2)
    print("\n")

predict = []
for i in range(0, 5):
    Train(i)

for i in range(0, 5):
    Apply(i, predict)

for i in range(0, 5):
    for j in range(0, 20):
        k = i*20 + j
        print(f'{doc_class[i]}中的{80+j}文档被识别为{doc_class[predict[k]]}类')

TP = [0, 0, 0, 0, 0]
FN = [0, 0, 0, 0, 0]
FP = [0, 0, 0, 0, 0]
TN = [0, 0, 0, 0, 0]

for i in range(0, 100):
    if int(i/20) == predict[i]:
        TP[int(i/20)] += 1
    else:
        FN[int(i/20)] += 1
        FP[predict[i]] += 1

for i in range(0, 5):
    TN[i] = 100 - TP[i] - FN[i] - FP[i]

print('正确率    精确率    召回率    F1值')
for i in range(0, 5):
    A = (TP[i] + TN[i]) / (TP[i] + TN[i] + FP[i] + FN[i])
    P = (TP[i]) / (TP[i] + FP[i])
    R = (TP[i]) / (TP[i] + FN[i])
    F = 2 * (P * R) / (P + R)
    A = round(A, 2)
    P = round(P, 2)
    R = round(R, 2)
    F = round(F, 2)

    print(("%.2f     %.2f     %.2f     %.2f       %s" % (A, P, R, F, doc_class[i])))