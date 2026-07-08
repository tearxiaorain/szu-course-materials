import jieba


def check(d, s):
    print(s)
    if s in d:
        print(d[s])
    else:
        print('null')


jieba.add_word('人工智能')
jieba.add_word('深度学习')
jieba.add_word('大模型')
mydict = dict()
token = 0
term = 0
DocID = 1

with open('d://HW3.txt', 'r') as f:
    for line in f.readlines():
        line = line.strip()
        if not line:
            continue
        for word in jieba.cut(line):
            token += 1
            if word in mydict:
                mydict[word].append(DocID)
            else:
                term += 1
                mydict[word] = [DocID]
        DocID += 1

print('token ', token)
print('term ', term)
check(mydict, '大模型')
check(mydict, '深度学习')
check(mydict, '人工智能')
check(mydict, '芯片')
check(mydict, '开源')
check(mydict, '岗位')
check(mydict, '人才')

check(mydict, 'AI')



