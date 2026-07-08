.data
CONTROL: .word32 0x10000
DATA:    .word32 0x10008
array:   .word 8, 6, 3, 7, 1, 0, 9, 4, 5, 2   # 数组
size:    .word 10                             # 数组大小
str1:    .asciiz "before sort the array is: \n"
str2:    .asciiz "after sort the array is: \n"

.text
main:
    # 初始化栈指针为内存最高地址
    daddi   $sp, $zero, 0x03F8  # 内存最高地址为 0x03F8

    ld r1, CONTROL(r0)     # R1 = CONTROL
    ld r2, DATA(r0)        # R2 = DATA
    
    # 打印排序前的数组
    daddi r3, r0, str1     # R3 = add(str1)
    daddi r4, r0, 4        # R4 = 4 
    sd r3, 0(r2)
    sd r4, 0(r1)

    daddi r5, r0, 2        # R5 = 2
    daddi r6, r0, 0        # R6 = 0
    daddi r8, r0, 10

print1:
    dsll r7, r6, 3         # R7 = arr[r6]
    ld r3, array(r7)
    sd r3, 0(r2)
    sd r5, 0(r1)

    daddi r6, r6, 1
    bne r6, r8, print1

    # 加载数组地址和大小到参数寄存器
    daddi   $a0, $zero, array   # a0 = 数组起始地址
    lw      $a1, size($zero)    # a1 = 数组大小

    # 调用排序函数
    jal     sort

    # 打印排序后的数组
    daddi r3, r0, str2     # R3 = add(str2)
    daddi r4, r0, 4        # R4 = 4 
    sd r3, 0(r2)
    sd r4, 0(r1)

    daddi r5, r0, 2        # R5 = 2
    daddi r6, r0, 0        # R6 = 0
    daddi r8, r0, 10

print2:
    dsll r7, r6, 3         # R7 = arr[r6]
    ld r3, array(r7)
    sd r3, 0(r2)
    sd r5, 0(r1)

    daddi r6, r6, 1
    bne r6, r8, print2
    
    # 程序结束
    halt

sort: 
    # 保存寄存器值
    daddi   $sp, $sp, -48     # 为6个寄存器在栈上分配空间
    sd      $ra, 40($sp)      # 保存返回地址
    sd      $s3, 32($sp)       
    sd      $s2, 24($sp)      
    sd      $s1, 16($sp)      
    sd      $s0, 8($sp)       # 保存 s3 s2 s1 s0
    sd      $a0, 0($sp)       # 保存原始数组地址

    # a0 数组起始地址，a1 数组大小
    dadd    $s2, $a0, $zero   # s2保存数组地址
    dadd    $s3, $a1, $zero   # s3保存数组大小
    dadd    $s0, $zero, $zero # i(s0) = 0

for1tst:
    slt     $t0, $s0, $s3     
    beq     $t0, $zero, exit1 # 如果 i >= n 则跳转到 exit1 退出外循环
    daddi   $s1, $s0, -1      # j(s1) = i - 1

for2tst:
    slti    $t0, $s1, 0       
    bne     $t0, $zero, exit2 # 如果 j < 0 则跳转到 exit2 退出内循环
    dsll    $t1, $s1, 3       # t1 = j * 8 (64位系统：每个元素8字节)
    dadd    $t2, $s2, $t1     # t2 = 数组地址 + (j * 8)
    ld      $t3, 0($t2)       # t3 = array[j]
    ld      $t4, 8($t2)       # t4 = array[j + 1]
    slt     $t0, $t4, $t3     
    beq     $t0, $zero, exit2 # 如果 t4 >= t3 则跳转到 exit2 退出内循环

    # 调用 swap
    dadd    $a0, $s2, $zero   
    dadd    $a1, $s1, $zero   # swap 参数: a0: 数组地址 a1: j
    jal     swap              # 调用 swap 函数

    daddi   $s1, $s1, -1      # j -= 1
    j       for2tst           # 跳转到内循环

exit2:
    daddi   $s0, $s0, 1       # i += 1
    j       for1tst           # 跳转到外循环

exit1:
    # 恢复寄存器值
    ld      $a0, 0($sp)       
    ld      $s0, 8($sp)       
    ld      $s1, 16($sp)      
    ld      $s2, 24($sp)      
    ld      $s3, 32($sp)      # 恢复 a0 s0 s1 s2 s3
    ld      $ra, 40($sp)      # 恢复返回地址
    daddi   $sp, $sp, 48      # 恢复栈指针

    # 返回
    jr      $ra               # 返回到调用程序

swap:
    dsll    $t1, $a1, 3       # $t1 = j * 8 (64位系统：每个元素8字节)
    dadd    $t1, $a0, $t1     # $t1 = 数组地址 + (j * 8)
    ld      $t0, 0($t1)       # $t0 = array[j]
    ld      $t2, 8($t1)       # $t2 = array[j + 1]
    sd      $t2, 0($t1)       # array[j] = t2
    sd      $t0, 8($t1)       # array[j + 1] = t0
    jr      $ra               # 返回