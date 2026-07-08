package exp3.todo

import chisel3._
import chisel3.util._

class Decoder4to16 extends Module {
    val io = IO(new Bundle {
        val in  = Input(UInt(4.W))
        val out = Output(UInt(16.W))
    })

    io <> DontCare

    // TODO: fill your code...
    io.out := 0.U // Default all outputs to 0 
    switch(io.in) { 
    is("b0000".U) { io.out := "b0000000000000001".U } // 0  -> 0000000000000001 
    is("b0001".U) { io.out := "b0000000000000010".U } // 1  -> 0000000000000010 
    is("b0010".U) { io.out := "b0000000000000100".U } // 2  -> 0000000000000100 
    is("b0011".U) { io.out := "b0000000000001000".U } // 3  -> 0000000000001000  
    is("b0100".U) { io.out := "b0000000000010000".U } // 4  -> 0000000000010000 
    is("b0101".U) { io.out := "b0000000000100000".U } // 5  -> 0000000000100000  
    is("b0110".U) { io.out := "b0000000001000000".U } // 6  -> 0000000001000000 
    is("b0111".U) { io.out := "b0000000010000000".U } // 7  -> 0000000010000000 
    is("b1000".U) { io.out := "b0000000100000000".U } // 8  -> 0000000100000000 
    is("b1001".U) { io.out := "b0000001000000000".U } // 9  -> 0000001000000000 
    is("b1010".U) { io.out := "b0000010000000000".U } // 10 -> 0000010000000000 
    is("b1011".U) { io.out := "b0000100000000000".U } // 11 -> 0000100000000000 
    is("b1100".U) { io.out := "b0001000000000000".U } // 12 -> 0001000000000000 
    is("b1101".U) { io.out := "b0010000000000000".U } // 13 -> 0010000000000000  
    is("b1110".U) { io.out := "b0100000000000000".U } // 14 -> 0100000000000000 
    is("b1111".U) { io.out := "b1000000000000000".U } // 15 -> 1000000000000000 
    }
}
// 测试命令：
// mill MyChiselProject.test.testOnly exp3.todo.TestDecoder4to16
