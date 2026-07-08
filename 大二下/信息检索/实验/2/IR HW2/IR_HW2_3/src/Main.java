import java.util.ArrayList;

public class Main {
    //字典树的节点类
    static class TrieNode {
        TrieNode[] children = new TrieNode[27]; // 小写字母和$
        boolean isEnd = false; // 标记是否是单词结尾
    }

    //字典树
    static class TrieTree {
        TrieNode root;
        TrieTree() {
            root = new TrieNode();
        }

        //添加一个单词
        void insert_word(String str) {
            TrieNode temp = root;
            for (char c : str.toCharArray()) {
                if (c == '$') {
                    if (temp.children[26] == null) {
                        temp.children[26] = new TrieNode();
                    }
                    temp = temp.children[26];
                    continue;
                }
                int p = c - 'a';
                if (temp.children[p] == null) {
                    temp.children[p] = new TrieNode();
                }
                temp = temp.children[p];
            }
            temp.isEnd = true;
        }

        //添加同一单词的不同形式
        void insert_whole(String str) {
            ArrayList<Character> word = new ArrayList<>();
            for (char c : str.toCharArray()) {
                word.add(c);
            }
            word.add('$');
            int len = word.size();
            for (int i = 0; i < len; i++) {
                StringBuilder w = new StringBuilder();
                for (char c : word) {
                    w.append(c);
                }
                insert_word(w.toString()); //每次添加这个单词的一个形式
                Character C = word.getFirst();
                word.removeFirst();
                word.add(C);  //转换形式
            }
        }

        //根据前缀寻找单词
        void find_pre(String str) {
            ArrayList<String> result = new ArrayList<>();
            TrieNode temp = root;
            for (char c : str.toCharArray()) {
                if (c == '*') { //达到前缀节点
                    break;
                }
                int p = 0;
                if (c == '$') {
                    p = 26;
                } else {
                    p = c - 'a';
                }
                if (temp.children[p] == null) {
                    System.out.println("NULL");
                    return;
                }
                temp = temp.children[p];
            }
            if (temp.isEnd) {
                result.add(str); //前缀节点刚好是一个完整的单词，直接添加
            }
            DFS(temp, new StringBuilder(str), result); //将子节点下所有符合要求的单词添加

            //将结果转化为原单词并输出
            for (String r : result) {
                StringBuilder s1 = new StringBuilder();
                StringBuilder s2 = new StringBuilder();
                int flag = 0;
                for (char c : r.toCharArray()) {
                    if (c == '$') {
                        flag++;
                        continue;
                    }
                    if (flag == 0) {
                        s1.append(c);
                    } else {
                        s2.append(c);
                    }
                }
                //结果原本的形式为s1$s2，提取出左右的字串形成单词原本的形式
                s2.append(s1);
                System.out.print(s2 + "  ");
            }
            System.out.print("\n");
        }

        //深搜添加符合要求的临时路径
        void DFS(TrieNode root, StringBuilder temp, ArrayList<String> result) {
            for (int i = 0; i < 27; i++) {
                if (root.children[i] != null) {
                    if (i == 26) {
                        temp.append('$');
                    } else {
                        char c = (char) (i + 'a');
                        temp.append(c);
                    }
                    if (root.children[i].isEnd) {
                        result.add(temp.toString());
                    }
                    DFS(root.children[i], temp, result); //深搜递归
                    temp.deleteCharAt(temp.length() - 1); //删去当前路径的当前字母，准备跳向兄弟节点
                }
            }
        }

        //寻找特定的单词
        void find(String str) {
            StringBuilder Permuterm = new StringBuilder();
            StringBuilder s1 = new StringBuilder();
            StringBuilder s2 = new StringBuilder();
            int flag = 0;
            for (char c : str.toCharArray()) {
                if (c == '*') {
                    flag++;
                    continue;
                }
                if (flag == 0) {
                    s1.append(c);
                } else {
                    s2.append(c);
                }
            }
            //提取*左右的字串，旋转成前缀表达式
            if (flag == 2) { //*X*
                Permuterm.append(s2);
            } else { //X*Y或X*或*X
                Permuterm.append(s2);
                Permuterm.append('$');
                Permuterm.append(s1);
            }
            System.out.println(str + ": ");
            find_pre(Permuterm.toString()); //找符合新的前缀表达式的单词
        }
    }

    public static void main(String[] args) {
        TrieTree root = new TrieTree();
        String[] words = {"helmet", "healthy", "helicopter", "their", "there", "to", "too", "two", "light", "write",
                "rite", "upright", "delight", "peace", "piece", "weather", "whether", "adaptation", "stationery"};
        for (String word : words) {
            root.insert_whole(word);
        }
        // 对于hel*，返回helmet和helicopter；
        // 对于*ight，返回light, upright和delight；
        // 对于p*ce，要求返回peace和piece；
        // 对于*tation*，返回adaptation和stationery。
        root.find("hel*");
        root.find("*ight");
        root.find("p*ce");
        root.find("*tation*");

    }
}