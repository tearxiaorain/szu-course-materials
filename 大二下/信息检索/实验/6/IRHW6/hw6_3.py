import math


def get_ggt(g, gt):
    ans = [
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
    ]
    for i in range(9):
        for j in range(9):
            ans[i][j] += g[i][j] * gt[j][i]

    return ans


def power_iteration(m0, A):
    mar = [0, 0, 0, 0, 0, 0, 0, 0, 0]
    for i in range(9):
        for j in range(9):
            mar[i] += m0[j] * A[i][j]

    return mar


def to1(mar0):
    squ = 0
    sum = 0
    for i in range(9):
        squ += mar0[i] * mar0[i]
        sum += mar0[i]

    for i in range(9):
        #mar0[i] /= math.sqrt(squ)
        mar0[i] /= sum
        mar0[i] = round(mar0[i], 4)
    return



graph = [
    [0, 0, 0, 0, 0, 1, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 0, 0, 0, 0, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 1],
    [0, 1, 1, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 0, 0, 0, 0, 0, 1, 0, 0]
]
graph_t = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
]

for i in range(9):
    for j in range(9):
        graph_t[i][j] = graph[j][i]


h0 = [1, 1, 1, 1, 1, 1, 1, 1, 1]
a0 = [1, 1, 1, 1, 1, 1, 1, 1, 1]

for i in range(100):
    h = h0
    a = a0
    h0 = power_iteration(a, graph)
    a0 = power_iteration(h0, graph_t)
    to1(h0)
    to1(a0)


# print(AAt)
# print(AtA)
print("hub:")
print(h0)
print("autority:")
print(a0)


# squ = 0
# for i in range(9):
#     squ += mar0[i] * mar0[i]

# for i in range(9):
#     mar0[i] /= math.sqrt(squ)
#
# print(mar0)
