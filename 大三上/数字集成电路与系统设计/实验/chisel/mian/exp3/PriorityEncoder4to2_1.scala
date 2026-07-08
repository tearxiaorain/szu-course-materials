package exp3

import chisel3._
import chisel3.util._

class PriorityEncoder4to2_1 extends Module {
    // 端口定义：
    val io = IO(new Bundle {
        val in  = Input(UInt(4.W))
        val out = Output(UInt(2.W))
    })

    // 功能实现：
    // 创建条件和值对的序列用于 PriorityMux
    val conditions = Seq(
        io.in(3) -> 3.U, // 最高优先级
        io.in(2) -> 2.U,
        io.in(1) -> 1.U,
        io.in(0) -> 0.U  // 最低优先级
    )

    // 使用 PriorityMux 根据条件选择输出
    io.out := PriorityMux(conditions)
}
