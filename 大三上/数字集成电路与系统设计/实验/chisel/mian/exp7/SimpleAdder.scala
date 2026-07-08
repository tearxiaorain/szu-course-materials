package exp7

import chisel3._
import chisel3.util._

class SimpleAdder extends Module {
    val io = IO(new Bundle {
        val a   = Input(UInt(4.W))
        val b   = Input(UInt(4.W))
        val sum = Output(UInt(4.W))
    })

    io.sum := io.a + io.b
}
