mydict = dict()
token = 0
term = 0
DocID = 1

with open('d://HW1.txt', 'r') as f:
    for line in f.readlines():
        line = line.strip()
        if not line:
            continue
        for word in line.split():
            token += 1
            if word in mydict:
                mydict[word].append(DocID)
            else:
                term += 1
                mydict[word] = [DocID]
        DocID += 1

print('token ', token)
print('term ', term)

mydict0 = dict()
token = 0
term = 0
DocID = 1

with open('d://test2.txt', 'r', encoding='utf-8') as f:
    for line in f.readlines():
        line = line.strip()
        if not line:
            continue
        for word in line.split():
            token += 1
            if word in mydict0:
                mydict0[word].append(DocID)
            else:
                term += 1
                mydict0[word] = [DocID]
        DocID += 1

print('token ', token)
print('term ', term)


