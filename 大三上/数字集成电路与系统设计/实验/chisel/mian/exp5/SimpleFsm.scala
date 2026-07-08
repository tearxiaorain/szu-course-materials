package exp5

import chisel3._
import chisel3.util._

class SimpleFsm extends Module {
    val io = IO(new Bundle {
        val badEvent = Input(Bool())
        val clear    = Input(Bool())
        val ringBell = Output(Bool())
    })

    // FSM的三种状态
    val green :: orange :: red :: Nil = Enum(3)

    // 状态寄存器
    val stateReg = RegInit(green)

    // 状态转换逻辑
    switch(stateReg) {
        is(green) {
            when(io.badEvent) {
                stateReg := orange
            }
        }
        is(orange) {
            when(io.badEvent) {
                stateReg := red
            }.elsewhen(io.clear) {
                stateReg := green
            }
        }
        is(red) {
            when(io.clear) {
                stateReg := green
            }
        }
    }

    // 输出逻辑
    io.ringBell := stateReg === red
}
