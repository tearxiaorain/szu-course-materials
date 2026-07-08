package exp3

import chisel3._
import chisel3.util._

class PriorityEncoder4to2 extends Module {
    // 端口定义：
    val io = IO(new Bundle {
        val in  = Input(UInt(4.W))
        val out = Output(UInt(2.W))
    })

    // 功能实现：
    io.out := 0.U // Default output

    when(io.in(3)) {
        io.out := 3.U // Highest priority
    }.elsewhen(io.in(2)) {
        io.out := 2.U
    }.elsewhen(io.in(1)) {
        io.out := 1.U
    }.elsewhen(io.in(0)) {
        io.out := 0.U // Lowest priority
    }
}
