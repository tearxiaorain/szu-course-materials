package exp3

import chisel3._
import chisel3.util._

class Decoder3to8 extends Module {
    // 端口定义：
    val io = IO(new Bundle {
        val a = Input(UInt(3.W))
        val b = Output(UInt(8.W))
    })

    // 功能实现：
    io.b := 0.U // Default all outputs to 0
    switch(io.a) {
        is("b000".U) { io.b := "b00000001".U } // 0 -> 00000001
        is("b001".U) { io.b := "b00000010".U } // 1 -> 00000010
        is("b010".U) { io.b := "b00000100".U } // 2 -> 00000100
        is("b011".U) { io.b := "b00001000".U } // 3 -> 00001000
        is("b100".U) { io.b := "b00010000".U } // 4 -> 00010000
        is("b101".U) { io.b := "b00100000".U } // 5 -> 00100000
        is("b110".U) { io.b := "b01000000".U } // 6 -> 01000000
        is("b111".U) { io.b := "b10000000".U } // 7 -> 10000000
    }
}
