package exp4

import chisel3._
import chisel3.util._

class SimpleCounter(val max: Int) extends Module {
    val io = IO(new Bundle {
        val out = Output(UInt(log2Ceil(max).W))
    })

    // 定义一个寄存器，并初始化为 0
    val countReg = RegInit(0.U(log2Ceil(max).W))

    // 每个时钟周期计数值加一
    countReg := countReg + 1.U

    // 当计数值达到最大值时，重置为 0
    when(countReg === (max - 1).U) {
        countReg := 0.U
    }

    // 将计数值输出
    io.out := countReg
}
