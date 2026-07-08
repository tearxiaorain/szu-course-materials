package exp6

import chisel3._
import chisel3.util._

class TriangleWave extends Module {
    val io = IO(new Bundle {
        val waveOut = UInt(16.W)
    })

    val counter   = RegInit(0.U(16.W))
    val direction = RegInit(true.B) // true for up, false for down
    val waveReg   = RegInit(0.U(16.W))

    when(counter(7) ^ ~direction) {
        direction := ~direction
    }
    counter := counter + 1.U

    when(direction) {
        waveReg := waveReg + 1.U
    }.otherwise {
        waveReg := waveReg - 1.U
    }

    io.waveOut := waveReg
}
