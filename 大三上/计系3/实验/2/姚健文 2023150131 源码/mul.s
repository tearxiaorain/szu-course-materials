.data
CONTROL: .word32 0x10000
DATA:    .word32 0x10008
num1:    .word 0           # 乘数
num2:    .word 0           # 被乘数
result:  .word 0           # 乘积
loopnum: .word 32          # 循环次数32
str1:    .asciiz "please enter two number: \n"
str2:    .asciiz "result: \n"

.text
main:
    # 初始化栈指针为内存最高地址
    daddi   $sp, $zero, 0x03F8   # 内存最高地址为 0x03F8

    lw      r1,  CONTROL($zero)  # R1 = CONTROL
    lw      r2,  DATA($zero)     # R2 = DATA
    
    # 打印提示信息
    daddi   r3,  $zero, str1     # R3 = add(str1)
    daddi   r4,  $zero, 4        # R4 = 4 
    sw      r3,  0(r2)
    sw      r4,  0(r1)

    # 输入第一个数
    daddi   r4,  $zero, 8        # R4 = 8
    sw      r4,  0(r1)
    lw      r3,  0(r2)           # R3 = input_1
    daddi   $t0, $zero, num1     # t0 = add(num1)
    sw      r3,  0($t0)          # num1 = input_1

    # 输入第二个数
    daddi   r4,  $zero, 8        # R4 = 8
    sw      r4,  0(r1)
    lw      r3,  0(r2)           # R3 = input_2
    daddi   $t0, $zero, num2     # t0 = add(num2)
    sw      r3,  0($t0)          # num2 = input_2

    # 加载数据到寄存器
    lw      $s1, num1($zero)     # 乘数
    lw      $s2, num2($zero)     # 被乘数
    daddi   $s3, $zero, 0        # 乘积
    lw      $s4, loopnum($zero)  # 循环次数32

    daddi   $s0, $zero, 0        # s0 = 循环计数器，初始化为0

loop:
    # 检查乘数的最低位
    andi    $t0, $s1, 1          # 取最低位
    beq     $t0, $zero, skip1    # 如果最低位为0，跳过加法
    
    # 如果最低位为1，加上被乘数
    dadd    $s3, $s3, $s2
    
skip1:
    dsll    $s2, $s2, 1          # 被乘数左移1位
    dsrl    $s1, $s1, 1          # 乘数右移1位
    
    # 循环计数器加1
    daddi   $s0, $s0, 1
    
    # 检查循环是否继续
    slt     $t0, $s0, $s4        # 如果s0 < s4，则t0=1
    bne     $t0, $zero, loop     # 如果t0 != 0，跳转到loop

    # 保存结果
    daddi   $t0, $zero, result   # t0 = result的地址
    sw      $s3, 0($t0)          # 保存结果

    # 输出结果提示
    daddi   r3,  $zero, str2     # R3 = add(str2)
    daddi   r4,  $zero, 4        # R4 = 4 
    sw      r3,  0(r2)
    sw      r4,  0(r1)

    # 输出结果值
    daddi   r4,  $zero, 2        # R4 = 2 (输出整数)
    sw      $s3, 0(r2)           # 输出结果值
    sw      r4,  0(r1)
    
    # 程序结束
    halt