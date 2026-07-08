import java.io.*;
import java.util.*;

public class Main {
    // pair用于倒排索引中term的文档位置与出现频率
    public static class Pair_docId_frequency {
        int index = 0;
        int frequency = 0;

        int getIndex() {
            return index;
        }

        int getFrequency() {
            return frequency;
        }

        Pair_docId_frequency() {
            index = frequency = 0;
        }

        Pair_docId_frequency(int i, int f) {
            index = i;
            frequency = f;
        }
    }
    // pair用于存储文档id与对应的相似度
    public static class Pair_scoreId_cos implements Comparable<Pair_scoreId_cos> {
        int id = 0;
        double cos = 0;

        int getId() {
            return id;
        }

        double getCos() {
            return cos;
        }

        Pair_scoreId_cos() {
            id = 0;
            cos = 0;
        }

        Pair_scoreId_cos(int i, double c) {
            id = i;
            cos = c;
        }

        public int compareTo(Pair_scoreId_cos other) {
            if (this.cos != other.cos) {
                return Double.compare(this.cos, other.cos);
            } else {
                return Integer.compare(other.id, this.id);
            }

        }
    }

    public static void main(String[] args) {
        //读取文件
        FileReader file = null;
        try {
            file = new FileReader("D:\\HW4_1.txt");
        } catch (FileNotFoundException e) {
            System.out.println("文件缺失");
        }

        ArrayList<String> Docstr = new ArrayList<>();  //记录每个文档用于记录查询向量

        //建立倒排索引表
        Map<String, ArrayList<Pair_docId_frequency>> index = new TreeMap<>();
        try {
            if (file == null)
                return;
            Scanner scanner = new Scanner(file);
            int num = 0;
            //按行读取文档
            while (scanner.hasNext()) {
                num++;
                String doc = scanner.nextLine();
                Docstr.add(doc);
                String[] words = doc.split(" +"); //使用正则表达式分隔

                for (String word : words) {
                    if (word.isEmpty()) {
                        continue;
                    }
                    String Lower_word = word.toLowerCase(); //将单词转换为小写
                    if (!index.containsKey(Lower_word)) {
                        index.put(Lower_word, new ArrayList<>());
                    }
                    //如果索引表中已经有这个单词，把文档编号添加进去，
                    //否则新建一个这个单词的文档表
                    if (!index.get(Lower_word).isEmpty() &&
                            index.get(Lower_word).getLast().index == num) {
                        index.get(Lower_word).getLast().frequency++;
                    } else {
                        index.get(Lower_word).add(new Pair_docId_frequency(num, 1));
                    }
                    //如果该单词出现的最新文档是当前文档，则频率加1，否则添加文档编号
                }
            }
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        //将倒排索引表写入到文件
        try {
            File index_f = new File("C:\\Users\\Yao Jianwen\\Desktop", "index.txt");
            FileWriter index_fw = new FileWriter(index_f, true);
            BufferedWriter index_bw = new BufferedWriter(index_fw);

            Set<Map.Entry<String, ArrayList<Pair_docId_frequency>>> set = index.entrySet();
            for (Map.Entry<String, ArrayList<Pair_docId_frequency>> map : set) {
                index_bw.write(map.getKey() + " :  \n{ ");
                for (int i = 0; i < map.getValue().size(); i++) {
                    index_bw.write(map.getValue().get(i).index + "-"
                            + map.getValue().get(i).frequency + " ");
                }
                index_bw.write("}\n");
            }
            index_bw.close();
        } catch (IOException e) {
            System.out.println("write error");
        }

        int N = Docstr.size();  //文档数目

        double[][] score = new double[N + 1][N + 1];  //文档之间的相似度
        double[] lenth = new double[N + 1];           //文档向量的模长
        for (int i = 0; i < N + 1; i++) {
            lenth[i] = 0;
            for (int j = 0; j < N + 1; j++) {
                score[i][j] = 0;
            }
        }         //初始化为0

        //计算相似度  以每个文档分别作为查询向量对其他文档向量进行计算
        for (int i = 1; i <= N; i++) {
            String[] words = Docstr.get(i - 1).split(" +"); //使用正则表达式分隔
            double l = 0;
            for (String word : words) {
                if (word.isEmpty()) {
                    continue;
                }
                String Lower_word = word.toLowerCase(); //将单词转换为小写

                //计算查询向量的df与idf以及tf
                //计算idf
                int df = index.get(Lower_word).size();
                double idf = Math.log10((double) N / df);  //idf计算公式

                double tfi = 0;
                for (Pair_docId_frequency p : index.get(Lower_word)) {
                    if (p.index == i) {
                        tfi = p.frequency;
                        break;
                    }
                }

                //计算wtf
                double wtfi = 0;
                if (tfi > 0) {
                    wtfi = Math.log10(tfi) + 1;  //wtf计算公式
                }

                l += (wtfi * idf) * (wtfi * idf);  //对每个term累加，用于计算查询向量的模长

                //计算以第i个文档作为查询向量时其中的term对第j个文档向量的分数贡献
                for (int j = 1; j <= N; j++) {
                    //计算文档向量的tf
                    double tf = 0;
                    for (Pair_docId_frequency p : index.get(Lower_word)) {
                        if (p.index == j) {
                            tf = p.frequency;
                            break;
                        }
                    }
                    double wtf = 0;
                    if (tf > 0) {
                        wtf = Math.log10(tf) + 1;  //wtf计算公式
                    }
                    score[i][j] += (wtfi * idf) * (wtf * idf);  //对分数进行累加
                }
            }
            lenth[i] = Math.sqrt(l);  //记录每个文档向量的模长
        }
        //计算cos相似度
        for (int i = 1; i < N + 1; i++) {
            for (int j = 1; j < N + 1; j++) {
                score[i][j] /= (lenth[i] * lenth[j]);  //cos计算公式
                score[i][j] = Math.round(score[i][j] * 100.0) / 100.0;
            }
        }
        for (int i = 1; i < N + 1; i++) {
            for (int j = 1; j < N + 1; j++) {
                System.out.printf("文档%d与文档%d的相似度为%.2f\n", i, j, score[i][j]);
            }
        }

        //用一个堆挑选最相似的5个文档
        for (int i = 1; i <= 10; i++) {
            PriorityQueue<Pair_scoreId_cos> closest_5_doc = new PriorityQueue<>();
            for (int j = 1; j < N + 1; j++) {
                if (i == j) {
                    continue;
                }
                if (closest_5_doc.size() < 5) {
                    closest_5_doc.add(new Pair_scoreId_cos(j, score[i][j]));
                } else {
                    if (closest_5_doc.element().cos < score[i][j]) {
                        closest_5_doc.remove();
                        closest_5_doc.add(new Pair_scoreId_cos(j, score[i][j]));
                    }
                }
            }
            ArrayList<Pair_scoreId_cos> doc5 = new ArrayList<>();
            while (!closest_5_doc.isEmpty()) {
                doc5.addFirst(closest_5_doc.element());
                closest_5_doc.remove();
            }

            System.out.println("与" + i + "号文档“" + Docstr.get(i - 1) + "”最接近的5个文档：");
            for (int j = 0; j < 5; j++) {
                System.out.printf("%d: %.2f  “%s”\n", doc5.get(j).id, doc5.get(j).cos, Docstr.get(doc5.get(j).id - 1));
            }

            System.out.println();
        }
    }
}