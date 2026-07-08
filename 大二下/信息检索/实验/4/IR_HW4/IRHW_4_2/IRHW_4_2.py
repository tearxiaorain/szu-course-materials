import heapq
import math
import jieba

mydict = dict()
DocID = 0
Lenth = []
Docstr = []
Score = []

#读取文件
with open('d://HW4_2.txt', 'r') as f:
    for line in f.readlines():
        DocID += 1
        line = line.strip()
        if not line:
            continue
        Docstr.append(line)

        word_count = {}
        for word in jieba.cut(line):
            word_count[word] = word_count.get(word, 0) + 1

        for word, count in word_count.items():
            if word not in mydict:
                mydict[word] = {}
            mydict[word][DocID] = count

N = DocID
Lenth = [0.0] * (N + 1)
Score = [[0.0 for _ in range(N + 1)] for _ in range(N + 1)]

doc_id_i = 0
#以每个文档作为查询向量
for docI in Docstr:
    doc_id_i += 1
    Score[doc_id_i] = [0] * (N + 1)

    l = 0.0
    for word in jieba.cut(docI):
        df = len(mydict[word])
        idf = math.log(N / df)  #idf计算公式

        tfI = 0
        for index, f in mydict[word].items():
            if index == doc_id_i:
                tfI = f
                break
        wtfI = 0
        if tfI > 0:
            wtfI = math.log10(tfI) + 1  #wtf计算公式
        l += (wtfI * idf) * (wtfI * idf)

        doc_id_j = 0
        #计算每个term对每个文档的分数贡献
        for docJ in Docstr:
            doc_id_j += 1
            tfJ = 0
            for index, f in mydict[word].items():
                if index == doc_id_j:
                    tfJ = f
                    break
            wtfJ = 0
            if tfJ > 0:
                wtfJ = math.log10(tfJ) + 1  #wtf计算公式

            Score[doc_id_i][doc_id_j] += (wtfI * idf) * (wtfJ * idf)

    Lenth[doc_id_i] = math.sqrt(l)

for i in range(1, len(Score)):
    for j in range(1, len(Score[i])):
        if Lenth[i] * Lenth[j] != 0:
            Score[i][j] /= (Lenth[i] * Lenth[j])  #cos计算公式
            Score[i][j] = round(Score[i][j], 2)
        else:
            Score[i][j] = -1
        print(f"{i}与{j}的相似度为{Score[i][j]:.2f}")

for i in range(1, 11):
    heap = []
    for j in range(1, len(Score)):
        if i == j:
            continue
        s = -Score[i][j]
        heapq.heappush(heap, (s, j))

    Top5 = []
    for j in range(5):
        s, ind = heapq.heappop(heap)
        Top5.append((ind, -s))

    print(f"与{i}号文档“{Docstr[i - 1]}”最相近的5个文档为: ")
    for ind, s in Top5:
        print(f"{ind}: {s:.2f}  “{Docstr[ind - 1]}”")
    print(f"\n")
