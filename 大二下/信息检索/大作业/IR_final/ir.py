import heapq
import math
import jieba
import os
import tkinter as tk
from tkinter import ttk, scrolledtext, messagebox, font
import threading
import subprocess
import platform
from openai import OpenAI
import re  # 添加正则表达式模块
import time  # 添加时间模块


def create_prompt_sub(str):
    prompt = f"""
你需要对我提供的字符串进行分词，在分词结束后输出分词的结果，用空格分隔，此外不需要回答其他内容
内容如下：
"""
    prompt += str
    prompt += f"""
以上是全部内容，告诉我分词的结果，用空格分隔，不需要回答多余的内容    
"""
    return prompt


def useai_to_sp(prompt):
    client = OpenAI(api_key="sk-a1e05b25220446f19daeca25c1f689e5", base_url="https://api.deepseek.com/v1")

    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=[
            {"role": "system", "content": "你是一个信息检索领域专家，你的工作就是对用户所给的文档进行分词"},
            {"role": "user", "content": prompt},
        ],
        stream=False
    )

    print(response.choices[0].message.content)
    return response.choices[0].message.content.split()


def useai_to_sum(prompt):
    client = OpenAI(api_key="sk-a1e05b25220446f19daeca25c1f689e5", base_url="https://api.deepseek.com/v1")

    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=[
            {"role": "system", "content": "你是一个信息检索领域专家，你现在需要对用户所给的文档进行总结"},
            {"role": "user", "content": prompt},
        ],
        stream=False
    )

    print(response.choices[0].message.content)
    return response.choices[0].message.content


class DocumentSearchApp:
    def __init__(self, root):
        self.root = root
        self.root.title("文档检索系统")
        self.root.geometry("1300x800")  # 增加窗口宽度以容纳新区域
        self.root.configure(bg="#f0f8ff")

        # 初始化变量
        self.stop_word = \
            ['，', '。', '？', '/', '：', '；', '·', '→', '《', '》', '（', '）', '、', ' ',
             '年', '月', '日', "的", "了", "和", "是", "得", "与", "跟"]
        self.doc_dict = {}  # 正文倒排索引
        self.title_dict = {}  # 标题倒排索引
        self.author_dict = {}  # 主讲人倒排索引
        self.inviter_dict = {}  # 邀请人倒排索引
        self.Docstr = []  # 文档内容
        self.Title_list = []  # 文档标题
        self.author_list = []  # 讲座演讲者
        self.aubrief_list = []  # 演讲者简介
        self.conbrief_list = []  # 演讲者简介
        self.inviter_list = []  # 讲座邀请人
        self.doc_id_map = {}
        self.doc_folder_map = {}  # 文档ID到文件夹路径的映射
        self.doc_lengths = [0.0]
        self.N = 0
        self.search_domain = "content"  # 默认搜索域：正文
        self.summary_text = ""  # 存储大模型生成的总结

        # 创建界面
        self.create_widgets()

        # 在后台加载数据
        self.loading_label = ttk.Label(self.root, text="正在加载文档和构建索引...", font=("微软雅黑", 12))
        self.loading_label.pack(pady=20)
        self.progress = ttk.Progressbar(self.root, mode='indeterminate')
        self.progress.pack(pady=10)
        self.progress.start()

        # 启动后台线程加载数据
        threading.Thread(target=self.initialize_system, daemon=True).start()

    def create_widgets(self):
        # 创建顶部标题框架
        header_frame = ttk.Frame(self.root)
        header_frame.pack(fill="x", padx=20, pady=10)

        # 标题
        title_label = ttk.Label(header_frame, text="文档检索系统", font=("微软雅黑", 24, "bold"),
                                foreground="#2c3e50", background="#f0f8ff")
        title_label.pack(side="left", padx=10)

        # 搜索框和域选择
        search_frame = ttk.Frame(self.root)
        search_frame.pack(fill="x", padx=20, pady=10)

        ttk.Label(search_frame, text="搜索内容:", font=("微软雅黑", 12)).pack(side="left", padx=5)

        self.search_entry = ttk.Entry(search_frame, width=60, font=("微软雅黑", 12))
        self.search_entry.pack(side="left", padx=5, fill="x", expand=True)
        self.search_entry.bind("<Return>", self.perform_search)

        # 域选择下拉框
        domain_frame = ttk.Frame(search_frame)
        domain_frame.pack(side="left", padx=5)

        ttk.Label(domain_frame, text="搜索域:", font=("微软雅黑", 10)).pack(side="left")
        self.domain_var = tk.StringVar(value="正文")
        domain_combo = ttk.Combobox(domain_frame, textvariable=self.domain_var,
                                    values=["正文", "标题", "主讲人", "邀请人"],
                                    state="readonly", width=8, font=("微软雅黑", 10))
        domain_combo.pack(side="left", padx=5)
        domain_combo.bind("<<ComboboxSelected>>", self.on_domain_change)

        # 搜索按钮
        search_btn = tk.Button(search_frame, text="搜 索", command=self.perform_search,
                               bg="#3498db", fg="white", font=("微软雅黑", 11, "bold"),
                               relief="flat", padx=15, cursor="hand2")
        search_btn.pack(side="left", padx=5)

        # 示例搜索词
        example_frame = ttk.Frame(self.root)
        example_frame.pack(fill="x", padx=20, pady=5)

        ttk.Label(example_frame, text="示例:", font=("微软雅黑", 10)).pack(side="left", padx=5)

        examples = ["信息", "举办", "知识", "学术", "生命", "大学", "联邦", "辅助", "原型", "计算"]
        for ex in examples:
            btn = ttk.Button(example_frame, text=ex, width=6,
                             command=lambda e=ex: self.search_entry.insert(tk.END, e))
            btn.pack(side="left", padx=2)

        # 主内容框架 - 使用PanedWindow实现可调整大小的分割
        main_paned = tk.PanedWindow(self.root, orient=tk.HORIZONTAL, sashrelief=tk.RAISED, sashwidth=4)
        main_paned.pack(fill="both", expand=True, padx=10, pady=10)

        # 左侧框架 - 包含搜索结果的表格和文档详情
        left_frame = ttk.Frame(main_paned)
        main_paned.add(left_frame, width=800)  # 设置初始宽度

        # 右侧框架 - 用于显示大模型总结
        right_frame = ttk.Frame(main_paned)
        main_paned.add(right_frame, width=400)  # 设置初始宽度

        # 左侧内容 - 结果框架
        result_frame = ttk.LabelFrame(left_frame, text="搜索结果", padding=10)
        result_frame.pack(fill="both", expand=True, padx=5, pady=5)
        result_frame.columnconfigure(0, weight=1)
        result_frame.rowconfigure(0, weight=1)

        # 结果表格
        columns = ("id", "score", "title")
        self.result_tree = ttk.Treeview(result_frame, columns=columns, show="headings", height=5)

        # 设置列
        self.result_tree.heading("id", text="文档ID", anchor="w")
        self.result_tree.heading("score", text="相似度", anchor="center")
        self.result_tree.heading("title", text="文档标题", anchor="w")

        self.result_tree.column("id", width=80, anchor="w")
        self.result_tree.column("score", width=100, anchor="center")
        self.result_tree.column("title", width=500, anchor="w")

        # 添加滚动条
        scrollbar = ttk.Scrollbar(result_frame, orient="vertical", command=self.result_tree.yview)
        self.result_tree.configure(yscrollcommand=scrollbar.set)

        self.result_tree.grid(row=0, column=0, sticky="nsew")
        scrollbar.grid(row=0, column=1, sticky="ns")

        # 绑定选择事件
        self.result_tree.bind("<<TreeviewSelect>>", self.show_document_detail)

        # 文档详情框架
        detail_frame = ttk.LabelFrame(left_frame, text="文档详情", padding=10)
        detail_frame.pack(fill="x", expand=True, padx=5, pady=5)

        # 文档详情文本区域
        self.detail_text = scrolledtext.ScrolledText(detail_frame, wrap="word",
                                                     font=("微软雅黑", 11), height=13)
        self.detail_text.pack(fill="both", expand=True)
        self.detail_text.configure(state="disabled")

        # 添加"打开所在文件夹"按钮
        button_frame = ttk.Frame(detail_frame)
        button_frame.pack(fill="x", pady=5)

        # 添加显示搜索耗时的标签
        self.search_time_label = ttk.Label(button_frame, text="搜索耗时: - ms",
                                           font=("微软雅黑", 10))
        self.search_time_label.pack(side="left", padx=5)

        # 添加显示总结耗时的标签
        self.summary_time_label = ttk.Label(button_frame, text="总结耗时: - ms",
                                            font=("微软雅黑", 10))
        self.summary_time_label.pack(side="left", padx=5)

        self.open_folder_btn = tk.Button(button_frame, text="打开所在文件夹",
                                         bg="#2ecc71", fg="white", font=("微软雅黑", 10, "bold"),
                                         relief="flat", padx=10, cursor="hand2",
                                         command=self.open_document_folder,
                                         state="disabled")
        self.open_folder_btn.pack(side="right", padx=5)

        # 右侧内容 - 总结框架
        summary_frame = ttk.LabelFrame(right_frame, text="大模型总结", padding=10)
        summary_frame.pack(fill="both", expand=True, padx=5, pady=5)

        # 总结文本区域
        self.summary_area = scrolledtext.ScrolledText(summary_frame, wrap="word",
                                                      font=("微软雅黑", 11), height=25)
        self.summary_area.pack(fill="both", expand=True)
        self.summary_area.configure(state="disabled")
        self.summary_area.tag_configure("summary", background="#f0f0f0", font=("微软雅黑", 11))

        # 状态栏
        self.status_var = tk.StringVar()
        self.status_var.set("就绪")
        status_bar = ttk.Label(self.root, textvariable=self.status_var, relief="sunken", anchor="w")
        status_bar.pack(side="bottom", fill="x")

        # 样式配置
        self.style = ttk.Style()
        self.style.configure("Treeview", font=("微软雅黑", 10))
        self.style.configure("Treeview.Heading", font=("微软雅黑", 10, "bold"))
        self.style.configure("TLabel", font=("微软雅黑", 10))

        self.result_tree.tag_configure("even", background="#f0f8ff")
        self.result_tree.tag_configure("odd", background="#e6f7ff")

        # 配置高亮标签
        self.detail_text.tag_configure("highlight", background="#FFD700", foreground="black")

    def on_domain_change(self, event=None):
        """处理搜索域变更事件"""
        domain_map = {
            "正文": "content",
            "标题": "title",
            "主讲人": "author",
            "邀请人": "inviter"
        }
        self.search_domain = domain_map.get(self.domain_var.get(), "content")

    def initialize_system(self):
        """初始化系统：加载文档、构建索引和计算文档向量长度"""
        try:
            # 加载文档
            folder_path = 'D:\\深大\\课程\\大二下   课\\信息检索\\大作业\\docs'
            self.Docstr, self.doc_id_map, self.doc_folder_map = self.load_documents_from_folder(folder_path)
            # Docstr中存储文档，2个map存编号与原始编号的映射、与路径的映射
            self.N = len(self.Docstr)  # 文档总数

            # 构建倒排索引
            for doc_id in range(1, self.N + 1):
                content = self.Docstr[doc_id - 1]
                lines = content.split("\n")
                title = lines[0].strip()
                self.Title_list.append(title)  # 记录标题

                # 提取主讲人
                au_arr = ["主讲人：", "主讲嘉宾：", "报告人：", "报告嘉宾："]
                author = "未提取"
                for sp in au_arr:
                    if content.count(sp):
                        au_lines = content.split(sp)
                        au = au_lines[1].split("\n")
                        if au and au[0].strip():
                            author = au[0].strip()
                            break
                self.author_list.append(author)

                # 提取邀请人
                inviter_arr = ["邀请人："]
                inviter = "未提取"
                for sp in inviter_arr:
                    if content.count(sp):
                        inv_lines = content.split(sp)
                        inv = inv_lines[1].split("\n")
                        if inv and inv[0].strip():
                            inviter = inv[0].strip()
                            break
                self.inviter_list.append(inviter)

                # 构建正文倒排索引
                word_count = {}

                # for word in jieba.cut(content):
                for word in useai_to_sp(create_prompt_sub(content)):
                    word_count[word] = word_count.get(word, 0) + 1

                for word, count in word_count.items():
                    if word in self.stop_word:
                        continue

                    if word not in self.doc_dict:
                        self.doc_dict[word] = {}
                    self.doc_dict[word][doc_id] = count

                # 构建标题倒排索引
                title_word_count = {}

                # for word in jieba.cut(title):
                for word in useai_to_sp(create_prompt_sub(title)):
                    title_word_count[word] = title_word_count.get(word, 0) + 1

                for word, count in title_word_count.items():
                    if word not in self.title_dict:
                        self.title_dict[word] = {}
                    self.title_dict[word][doc_id] = count

                # 构建主讲人倒排索引
                if author != "未提取":
                    for char in author:
                        if char not in self.author_dict:
                            self.author_dict[char] = {}
                        self.author_dict[char][doc_id] = self.author_dict[char].get(doc_id, 0) + 1

                    author_word_count = {}

                    # for word in jieba.cut(author):
                    for word in useai_to_sp(create_prompt_sub(author)):
                        author_word_count[word] = author_word_count.get(word, 0) + 1

                    for word, count in author_word_count.items():
                        if word not in self.author_dict:
                            self.author_dict[word] = {}
                        self.author_dict[word][doc_id] = count

                # 构建邀请人倒排索引
                if inviter != "未提取":
                    for char in inviter:
                        if char not in self.inviter_dict:
                            self.inviter_dict[char] = {}
                        self.inviter_dict[char][doc_id] = self.inviter_dict[char].get(doc_id, 0) + 1

                    inviter_word_count = {}

                    # for word in jieba.cut(inviter):
                    for word in useai_to_sp(create_prompt_sub(inviter)):
                        inviter_word_count[word] = inviter_word_count.get(word, 0) + 1

                    for word, count in inviter_word_count.items():
                        if word not in self.inviter_dict:
                            self.inviter_dict[word] = {}
                        self.inviter_dict[word][doc_id] = count

            # 预计算所有文档的向量长度
            self.doc_lengths = [0.0] * (self.N + 1)  # 索引0不使用
            for doc_id in range(1, self.N + 1):
                doc_len_sq = 0.0
                # 遍历当前文档的所有词
                # for word in set(jieba.cut(self.Docstr[doc_id - 1])):
                for word in set(useai_to_sp(create_prompt_sub(self.Docstr[doc_id - 1]))):
                    if word in self.doc_dict and doc_id in self.doc_dict[word]:
                        tf = self.doc_dict[word][doc_id]
                        df = len(self.doc_dict[word])
                        idf = math.log(self.N / df) if df > 0 else 0
                        wtf = math.log10(tf) + 1
                        weight = wtf * idf
                        doc_len_sq += weight * weight
                self.doc_lengths[doc_id] = math.sqrt(doc_len_sq) if doc_len_sq > 0 else 0.0

            # 更新UI
            self.root.after(0, self.on_initialization_complete)

        except Exception as e:
            self.root.after(0, lambda: messagebox.showerror("初始化错误", f"加载文档时出错: {str(e)}"))
            self.root.after(0, self.root.destroy)

    def on_initialization_complete(self):
        """初始化完成后更新UI"""
        self.progress.stop()
        self.progress.pack_forget()
        self.loading_label.pack_forget()
        self.status_var.set(f"系统已就绪，已加载 {self.N} 个文档")
        self.search_entry.focus_set()

    def load_documents_from_folder(self, folder_path):
        """从文件夹结构加载文档，返回文档列表、文档ID到原始名称的映射和文档ID到文件夹路径的映射"""
        documents = []  # 存储文档内容
        doc_id_map = {}  # 映射：数字ID -> 原始文件名
        doc_folder_map = {}  # 映射：数字ID -> 文件夹路径

        # 遍历主文档文件夹
        for dir_name in os.listdir(folder_path):
            dir_path = os.path.join(folder_path, dir_name)

            # 只处理文件夹
            if not os.path.isdir(dir_path):
                continue

            # 读取文件夹内所有.md文件内容
            content = ""
            flag = 0
            for file_name in sorted(os.listdir(dir_path)):
                if file_name.endswith('.md'):
                    file_path = os.path.join(dir_path, file_name)
                    try:
                        with open(file_path, 'r', encoding='gbk', errors='ignore') as f:
                            content += f.read() + "\n\n"
                            lines = content.split("\n")
                            if len(lines) < 6:
                                flag += 1
                    except:
                        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                            content += f.read() + "\n\n"
                            lines = content.split("\n")
                            if len(lines) < 6:
                                flag += 1

            if flag > 0:
                continue

            documents.append(content)
            # 提取文档ID（前缀数字）
            doc_id = dir_name.split('_')[0]
            inner_id = len(documents)
            doc_id_map[inner_id] = doc_id  # 保存映射关系
            doc_folder_map[inner_id] = dir_path  # 保存文件夹路径

        return documents, doc_id_map, doc_folder_map

    def get_inverted_index(self, domain):
        """根据域获取对应的倒排索引"""
        if domain == "title":
            return self.title_dict
        elif domain == "author":
            return self.author_dict
        elif domain == "inviter":
            return self.inviter_dict
        else:  # 默认正文
            return self.doc_dict

    def compute_tf_idf_scores(self, query_doc, domain="content"):
        """
        计算查询文档与所有文档的TF-IDF点积分数
        :param query_doc: 查询文档字符串
        :param domain: 搜索域（content/title/author/inviter）
        :return: (分数数组, 查询文档向量长度)
        """
        scores = [0.0] * (self.N + 1)  # 初始化分数数组
        query_len_sq = 0.0  # 查询文档向量长度的平方

        # 获取对应域的倒排索引
        inverted_index = self.get_inverted_index(domain)

        # 统计查询文档的词频
        query_word_count = {}
        # for word in jieba.cut(query_doc):
        for word in useai_to_sp(create_prompt_sub(query_doc)):
            query_word_count[word] = query_word_count.get(word, 0) + 1

        # 遍历查询文档中的每个词
        for word, tfI in query_word_count.items():
            # 只处理存在于全局词典中的词
            if word in inverted_index:
                df = len(inverted_index[word])
                idf = math.log(self.N / df) if df > 0 else 0

                # 计算查询文档中该词的权重
                wtfI = math.log10(tfI) + 1 if tfI > 0 else 0
                weightI = wtfI * idf
                query_len_sq += weightI * weightI  # 累加到长度平方

                # 遍历包含该词的所有文档
                for doc_id_j, tfJ in inverted_index[word].items():
                    # 计算文档j中该词的权重
                    wtfJ = math.log10(tfJ) + 1 if tfJ > 0 else 0
                    weightJ = wtfJ * idf
                    # 累加分数
                    scores[doc_id_j] += weightI * weightJ

        query_len = math.sqrt(query_len_sq) if query_len_sq > 0 else 0.0
        return scores, query_len

    def compute_cos_similarity(self, scores, query_len):
        """
        计算余弦相似度
        :param scores: TF-IDF点积分数数组
        :param query_len: 查询文档向量长度
        :return: 余弦相似度数组
        """
        cos_sim = [0.0] * len(scores)
        for j in range(1, len(scores)):
            if query_len > 0 and self.doc_lengths[j] > 0:
                cos_sim[j] = scores[j] / (query_len * self.doc_lengths[j])
            else:
                cos_sim[j] = 0.0
            cos_sim[j] = round(cos_sim[j], 4)  # 保留4位小数
        return cos_sim

    def get_top_k(self, cos_sim, k=10):
        """
        获取前k个相似文档
        :param cos_sim: 余弦相似度数组
        :param k: 返回的结果数量
        :return: 前k个文档的列表[(文档索引, 相似度)]
        """
        heap = []
        for j in range(1, len(cos_sim)):
            heapq.heappush(heap, (cos_sim[j], j))

        # 获取最大的k个元素
        top_k = heapq.nlargest(k, heap)
        re_arr = []
        for score, doc_id in top_k:
            if score == 0:
                break
            re_arr.append((doc_id, score))

        # return [(doc_id, score) for score, doc_id in top_k]
        return re_arr

    def create_prompt_sum(self, q, topk):
        """
        根据搜索结果的topk文档构建总结提示词
        :param q: 原始查询
        :param topk: 搜索结果列表，格式为[(文档ID, 相似度分数)]
        :return: 构建好的提示词字符串
        """
        prompt = f"""
    经过搜索排序后挑出最靠前的{len(topk)}篇文档，你需要分析与总结一下它们的内容。
    原始查询是："{q}"
    下面是这些文档：
    """
        # 遍历topk结果
        for doc_id, score in topk:
            # 获取实际文档内容
            actual_doc_id = None
            for ind, ori in self.doc_id_map.items():
                if str(ind) == str(doc_id):
                    actual_doc_id = ori
                    break

            if actual_doc_id is None:
                continue

            # 获取文档内容
            content = self.Docstr[ind - 1]
            # 获取文档标题（第一行）
            title = content.split("\n")[0].strip()
            # 添加文档信息到提示词
            prompt += f"标题: {title}\n"
            prompt += "内容摘要: "
            # 添加文档内容摘要（前500字符）
            # 首先移除标题行
            content_lines = content.split("\n")[1:]
            content_without_title = "\n".join(content_lines)

            # 截取前500字符作为摘要
            summary = content_without_title[:500]
            if len(content_without_title) > 500:
                summary += "..."

            prompt += summary + "\n"

        prompt += f"""
    以上是根据查询"{q}"检索出的最相关文档摘要，请你分析并总结这些文档的共同主题和核心内容。
    如果文档数少于5个，给出可能的查询纠错以及你的候选查询建议
    """
        return prompt

    def perform_search(self, event=None):
        """执行搜索操作"""
        query = self.search_entry.get().strip()
        if not query:
            messagebox.showinfo("提示", "请输入搜索内容")
            return

        # 更新耗时显示
        self.search_time_label.config(text="搜索耗时: 计算中...")
        self.summary_time_label.config(text="总结耗时: - ms")
        # 清空总结区域并显示加载提示
        self.summary_area.configure(state="normal")
        self.summary_area.delete(1.0, tk.END)
        self.summary_area.insert(tk.END, "正在生成总结...请稍候...", "summary")
        self.summary_area.configure(state="disabled")

        self.status_var.set(f"正在搜索: {query} ({self.domain_var.get()})...")
        self.result_tree.delete(*self.result_tree.get_children())
        self.detail_text.configure(state="normal")
        self.detail_text.delete(1.0, tk.END)
        self.detail_text.configure(state="disabled")
        self.open_folder_btn.config(state="disabled")  # 禁用文件夹按钮

        # 在后台执行搜索
        threading.Thread(target=self.do_search, args=(query,), daemon=True).start()

    def do_search(self, query):
        """执行实际搜索操作"""
        try:
            # 记录开始时间
            search_start_time = time.time()

            # 计算TF-IDF分数
            scores, query_len = self.compute_tf_idf_scores(query, self.search_domain)
            # 计算余弦相似度
            cos_sim = self.compute_cos_similarity(scores, query_len)
            # 获取前10个相似文档
            top10 = self.get_top_k(cos_sim, k=10)

            # 计算搜索耗时（毫秒）
            search_elapsed_time = (time.time() - search_start_time) * 1000

            # 更新UI显示搜索结果
            self.root.after(0, self.display_search_results, query, top10, search_elapsed_time)

            # 启动总结线程
            threading.Thread(target=self.generate_summary, args=(query, top10), daemon=True).start()

        except Exception as e:
            self.root.after(0, lambda: messagebox.showerror("搜索错误", f"搜索过程中出错: {str(e)}"))

    def display_search_results(self, query, results, elapsed_time):
        """在表格中显示搜索结果"""
        # 更新搜索耗时显示
        self.search_time_label.config(text=f"搜索耗时: {elapsed_time:.2f} ms")

        if not results:
            self.status_var.set(f"没有找到与 '{query}' 相关的文档")
            return

        for i, (doc_id, score) in enumerate(results):
            original_id = self.doc_id_map.get(doc_id, str(doc_id))
            content = self.Docstr[doc_id - 1]
            title = content.split("\n")[0][:100]  # 取第一行作为标题

            tag = "even" if i % 2 == 0 else "odd"
            self.result_tree.insert("", "end", values=(original_id, f"{score:.4f}", title), tags=(tag,))

        self.status_var.set(f"找到 {len(results)} 个与 '{query}' 相关的文档（{self.domain_var.get()}）")
        if self.result_tree.get_children():
            self.result_tree.selection_set(self.result_tree.get_children()[0])
            self.show_document_detail()
            self.open_folder_btn.config(state="normal")  # 启用文件夹按钮

    def generate_summary(self, query, topk):
        """生成总结并在完成后更新UI"""
        try:
            # 记录开始时间
            summary_start_time = time.time()

            # 调用大模型总结
            summary_prompt = self.create_prompt_sum(query, topk)
            summary_text = useai_to_sum(summary_prompt)

            # 计算总结耗时（毫秒）
            summary_elapsed_time = (time.time() - summary_start_time) * 1000

            # 更新UI显示总结
            self.root.after(0, self.display_summary, summary_text, summary_elapsed_time)

        except Exception as e:
            self.root.after(0, lambda: self.display_summary(f"总结生成失败: {str(e)}", 0))

    def display_summary(self, summary_text, elapsed_time):
        """在总结区域显示总结内容"""
        # 更新总结耗时显示
        if elapsed_time > 0:
            self.summary_time_label.config(text=f"总结耗时: {elapsed_time:.2f} ms")
        else:
            self.summary_time_label.config(text="总结耗时: 失败")

        # 更新总结区域
        self.summary_area.configure(state="normal")
        self.summary_area.delete(1.0, tk.END)
        self.summary_area.insert(tk.END, summary_text, "summary")
        self.summary_area.configure(state="disabled")

        self.status_var.set("总结生成完成")

    def highlight_query_words(self, content, query):
        """在文档内容中高亮显示查询词"""
        self.detail_text.configure(state="normal")
        self.detail_text.delete(1.0, tk.END)

        # 清除之前的高亮标签
        self.detail_text.tag_remove("highlight", "1.0", "end")

        # 插入文档内容
        self.detail_text.insert(tk.END, content)

        # 使用jieba分词查询字符串
        query_words = set(jieba.cut(query))

        # 高亮每个查询词
        for word in query_words:
            if len(word) < 2:  # 忽略单字词
                continue

            start_idx = "1.0"
            while True:
                # 搜索词在文本中的位置
                start_idx = self.detail_text.search(word, start_idx, stopindex=tk.END,
                                                    regexp=False, nocase=True)
                if not start_idx:
                    break

                # 计算结束位置
                end_idx = f"{start_idx}+{len(word)}c"

                # 添加高亮标签
                self.detail_text.tag_add("highlight", start_idx, end_idx)

                # 移动到下一个位置继续搜索
                start_idx = end_idx

        self.detail_text.configure(state="disabled")
        self.detail_text.yview_moveto(0)  # 滚动到顶部

    def show_document_detail(self, event=None):
        """显示选中文档的详细信息，并高亮查询词"""
        selected = self.result_tree.selection()
        if not selected:
            return

        item = self.result_tree.item(selected[0])
        doc_id = item['values'][0]

        # 根据显示的ID找到实际文档内容
        actual_doc_id = None
        for k, v in self.doc_id_map.items():
            if str(v) == str(doc_id):
                actual_doc_id = k
                break

        if actual_doc_id is None:
            return

        content = self.Docstr[actual_doc_id - 1]

        # 获取当前查询词
        query = self.search_entry.get().strip()

        # 显示文档内容并高亮查询词
        self.highlight_query_words(content, query)

        # 启用文件夹按钮
        self.open_folder_btn.config(state="normal")

    def open_document_folder(self):
        """打开当前选定文档所在的文件夹"""
        selected = self.result_tree.selection()
        if not selected:
            return

        item = self.result_tree.item(selected[0])
        doc_id = item['values'][0]  # 获取文档ID

        # 根据显示的ID找到实际文档ID
        actual_doc_id = None
        for k, v in self.doc_id_map.items():
            if str(v) == str(doc_id):
                actual_doc_id = k
                break

        if actual_doc_id is None:
            messagebox.showerror("错误", "无法找到文档对应的文件夹")
            return

        folder_path = self.doc_folder_map.get(actual_doc_id)

        if folder_path and os.path.exists(folder_path):
            try:
                # 跨平台打开文件夹
                if platform.system() == "Windows":
                    os.startfile(folder_path)
                elif platform.system() == "Darwin":  # macOS
                    subprocess.Popen(["open", folder_path])
                else:  # Linux
                    subprocess.Popen(["xdg-open", folder_path])
            except Exception as e:
                messagebox.showerror("错误", f"无法打开文件夹: {str(e)}")
        else:
            messagebox.showerror("错误", f"文件夹不存在: {folder_path}")


if __name__ == "__main__":
    jieba.initialize()  # 初始化jieba分词
    root = tk.Tk()
    app = DocumentSearchApp(root)
    root.mainloop()