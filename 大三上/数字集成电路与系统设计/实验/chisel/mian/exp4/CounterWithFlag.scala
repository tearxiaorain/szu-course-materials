package exp4

import chisel3._
import chisel3.util._

class CounterWithFlag(val counterMax: Int) extends Module {
    val io = IO(new Bundle {
        val flagOut = Output(Bool())
    })

    // 计数器寄存器
    val counter = RegInit(0.U(log2Ceil(counterMax).W))

    // 标志寄存器
    val flag = RegInit(false.B)

    // 计数器每个时钟周期加一
    counter := counter + 1.U

    // 当计数器达到10或20时，标志寄存器翻转
    when(counter === 10.U || counter === 20.U) {
        flag := ~flag
    }

    // 当计数器达到最大值时，回绕到0
    when(counter === (counterMax - 1).U) {
        counter := 0.U
    }

    // 将计数器值和标志寄存器值输出
    io.flagOut := flag
}
