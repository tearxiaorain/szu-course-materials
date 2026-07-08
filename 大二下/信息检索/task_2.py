import os
import jieba
import numpy as np
from scipy.sparse import issparse
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
from collections import defaultdict

# 加载数据
def load_data(directory):
    texts = []
    labels = []
    for label in os.listdir(directory):  # 遍历目录下的所有类别文件夹
        label_dir = os.path.join(directory, label)  # 获取文件夹路径
        if os.path.isdir(label_dir):  # 如果是文件夹
            for filename in os.listdir(label_dir):  # 遍历文件夹中的所有文件
                file_path = os.path.join(label_dir, filename)
                with open(file_path, 'r', encoding='utf-8') as file:
                    content = file.read().strip()
                    if content:  # 确保文档内容非空
                        texts.append(content)   # 将文本存入texts列表中
                        labels.append(label)    # 将标签存入labels列表中
    return texts, labels

data_dir = './correct_docs'  # 根目录包含A、B、C、D、E文件夹
texts, labels = load_data(data_dir)

# 分词
def tokenize(texts):
    return [' '.join(jieba.cut(text)) for text in texts]  # 使用jieba对每个文本进行分词

tokenized_texts = tokenize(texts)

# 设置停用词列表（可以使用预定义的中文停用词表）
stop_words = ["的", "了", "和", "是", "我", "有", "在", "不", "就", "人", "都", "一", "一个","李昱坤","2023150252"]

# 向量化
vectorizer = CountVectorizer(stop_words=stop_words)
X = vectorizer.fit_transform(tokenized_texts)  # 将分词后的文本转换为词频向量
y = np.array(labels)

# 确保向量化结果非空
if X.shape[1] == 0:
    raise ValueError("向量化后的特征矩阵为空，可能所有的单词都被认为是停用词。")

# 获取特征名称
feature_names = vectorizer.get_feature_names_out()

# 计算互信息
def calculate_mutual_information(X, y):
    """
    根据公式计算每个特征与标签的互信息（多类别，二值特征）
    X: 二值化特征矩阵（0/1，表示词是否出现）
    y: 类别标签
    返回：(num_classes, num_features) 的互信息矩阵
    """
    X = X.toarray()  # 转为密集矩阵（0/1值）
    N_total = X.shape[0]  # 总文档数 N
    unique_labels = np.unique(y)
    num_classes = len(unique_labels)
    num_features = X.shape[1]
    mutual_info = np.zeros((num_classes, num_features))

    for c_idx, c in enumerate(unique_labels):
        mask_c = (y == c)  # 属于类别c的样本掩码
        mask_not_c = ~mask_c  # 不属于类别c的样本掩码

        for j in range(num_features):
            # 1. 计算4类文档计数
            N11 = np.sum(X[mask_c, j] >= 1)    # t出现，属于c
            N10 = np.sum(X[mask_not_c, j] >= 1) # t出现，不属于c
            N01 = np.sum(X[mask_c, j] == 0)    # t不出现，属于c
            N00 = np.sum(X[mask_not_c, j] == 0) # t不出现，不属于c

            # 2. 计算辅助变量（避免分母为0）
            N1 = N11 + N10
            N0 = N01 + N00
            Nc = N11 + N01
            Nnc = N10 + N00

            # 3. 逐项计算互信息（处理分母为0的情况）
            term1 = 0.0
            if N1 * Nc != 0 and N11 > 0:
                term1 = (N11 / N_total) * np.log2( (N_total * N11) / (N1 * Nc) )

            term2 = 0.0
            if N1 * Nnc != 0 and N10 > 0:
                term2 = (N10 / N_total) * np.log2( (N_total * N10) / (N1 * Nnc) )

            term3 = 0.0
            if N0 * Nc != 0 and N01 > 0:
                term3 = (N01 / N_total) * np.log2( (N_total * N01) / (N0 * Nc) )

            term4 = 0.0
            if N0 * Nnc != 0 and N00 > 0:
                term4 = (N00 / N_total) * np.log2( (N_total * N00) / (N0 * Nnc) )

            mutual_info[c_idx, j] = term1 + term2 + term3 + term4

    return mutual_info

# 计算卡方统计量
def calculate_chi2(X, y):
    """
    为每个类别单独计算特征与该类别的卡方统计量，返回多分类卡方矩阵

    参数:
    X: 特征矩阵 (可以是稀疏矩阵 csr_matrix 或密集矩阵 ndarray)
    y: 类别标签数组 (一维 ndarray)

    返回:
    chi2_matrix: (num_classes, num_features) 的二维数组，
                 chi2_matrix[c][f] 表示类别 c 与特征 f 的卡方统计量
    """
    # 处理稀疏矩阵
    if issparse(X):
        X = X.toarray()  # 转换为密集矩阵以便逐元素操作（小数据可用，大数据需优化）

    N, M = X.shape  # 样本数、特征数
    unique_labels = np.unique(y)
    num_classes = len(unique_labels)
    chi2_matrix = np.zeros((num_classes, M))  # 初始化结果矩阵

    # 遍历每个类别，构建二分类问题计算卡方
    for c_idx, label in enumerate(unique_labels):
        # 构建二分类标签：是否属于当前类别
        y_binary = np.where(y == label, 1, 0)

        # 遍历每个特征，计算卡方统计量
        for f_idx in range(M):
            # 提取当前特征的取值（二值化处理：>0 表示出现，0 表示不出现）
            feature_values = X[:, f_idx] > 0  # 转换为布尔数组

            # 计算四格表的四个值
            # A: 特征出现且属于当前类别的样本数
            A = np.sum(feature_values & (y_binary == 1))
            # B: 特征出现但不属于当前类别的样本数
            B = np.sum(feature_values & (y_binary == 0))
            # C: 特征不出现但属于当前类别的样本数
            C = np.sum((~feature_values) & (y_binary == 1))
            # D: 特征不出现且不属于当前类别的样本数
            D = np.sum((~feature_values) & (y_binary == 0))

            # 计算期望值（避免分母为0，添加极小值）
            total = A + B + C + D
            expected_A = (A + B) * (A + C) / (total + 1e-10)
            expected_B = (A + B) * (B + D) / (total + 1e-10)
            expected_C = (C + D) * (A + C) / (total + 1e-10)
            expected_D = (C + D) * (B + D) / (total + 1e-10)

            # 累加卡方值（避免除以0，分母加极小值）
            chi2_matrix[c_idx, f_idx] += (A - expected_A) ** 2 / (expected_A + 1e-10)
            chi2_matrix[c_idx, f_idx] += (B - expected_B) ** 2 / (expected_B + 1e-10)
            chi2_matrix[c_idx, f_idx] += (C - expected_C) ** 2 / (expected_C + 1e-10)
            chi2_matrix[c_idx, f_idx] += (D - expected_D) ** 2 / (expected_D + 1e-10)

    return chi2_matrix

# 获取特征选择结果
mi = calculate_mutual_information(X, y)
# 计算每个特征在所有类别中的平均重要性
mi_avg = np.mean(mi, axis=0)
# 选择全局Top60特征
mi_features = np.argsort(mi_avg)[-60:]

chi2_scores = calculate_chi2(X, y)  # 不再需要toarray()，函数内部已处理
# 计算每个特征在所有类别中的平均重要性
chi2_avg = np.mean(chi2_scores, axis=0)
# 选择全局Top60特征
chi2_features = np.argsort(chi2_avg)[-60:]

class NaiveBayesClassifier:
    def __init__(self):
        self.class_priors = {}  # 存储每个类别的先验概率
        self.feature_probs = defaultdict(dict)  # 使用 defaultdict 避免未初始化的键错误
        self.classes = []   # 存储所有类别的标签列表

    def fit(self, X, y):
        """
                训练朴素贝叶斯分类器
                X: 特征矩阵，形状为 [样本数, 特征数]
                y: 类别标签，形状为 [样本数]
        """
        # 获取所有唯一的类别标签
        self.classes = np.unique(y)
        # 获取样本数 N 和特征数 M
        N, M = X.shape
        # 遍历每个类别，计算先验概率和条件概率
        for c in self.classes:
            X_c = X[y == c]
            self.class_priors[c] = len(X_c) / len(y)    # 先验概率
            self.feature_probs[c] = (X_c.sum(axis=0) + 1) / (X_c.sum() + M) # 条件概率

    def predict(self, X):
        y_pred = []
        # 遍历每个样本
        for x in X:
            posteriors = [] # 计算该样本属于每个类别的后验概率
            for c in self.classes:
                prior = np.log(self.class_priors[c])     # 取先验概率的对数，避免数值下溢
                # 计算似然度：特征条件概率的对数之和
                # x 是特征向量，非零元素表示该特征出现
                likelihood = np.sum(np.log(self.feature_probs[c]) * x)
                # 后验概率 = 先验概率 + 似然度（对数空间下的乘法变加法）
                posterior = prior + likelihood
                posteriors.append(posterior)
            y_pred.append(self.classes[np.argmax(posteriors)])  # 将后验概率最大的类别作为预测结果
        return y_pred


######################task2
# 数据分割
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)
# 训练朴素贝叶斯分类器
nb = NaiveBayesClassifier()
nb.fit(X_train.toarray(), y_train)

# 测试并评估
y_pred = nb.predict(X_test.toarray())
print("不使用特征选择的分类报告:")
print(classification_report(y_test, y_pred))

# 使用互信息特征选择后的数据
X_train_mi = X_train[:, mi_features].toarray()
X_test_mi = X_test[:, mi_features].toarray()

nb_mi = NaiveBayesClassifier()
nb_mi.fit(X_train_mi, y_train)

y_pred_mi = nb_mi.predict(X_test_mi)
print("使用互信息特征选择的分类报告:")
print(classification_report(y_test, y_pred_mi))

# 使用卡方特征选择后的数据
X_train_chi2 = X_train[:, chi2_features].toarray()
X_test_chi2 = X_test[:, chi2_features].toarray()

nb_chi2 = NaiveBayesClassifier()
nb_chi2.fit(X_train_chi2, y_train)

y_pred_chi2 = nb_chi2.predict(X_test_chi2)
print("使用卡方特征选择的分类报告:")
print(classification_report(y_test, y_pred_chi2))

# # 获取特征选择结果
# mi = calculate_mutual_information(X, y)
# mi_features = np.argsort(mi)[-60:]
#
# chi2_scores = calculate_chi2(X.toarray(), y)
# chi2_features = np.argsort(chi2_scores)[-60:]
#
# class NaiveBayesClassifier:
#     def __init__(self):
#         self.class_priors = {}  # 存储每个类别的先验概率
#         self.feature_probs = defaultdict(dict)  # 使用 defaultdict 避免未初始化的键错误
#         self.classes = []   # 存储所有类别的标签列表
#
#     def fit(self, X, y):
#         """
#                 训练朴素贝叶斯分类器
#                 X: 特征矩阵，形状为 [样本数, 特征数]
#                 y: 类别标签，形状为 [样本数]
#         """
#         # 获取所有唯一的类别标签
#         self.classes = np.unique(y)
#         # 获取样本数 N 和特征数 M
#         N, M = X.shape
#         # 遍历每个类别，计算先验概率和条件概率
#         for c in self.classes:
#             X_c = X[y == c]
#             self.class_priors[c] = len(X_c) / len(y)    # 先验概率
#             self.feature_probs[c] = (X_c.sum(axis=0) + 1) / (X_c.sum() + M) # 条件概率
#
#     def predict(self, X):
#         y_pred = []
#         # 遍历每个样本
#         for x in X:
#             posteriors = [] # 计算该样本属于每个类别的后验概率
#             for c in self.classes:
#                 prior = np.log(self.class_priors[c])     # 取先验概率的对数，避免数值下溢
#                 # 计算似然度：特征条件概率的对数之和
#                 # x 是特征向量，非零元素表示该特征出现
#                 likelihood = np.sum(np.log(self.feature_probs[c]) * x)
#                 # 后验概率 = 先验概率 + 似然度（对数空间下的乘法变加法）
#                 posterior = prior + likelihood
#                 posteriors.append(posterior)
#             y_pred.append(self.classes[np.argmax(posteriors)])  # 将后验概率最大的类别作为预测结果
#         return y_pred
#
#
# ######################task2
# # 数据分割
# X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)
# # 训练朴素贝叶斯分类器
# nb = NaiveBayesClassifier()
# nb.fit(X_train.toarray(), y_train)
#
# # 测试并评估
# y_pred = nb.predict(X_test.toarray())
# print("不使用特征选择的分类报告:")
# print(classification_report(y_test, y_pred))
#
# # 使用互信息特征选择后的数据
# X_train_mi = X_train[:, mi_features].toarray()
# X_test_mi = X_test[:, mi_features].toarray()
#
# nb_mi = NaiveBayesClassifier()
# nb_mi.fit(X_train_mi, y_train)
#
# y_pred_mi = nb_mi.predict(X_test_mi)
# print("使用互信息特征选择的分类报告:")
# print(classification_report(y_test, y_pred_mi))
#
# # 使用卡方特征选择后的数据
# X_train_chi2 = X_train[:, chi2_features].toarray()
# X_test_chi2 = X_test[:, chi2_features].toarray()
#
# nb_chi2 = NaiveBayesClassifier()
# nb_chi2.fit(X_train_chi2, y_train)
#
# y_pred_chi2 = nb_chi2.predict(X_test_chi2)
# print("使用卡方特征选择的分类报告:")
# print(classification_report(y_test, y_pred_chi2))
