public class Main {

    static int min(int a, int b, int c) {
        int m = a;
        if (b < m) m = b;
        if (c < m) m = c;
        return m;
    }

    static int editDis(String s1, String s2) {
        int n1 = s1.length();
        int n2 = s2.length();
        char[] c1 = s1.toCharArray();
        char[] c2 = s2.toCharArray();
        int[][] arr = new int[n1 + 1][n2 + 1];
        arr[0][0] = 0;
        for (int i = 0; i <= n1; i++) {
            arr[i][0] = i;
        }
        for (int i = 0; i <= n2; i++) {
            arr[0][i] = i;
        }
        //动态规划计算编辑距离
        for (int i = 1; i <= n1; i++) {
            for (int j = 1; j <= n2; j++) {
                if (c1[i - 1] == c2[j - 1]) {
                    arr[i][j] = arr[i - 1][j - 1];
                } else {
                    int e1 = arr[i][j - 1] + 1;
                    int e2 = arr[i - 1][j] + 1;
                    int e3 = arr[i - 1][j - 1] + 1;
                    arr[i][j] = min(e1, e2, e3); //在三种操作中选择代价最小的
                }
            }
        }
        return arr[n1][n2];
    }

    static void print(String s1, String s2) {
        System.out.println(s1 + " " + s2 + ": " + editDis(s1, s2));
    }

    public static void main(String[] args) {
        print("affect","effect");
        print("accept","except");
        print("desert","dessert");
        print("principal","principle");
        print("compliment","complement");
        print("stationary","stationery");
        print("altar","alter");
        print("capital","capitol");
        print("elicit","illicit");
        print("allusion","illusion");
        print("counsel","council");
        print("eminent","imminent");
        print("lose","loose");
        print("peace","piece");
        print("bear","bare");
    }
}