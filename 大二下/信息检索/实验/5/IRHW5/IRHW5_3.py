from openai import OpenAI
import openai

file_name_pre = ['d://docs//A_国际交流与合作部//', 'd://docs//B_教务部//',
                 'd://docs//C_人力资源部//', 'd://docs//D_图书馆//', 'd://docs//E_校医院//']
doc_class = ['国际交流与合作部', '教务部', '人力资源部', '图书馆', '校医院']
Title = []
Test_title = []
Doc = []
test = []


def create_prompt_learn(ind, class_i):
    prompt = f"""
你正在学习分析类别为{doc_class[class_i]}的文档,学习过程中不用回答，这是第{ind}篇
文档内容如下：
"""
    prompt += '标题： ' + Title[ind] + '正文：'
    for t in Doc[ind]:
        prompt += t

    prompt += f"""
以上是这篇文档的全部内容，当你理解学习识别后，只需要回答：
‘已学习的哪个类别的第几篇文档，标题是什么’
不需要回答多余的内容    
"""
    return prompt


def create_prompt_test(ind):
    prompt = f"""
经过学习后，请你分析下面的文档是哪个类别的文档。
可能是：国际交流与合作部，教务部，人力资源部，图书馆，校医院
文档内容如下：
"""
    prompt += '标题： ' + Test_title[ind] + '正文：'
    for t in test[ind]:
        prompt += t

    prompt += f"""
以上是这篇文档的全部内容，请你根据你所学习训练的文档内容，挑出你觉得最有可能的类别，给出简短的依据    
"""
    return prompt


def useai(prompt):
    client = OpenAI(api_key="", base_url="https://api.deepseek.com/v1")

    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=[
            {"role": "system", "content": "你是一个信息检索领域专家，你的工作就是对用户所给的文档进行分类"},
            {"role": "user", "content": prompt},
        ],
        stream=False
    )

    print(response.choices[0].message.content)


for class_i in range(5):
    for Test_ID in range(81, 101):
        file_name = file_name_pre[class_i] + "%03d" % Test_ID + '.txt'
        with open(file_name, 'r', encoding='UTF-8') as f:
            line_count = 0
            for line in f.readlines():
                line_count += 1
                if line_count < 6:
                    continue
                if line_count == 6:
                    Test_title.append(line)
                    test.append([])

                test[class_i * 20 + Test_ID - 81].append(line)

                if '深大新闻网 ｜ 公文通' in line:
                    break

for class_i in range(5):
    for Doc_ID in range(1, 81):
        file_name = file_name_pre[class_i] + "%03d" % Doc_ID + '.txt'
        with open(file_name, 'r', encoding='UTF-8') as f:
            line_count = 0
            for line in f.readlines():
                line_count += 1
                if line_count < 6:
                    continue
                if line_count == 6:
                    Title.append(line)
                    Doc.append([])

                Doc[class_i * 80 + Doc_ID - 1].append(line)

                if '深大新闻网 ｜ 公文通' in line:
                    break
        useai(create_prompt_learn(class_i * 80 + Doc_ID - 1, class_i))


for i in range(0, 100):
    useai(create_prompt_test(i))
