package exp3

import chisel3._
import chisel3.util._

class LUT extends Module {
    // 端口定义：
    val io = IO(new Bundle {
        val a = Input(UInt(3.W))
        val b = Output(UInt(8.W))
    })

    // 功能实现：
    io.b := MuxLookup(io.a, 0.U)(
        Seq(
            0.U -> 0.U,
            1.U -> 1.U,
            2.U -> 4.U,
            3.U -> 9.U
        )
    )
}
