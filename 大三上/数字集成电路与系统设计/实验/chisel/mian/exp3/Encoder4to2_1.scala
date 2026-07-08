package exp3

import chisel3._
import chisel3.util._

class Encoder4to2_1 extends Module {
    // 端口定义：
    val io = IO(new Bundle {
        val a = Input(UInt(4.W))
        val b = Output(UInt(2.W))
    })

    // 功能实现：
    io.b := MuxLookup(io.a, "b00".U)(
        Seq(
            "b0001".U -> "b00".U,
            "b0010".U -> "b01".U,
            "b0100".U -> "b10".U,
            "b1000".U -> "b11".U
        )
    )
}
