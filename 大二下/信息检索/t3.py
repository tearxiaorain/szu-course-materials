import os
import random
import requests
import json
from collections import Counter

# DeepSeek API配置
DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions"
MAX_TOKENS = 4096


class DocumentClassifier:
    def __init__(self, api_key, data_dir):
        """
        初始化文档分类器
        参数:
            api_key: DeepSeek API密钥
            data_dir: 包含分类文档的目录路径
        """
        self.api_key = api_key
        self.data_dir = data_dir
        self.categories = ['A', 'B', 'C', 'D', 'E']

        # 存储训练和测试数据
        self.train_data = {category: [] for category in self.categories}
        self.test_data = {category: [] for category in self.categories}

    def load_and_split_data(self):
        """
        加载文档数据并按80-20比例分割训练集和测试集
        """
        for category in self.categories:
            category_dir = os.path.join(self.data_dir, category)
            files = [f for f in os.listdir(category_dir) if f.endswith('.txt')]

            # 随机打乱文件顺序
            random.shuffle(files)

            # 分割训练集(80)和测试集(20)
            split_point = int(len(files) * 0.8)
            train_files = files[:split_point]
            test_files = files[split_point:]

            # 读取训练文档内容
            for file in train_files:
                with open(os.path.join(category_dir, file), 'r', encoding='utf-8') as f:
                    content = f.read()
                    self.train_data[category].append(content)

            # 读取测试文档内容
            for file in test_files:
                with open(os.path.join(category_dir, file), 'r', encoding='utf-8') as f:
                    content = f.read()
                    self.test_data[category].append(content)

        print("数据加载和分割完成。")
        print(f"训练集: 每个类别{len(train_files)}篇文档")
        print(f"测试集: 每个类别{len(test_files)}篇文档")

    def train_with_prompt(self):
        """
        使用prompt工程"训练"模型
        实际上是构建分类提示模板
        """
        # 构建few-shot learning的prompt示例
        self.few_shot_examples = []

        # 从每个类别中选取3个示例
        for category in self.categories:
            examples = random.sample(self.train_data[category], min(3, len(self.train_data[category])))
            for example in examples:
                self.few_shot_examples.append({
                    'content': example,
                    'category': category
                })

        print("已构建few-shot learning提示模板。")

    def classify_document(self, document_content):
        """
        使用DeepSeek API分类单个文档
        参数:
            document_content: 待分类的文档内容
        返回:
            预测的类别(A/B/C/D/E)
        """
        # 构建prompt
        prompt = """你是一个文档分类系统，需要判断公文通知属于哪个部门(A/B/C/D/E)。以下是示例：

"""

        # 添加few-shot示例
        for example in self.few_shot_examples:
            prompt += f"示例文档:\n{example['content'][:500]}...\n"  # Limit example length
            prompt += f"所属部门: {example['category']}\n\n"

        # 添加待分类文档
        prompt += f"请分类以下文档:\n{document_content[:1000]}\n"  # Limit document length
        prompt += "所属部门: "

        # Prepare the API request
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": "deepseek-chat",
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "max_tokens": 1,
            "temperature": 0.3
        }

        try:
            response = requests.post(DEEPSEEK_API_URL, headers=headers, json=payload)
            response.raise_for_status()
            result = response.json()

            # Extract the predicted category
            predicted_category = result['choices'][0]['message']['content'].strip().upper()

            # Extract just the category letter (A-E)
            predicted_letter = predicted_category[0] if predicted_category else 'A'
            predicted_category = f"{predicted_letter}_" + {
                'A': '国际交流与合作部',
                'B': '教务部',
                'C': '人力资源部',
                'D': '图书馆',
                'E': '校医院'
            }.get(predicted_letter, '国际交流与合作部')

            if predicted_category not in self.categories:
                predicted_category = random.choice(self.categories)

            return predicted_category

        except Exception as e:
            print(f"API请求失败: {e}")
            return random.choice(self.categories)

    def evaluate(self):
        """
        评估分类器在测试集上的性能
        """
        total = 0
        correct = 0
        confusion_matrix = {c: {c2: 0 for c2 in self.categories} for c in self.categories}

        for true_category in self.categories:
            for doc_content in self.test_data[true_category]:
                pred_category = self.classify_document(doc_content)
                confusion_matrix[true_category][pred_category] += 1

                if pred_category == true_category:
                    correct += 1
                total += 1

        # 打印评估结果
        accuracy = correct / total
        print("\n评估结果:")
        print(f"准确率: {accuracy:.2%}")
        print("\n混淆矩阵:")
        print("真实\\预测\t" + "\t".join(self.categories))
        for true_cat in self.categories:
            row = [str(confusion_matrix[true_cat][pred_cat]) for pred_cat in self.categories]
            print(f"{true_cat}\t\t" + "\t".join(row))

        return accuracy, confusion_matrix


# 主程序
if __name__ == "__main__":
    # 配置
    API_KEY = "sk-6bb1b99450284b70b2444c89eb77ace4"  # API密钥
    DATA_DIR = "D:\\信息检索 实验报告\\实验五\\data1"  # 文档数据目录

    # 初始化分类器
    classifier = DocumentClassifier(API_KEY, DATA_DIR)

    # 加载和分割数据
    classifier.load_and_split_data()

    # "训练"模型(构建prompt)
    classifier.train_with_prompt()

    # 评估模型
    accuracy, cm = classifier.evaluate()