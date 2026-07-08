package exp7.todo

import chisel3._
import chisel3.util._

class Counter4 extends Module {
    val io = IO(new Bundle {
        val enable = Input(Bool())
        val count  = Output(UInt(4.W))
    })

    val counter = RegInit(0.U(4.W))

    when(io.enable) {
        counter := counter + 1.U
    }

    io.count := counter
}
