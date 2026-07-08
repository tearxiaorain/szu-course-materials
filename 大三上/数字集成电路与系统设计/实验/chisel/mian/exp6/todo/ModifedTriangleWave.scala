package exp6.todo

import chisel3._
import chisel3.util._

class ModifiedTriangleWave extends Module {
    val io = IO(new Bundle {
        val waveOut = UInt(16.W)
    })

    io.waveOut <> DontCare

    // TODO: fill your code...
    val counter   = RegInit(0.U(16.W))
    val direction = RegInit(true.B) // true for up, false for down
    val waveReg   = RegInit(0.U(16.W))

    when(counter(7) ^ ~direction) {
        direction := ~direction
    }
    counter := counter + 8.U

    when(direction) {
        waveReg := waveReg + 16.U
    }.otherwise {
        waveReg := waveReg - 16.U
    }

    io.waveOut := waveReg
}

// 测试命令：
// mill MyChiselProject.test.testOnly exp6.todo.TestModifiedTriangleWave
