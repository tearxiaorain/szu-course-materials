import java.util.ArrayList;

public class IR_HW3_4 {
    static ArrayList<Byte> Gamma(int num){
        ArrayList<Byte> ans = new ArrayList<>();
        while(num!=0){
            ans.addFirst((byte)(num%2==1?1:0));
            num/=2;
        }
        ans.removeFirst();
        int len=ans.size();
        ans.addFirst((byte)0);
        for(int i=0;i<len;i++){
            ans.addFirst((byte)1);
        }
        return ans;
    }
    static void print(ArrayList<Byte> ga){
        boolean flag = true;
        for(Byte b:ga){
            System.out.print(b);
            if(b==0){
                if(flag)
                    System.out.print(" ");
                flag=false;
            }
        }
    }
    static int ganum(ArrayList<Byte> ga){
        int num=0;
        boolean flag=false;
        for (Byte b : ga) {
            if (b == 0){
                flag=true;
            }
            if(flag){
                if(num==0)
                    num++;
                else
                    num*=2;
                num+=b;
            }
        }
        return num;
    }

    public static void main(String[] args) {
        print(Gamma(723));
        System.out.println();
        System.out.println(ganum(Gamma(723)));
        print(Gamma(938));
        System.out.println();
        System.out.println(ganum(Gamma(938)));
        print(Gamma(623));
        System.out.println();
        System.out.println(ganum(Gamma(623)));
    }
}
