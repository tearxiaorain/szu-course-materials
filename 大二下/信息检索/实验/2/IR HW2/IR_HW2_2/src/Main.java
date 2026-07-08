import java.io.*;
import java.util.*;

public class Main {
    public static Map<Integer, ArrayList<Integer>> proximity_search
            (Map<String, Map<Integer,ArrayList<Integer>>> index,String s1,String s2,int k) {
        Map<Integer, ArrayList<Integer>> ans = new TreeMap<>();
        if(k < 0) {
            if (index.containsKey(s1) && index.containsKey(s2)) {
                Map<Integer, ArrayList<Integer>> doc1 = index.get(s1);
                Map<Integer, ArrayList<Integer>> doc2 = index.get(s2);
                for (Map.Entry<Integer, ArrayList<Integer>> ent1 : doc1.entrySet()) {
                    if (doc2.containsKey(ent1.getKey())) { //p1=p2，取交集操作可用布尔检索实现，此处为了减少代码量以及方便用java自带的接口判断
                        ArrayList<Integer> temp = new ArrayList<>();
                        Iterator<Integer> it1 = ent1.getValue().iterator();
                        Iterator<Integer> it2 = doc2.get(ent1.getKey()).iterator();
                        Integer pp1 = null;
                        if (it1.hasNext()) {
                            pp1 = it1.next();
                        }
                        Integer pp2 = null;
                        if (it2.hasNext()) {
                            pp2 = it2.next();
                        }

                        while (pp1 != null) {
                            while (pp2 != null) {
                                if (0 > pp1 - pp2 && pp1 - pp2 >= k) {
                                    temp.add(pp2);
                                } else if (pp1 <= pp2) {
                                    break;
                                }
                                if (it2.hasNext()) {
                                    pp2 = it2.next();
                                } else {
                                    pp2 = null;
                                }
                            }
                            while (!temp.isEmpty() && (pp1 > temp.getFirst() || pp1 - temp.getFirst() < k)) {
                                temp.removeFirst();
                            }
                            Iterator<Integer> itt = temp.iterator();
                            Integer pt = null;
                            if (itt.hasNext()) {
                                pt = itt.next();
                            }
                            while (pt != null) {
                                if (!ans.containsKey(ent1.getKey())) {
                                    ans.put(ent1.getKey(), new ArrayList<>());
                                }

                                ans.get(ent1.getKey()).add(pp1);
                                ans.get(ent1.getKey()).add(pt);

                                if (itt.hasNext()) {
                                    pt = itt.next();
                                } else {
                                    pt = null;
                                }
                            }
                            if (it1.hasNext()) {
                                pp1 = it1.next();
                            } else {
                                pp1 = null;
                            }
                        }
                    }
                }
            } else {
                System.out.println("error");
            }
            return ans;
        }
        else { // k > 0
            return proximity_search(index, s2, s1, 0 - k);
        }
    }

    public static void print(Map<Integer, ArrayList<Integer>> ans,String str){
        System.out.print(str+":  ");
        if(ans.isEmpty()){
            System.out.println("null");
        }else{
            for(Map.Entry<Integer, ArrayList<Integer>> ent : ans.entrySet()) {
                System.out.print("<"+ent.getKey()+">: ");
                System.out.print(ent.getValue());
                System.out.print("     ");
            }
            System.out.print("\n");
        }
    }



    public static void main(String[] args) {
        //读取文件
        FileReader file = null;
        try {
            file = new FileReader("D:\\HW2.txt");
        } catch (FileNotFoundException e) {
            System.out.println("文件缺失");
        }

        //建立倒排索引表
        Map<String, Map<Integer,ArrayList<Integer>>> index = new TreeMap<>();
        try {
            if (file == null)
                return;
            Scanner scanner = new Scanner(file);
            int num = 0;
            //按行读取文档
            while (scanner.hasNext()) {
                num++;
                String doc = scanner.nextLine();
                String[] words = doc.split(" +"); //使用正则表达式分隔
                int pos = 0;
                for (String word : words) {
                    pos++;
                    if (word.isEmpty()) {
                        continue;
                    }
                    String Lower_word = word.toLowerCase(); //将单词转换为小写
                    if (!index.containsKey(Lower_word)) {
                        index.put(Lower_word, new TreeMap<Integer,ArrayList<Integer>>());
                    }  //索引表中没有该单词，则创建这个单词的文档map，且初始化键值为文档编号
                    if(!index.get(Lower_word).containsKey(num)){
                        index.get(Lower_word).put(num,new ArrayList<>());
                    }  //索引表中有该单词，但没有当前文档编号的文档位置表，则创建一个当前文档编号的位置表
                    index.get(Lower_word).get(num).add(pos); //如果索引表中已经有这个单词，在这个文档对应的编号键值中加入位置信息
                }
            }
        } catch (Exception e) {throw new RuntimeException(e);}

        //将倒排索引表写入到文件
        try {
            File index_f = new File("C:\\Users\\Yao Jianwen\\Desktop", "index_pos.txt");
            FileWriter index_fw = new FileWriter(index_f, true);
            BufferedWriter index_bw = new BufferedWriter(index_fw);

            for (Map.Entry<String, Map<Integer, ArrayList<Integer>>> wordEntry : index.entrySet()) {
                // 遍历外层单词条目
                index_bw.write(wordEntry.getKey() + " :  ");
                index_bw.write("\n");
                for (Map.Entry<Integer, ArrayList<Integer>> docEntry : wordEntry.getValue().entrySet()) {
                    // 遍历内层文档条目
                    index_bw.write("<" + docEntry.getKey() + " > :  " + docEntry.getValue());
                    index_bw.write("\n");
                }
                index_bw.write("\n");
            }
            index_bw.close();
        } catch (IOException e) {System.out.println("write error");}

        print(proximity_search(index,"preference", "filtering",-3),"(preference, filtering, -3)");
        //(preference, filtering, -3),
        print(proximity_search(index,"preference", "filtering",-5),"(preference, filtering, -5)");
        //(preference, filtering, -5),
        print(proximity_search(index,"preference", "filtering",+3),"(preference, filtering, +3)");
        //(preference, filtering, +3),
        print(proximity_search(index,"preference", "filtering",+5),"(preference, filtering, +5)");
        //(preference, filtering, +5),
        print(proximity_search(index,"preference", "recommendation",+8),"(preference, recommendation, +8)");
        //(preference, recommendation, +8),
        print(proximity_search(index,"recommendation", "preference",+8),"(recommendation, preference, +8)");
        //(recommendation, preference, +8),
        print(proximity_search(index,"preference", "recommendation",-8),"(preference, recommendation, -8)");
        //(preference, recommendation, -8)

    }
}