package exp3

import chisel3._
import chisel3.util._

class LUT_1 extends Module {
    // 端口定义：
    val io = IO(new Bundle {
        val a = Input(UInt(3.W))  // 3-bit input (can represent 0 to 7)
        val b = Output(UInt(8.W)) // 8-bit output
    })

    // 功能实现：
    // Use VecInit to create a lookup table with predefined values
    val lut = VecInit(
        Seq(
            0.U(8.W),  // Value for input 0
            1.U(8.W),  // Value for input 1
            4.U(8.W),  // Value for input 2
            9.U(8.W),  // Value for input 3
            16.U(8.W), // Value for input 4
            25.U(8.W), // Value for input 5
            36.U(8.W), // Value for input 6
            49.U(8.W)  // Value for input 7
        )
    )

    // Assign the output based on the input index
    io.b := lut(io.a)
}
