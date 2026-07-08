package exp3

import chisel3._
import chisel3.util._

class Encoder4to2 extends Module {
    //  端口定义：
    val io = IO(new Bundle {
        val a = Input(UInt(4.W))
        val b = Output(UInt(2.W))
    })

    //  功能实现：
    io.b := "b00".U //  Default all outputs to 0
    switch(io.a) {
        is("b0001".U) { io.b := "b00".U }
        is("b0010".U) { io.b := "b01".U }
        is("b0100".U) { io.b := "b10".U }
        is("b1000".U) { io.b := "b11".U }
    }
}
