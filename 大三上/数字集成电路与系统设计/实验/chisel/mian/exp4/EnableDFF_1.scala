package exp4

import chisel3._
import chisel3.util._

class EnableDFF_1 extends Module {
    val io = IO(new Bundle {
        val d  = Input(Bool())
        val en = Input(Bool())
        val q  = Output(Bool())
    })

    val qReg = RegEnable(io.d, false.B, io.en)

    io.q := qReg
}
