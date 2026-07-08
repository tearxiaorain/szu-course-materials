package exp4

import chisel3._

class EnableDFF extends Module {
    val io = IO(new Bundle {
        val d  = Input(Bool())
        val en = Input(Bool())
        val q  = Output(Bool())
    })

    val qReg = RegInit(false.B)

    when(io.en) {
        qReg := io.d
    }

    io.q := qReg
}
