import java.util.ArrayList;

public class IR_HW3_3 {
    static ArrayList<byte[]> VBcode(int num){
        ArrayList<byte[]> ans = new ArrayList<>();
        boolean flag = true;
        while (true) {
            byte[] temp = new byte[8];
            int t = num % 128;
            for (int i = 7; i >= 0; i--) {
                temp[i] = (byte) (t % 2 == 1 ? 1 : 0);
                t /= 2;
            }
            if (flag) {
                temp[0] = (byte) 1;
                flag = false;
            }
            ans.addFirst(temp);
            if (num < 128)
                break;
            num /= 128;
        }
        return ans;
    } //VB编码
    static void print(ArrayList<byte[]> vb){
        for (byte[] bytes : vb) {
            for (int j = 0; j < 8; j++) {
                System.out.print(bytes[j]);
            }
            System.out.print(" ");
        }
    }
    static int VBnum(ArrayList<byte[]> vb){
        int num = 0;
        for (byte[] bytes : vb) {
            for (int j = 1; j < 8; j++) {
                num *= 2;
                num += bytes[j];
            }
        }
        return num;
    }  //VB解码


    public static void main(String[] args) {
        print(VBcode(723));
        System.out.println();
        System.out.println(VBnum(VBcode(723)));
        print(VBcode(938));
        System.out.println();
        System.out.println(VBnum(VBcode(938)));
        print(VBcode(623));
        System.out.println();
        System.out.println(VBnum(VBcode(623)));
    }
}
