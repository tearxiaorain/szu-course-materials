package exp4

import chisel3._
import chisel3.util._

class SyncResetDFF_3 extends Module {
    val io = IO(new Bundle {
        val d = Input(Bool())
        val q = Output(Bool())
    })

    // 使用 RegNext 将 d 的值锁存到寄存器中
    val qReg = RegNext(io.d, init = false.B)

    io.q := qReg
}
