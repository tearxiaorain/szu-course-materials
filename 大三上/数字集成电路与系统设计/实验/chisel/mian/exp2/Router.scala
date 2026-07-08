package exp2

import chisel3._
import chisel3.util._

class Router extends Module {
    val io = IO(new Bundle() {
        val ctrlInfo = Input(UInt(2.W))
        val in       = Input(Vec(3, UInt(5.W)))
        val out      = Output(Vec(3, UInt(5.W)))
    })

    io.out(0) := MuxLookup(io.ctrlInfo, io.in(0)) (
        Seq(0.U -> io.in(0), 1.U -> io.in(1), 2.U -> io.in(1), 3.U -> io.in(2)  
    ))

    io.out(1) := MuxLookup(io.ctrlInfo, io.in(1)) (
        Seq(0.U -> io.in(2), 1.U -> io.in(0), 2.U -> io.in(2), 3.U -> io.in(1)  
    ))

    io.out(2) := MuxLookup(io.ctrlInfo, io.in(2)) (
        Seq(0.U -> io.in(1), 1.U -> io.in(2), 2.U -> io.in(0), 3.U -> io.in(0)  
    ))
}