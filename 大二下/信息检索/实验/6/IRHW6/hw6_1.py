def power_iteration(mar0, tran):
    mar = [0, 0, 0, 0, 0]
    for i in range(5):
        for j in range(5):
            mar[i] += mar0[j] * tran[j][i]

    return mar


graph = [[0, 0, 1, 1, 1],
         [0, 0, 1, 1, 1],
         [0, 0, 0, 1, 1],
         [0, 0, 1, 0, 1],
         [0, 0, 1, 1, 0]]
g_to = [3, 3, 2, 2, 2]

tranMat = [[0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0]]

a = 0.1

for i in range(5):
    for j in range(5):
        tranMat[i][j] += a * 0.2
        if graph[i][j] == 1:
            tranMat[i][j] += (1 - a) * (1 / g_to[i])
        tranMat[i][j] = round(tranMat[i][j], 2)

print(tranMat)
mar0 = [1, 0, 0, 0, 0]

for i in range(100):
    mar = mar0
    mar0 = power_iteration(mar, tranMat)

print(mar0)