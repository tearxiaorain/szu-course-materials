package irhw1;

import java.io.*;
import java.util.*;
import java.util.Scanner;

public class Main {
    //交集算法实现
    static ArrayList<Integer> get_and(Map<String, ArrayList<Integer>> index, String s1, String s2) {
        ArrayList<Integer> and_arr = new ArrayList<>();
        // 如果s1、s2在文档中不存在
        if (!index.containsKey(s1) || !index.containsKey(s2)) {
            return and_arr;
        }
        // 初始化指针
        Iterator<Integer> iterator1 = index.get(s1).iterator();
        Iterator<Integer> iterator2 = index.get(s2).iterator();
        Integer p1 = null;
        if (iterator1.hasNext()) {
            p1 = iterator1.next();
        }
        Integer p2 = null;
        if (iterator2.hasNext()) {
            p2 = iterator2.next();
        }
        //取交集操作
        while (p1 != null && p2 != null) {
            if (p1 < p2) {
                if (iterator1.hasNext()) {
                    p1 = iterator1.next();
                } else {
                    p1 = null;
                }
            } else if (p1 > p2) {
                if (iterator2.hasNext()) {
                    p2 = iterator2.next();
                } else {
                    p2 = null;
                }
            } else {  //只有p1==p2时添加
                and_arr.add(p1);
                if (iterator1.hasNext()) {
                    p1 = iterator1.next();
                } else {
                    p1 = null;
                }
                if (iterator2.hasNext()) {
                    p2 = iterator2.next();
                } else {
                    p2 = null;
                }
            }
        }
        return and_arr;
    }
    //交集算法重载，用于计算 索引与计算过的数组的交集
    static ArrayList<Integer> get_and(Map<String, ArrayList<Integer>> index, String s1, ArrayList<Integer> arr_p){
        ArrayList<Integer> and_arr = new ArrayList<>();
        // 如果s1在文档中不存在
        if (!index.containsKey(s1)) {
            return and_arr;
        }
        // 初始化指针
        Iterator<Integer> iterator1 = index.get(s1).iterator();
        Iterator<Integer> iterator2 = arr_p.iterator();
        Integer p1 = null;
        if (iterator1.hasNext()) {
            p1 = iterator1.next();
        }
        Integer p2 = null;
        if (iterator2.hasNext()) {
            p2 = iterator2.next();
        }
        //取交集操作
        while (p1 != null && p2 != null) {
            if (p1 < p2) {
                if (iterator1.hasNext()) {
                    p1 = iterator1.next();
                } else {
                    p1 = null;
                }
            } else if (p1 > p2) {
                if (iterator2.hasNext()) {
                    p2 = iterator2.next();
                } else {
                    p2 = null;
                }
            } else { //p1==p2时添加
                and_arr.add(p1);
                if (iterator1.hasNext()) {
                    p1 = iterator1.next();
                } else {
                    p1 = null;
                }
                if (iterator2.hasNext()) {
                    p2 = iterator2.next();
                } else {
                    p2 = null;
                }
            }
        }
        return and_arr;
    }
    //并集算法实现
    static ArrayList<Integer> get_or(Map<String, ArrayList<Integer>> index, String s1, String s2) {
        ArrayList<Integer> or_arr = new ArrayList<>();

        // 如果s1、s2在文档中不存在
        List<Integer> list1 = index.getOrDefault(s1, new ArrayList<>());
        List<Integer> list2 = index.getOrDefault(s2, new ArrayList<>());
        if (list1.isEmpty() && list2.isEmpty()) {
            return or_arr;
        }

        Iterator<Integer> iterator1 = list1.iterator();
        Iterator<Integer> iterator2 = list2.iterator();

        // 初始化指针
        Integer p1 = null;
        if (iterator1.hasNext()) {
            p1 = iterator1.next();
        }
        Integer p2 = null;
        if (iterator2.hasNext()) {
            p2 = iterator2.next();
        }

        while (p1 != null || p2 != null) {
            if (p1 == null) {
                or_arr.add(p2);
                if (iterator2.hasNext()) {
                    p2 = iterator2.next();
                } else {
                    p2 = null;
                }
            } else if (p2 == null) {
                or_arr.add(p1);
                if (iterator1.hasNext()) {
                    p1 = iterator1.next();
                } else {
                    p1 = null;
                }
            } else if (p1 < p2) {
                or_arr.add(p1);
                if (iterator1.hasNext()) {
                    p1 = iterator1.next();
                } else {
                    p1 = null;
                }
            } else if (p1 > p2) {
                or_arr.add(p2);
                if (iterator2.hasNext()) {
                    p2 = iterator2.next();
                } else {
                    p2 = null;
                }
            } else {  //p1==p2
                or_arr.add(p1);
                if (iterator1.hasNext()) {
                    p1 = iterator1.next();
                } else {
                    p1 = null;
                }
                if (iterator2.hasNext()) {
                    p2 = iterator2.next();
                } else {
                    p2 = null;
                }
            }
        }
        return or_arr;
    }
    //差集算法实现
    static ArrayList<Integer> get_and_not(Map<String, ArrayList<Integer>> index, String s1, String s2) {
        ArrayList<Integer> and_not_arr = new ArrayList<>();

        // 如果s1在文档中不存在
        if (!index.containsKey(s1)) {
            return and_not_arr;
        }
        // 如果s2在文档中不存在
        if (!index.containsKey(s2)) {
            return new ArrayList<>(index.get(s1));
        }
        // 初始化指针
        Iterator<Integer> iterator1 = index.get(s1).iterator();
        Iterator<Integer> iterator2 = index.get(s2).iterator();
        Integer p1 = null;
        p1 = iterator1.next();
        Integer p2 = null;
        p2 = iterator2.next();

        while (p1 != null) {
            if (p2 == null) {
                and_not_arr.add(p1);
                if (iterator1.hasNext()) {
                    p1 = iterator1.next();
                } else {
                    p1 = null;
                }
            } else if (p1 < p2) {
                and_not_arr.add(p1);
                if (iterator1.hasNext()) {
                    p1 = iterator1.next();
                } else {
                    p1 = null;
                }
            } else if (p1 > p2) {
                if (iterator2.hasNext()) {
                    p2 = iterator2.next();
                } else {
                    p2 = null;
                }
            } else {  //p1==p2
                if (iterator1.hasNext()) {
                    p1 = iterator1.next();
                } else {
                    p1 = null;
                }
                if (iterator2.hasNext()) {
                    p2 = iterator2.next();
                } else {
                    p2 = null;
                }
            }
        }
        return and_not_arr;
    }
    //输出
    static void print_arr(ArrayList<Integer> arr,String s) {
        if (arr.isEmpty()) {
            System.out.println("No Result");
        } else {
            System.out.println(s + " :  " + arr);
        }
    }

    //主函数
    public static void main(String[] args) {
        //读取文件
        FileReader file = null;
        try {
            file = new FileReader("D:\\HW1.txt");
        } catch (FileNotFoundException e) {
            System.out.println("文件缺失");
        }

        //建立倒排索引表
        Map<String, ArrayList<Integer>> index = new TreeMap<>();
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

                for (String word : words) {
                    if (word.isEmpty()) {
                        continue;
                    }
                    String Lower_word = word.toLowerCase(); //将单词转换为小写
                    if (!index.containsKey(Lower_word)) {
                        index.put(Lower_word, new ArrayList<>());
                    }
                    index.get(Lower_word).add(num); //如果索引表中已经有这个单词，把文档编号添加进去，否则新建一个这个单词的文档表
                }
            }
        } catch (Exception e) {throw new RuntimeException(e);}

        //将倒排索引表写入到文件
        try {
            File index_f = new File("C:\\Users\\Yao Jianwen\\Desktop", "index.txt");
            FileWriter index_fw = new FileWriter(index_f, true);
            BufferedWriter index_bw = new BufferedWriter(index_fw);

            Set<Map.Entry<String, ArrayList<Integer>>> set = index.entrySet();
            for (Map.Entry<String, ArrayList<Integer>> map : set) {
                index_bw.write(map.getKey() + " :  " + map.getValue());
                index_bw.write("\n");
            }
            index_bw.close();
        } catch (IOException e) {System.out.println("write error");}

        print_arr(get_and(index,"federated","recommendation"),"federated AND recommendation");
        //(a) federated AND recommendation
        print_arr(get_and(index,"transfer","learning"),"transfer AND learning");
        //(b) transfer AND learning
        print_arr(get_and(index,"filtering",get_and(index,"transfer","learning")),"transfer AND learning AND filtering");
        //(c) transfer AND learning AND filtering
        print_arr(get_and(index,"recommendation","feedback"),"recommendation AND feedback");
        //(d) recommendation AND feedback
        print_arr(get_and(index,"recommendation","filtering"),"recommendation AND filtering");
        //(e) recommendation AND filtering
        print_arr(get_or(index,"recommendation","filtering"),"recommendation OR filtering");
        //(f) recommendation OR filtering
        print_arr(get_and(index,"recommendation",get_or(index,"transfer","cross-domain")),"(transfer OR cross-domain ) AND recommendation");
        //(g) (transfer OR cross-domain ) AND recommendation
        print_arr(get_and(index,"recommendation",get_or(index,"sequential","sequence-aware")),"(sequential OR sequence-aware) AND recommendation");
        //(h) (sequential OR sequence-aware) AND recommendation
        print_arr(get_and_not(index,"graph","sequential"),"graph AND NOT sequential");
        //(i) graph AND NOT sequential
        print_arr(get_and_not(index,"transformer","recommendation"),"transformer AND NOT recommendation");
        //(j) transformer AND NOT recommendation
    }
}


