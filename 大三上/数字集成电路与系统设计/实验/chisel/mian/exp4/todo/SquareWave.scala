package exp4.todo

import chisel3._
import chisel3.util._

class SquareWave extends Module {
    val io = IO(new Bundle {
        val waveOut = Output(Bool())
    })

    io.waveOut <> DontCare

    // TODO: fill your code...

    //计数器寄存器
    val counter = RegInit(0.U(log2Ceil(100).W))
    
    //标志寄存器
    val flag = RegInit(false.B)
    
    //计数器每个时钟周期加一
    counter := counter + 1.U
    
    //当计数器达到30或40时，标志寄存器翻转
    when(counter === 30.U || counter === 40.U){
        flag := ~flag
    }
    
    //当计数器达到最大值时，回绕到0
    when(counter === (100 - 1).U){
        counter := 0.U
    }
    
    //将计数器值和标志寄存器值输出
    io.waveOut := flag
}

// 测试命令：
// mill MyChiselProject.test.testOnly exp4.todo.TestSquareWave
