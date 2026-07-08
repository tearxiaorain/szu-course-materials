package exp5

import chisel3._
import chisel3.util._

class Fsm extends Module {
    val io = IO(new Bundle {
        val badEvent   = Input(Bool())
        val worstEvent = Input(Bool())
        val clear      = Input(Bool())
        val ringBell   = Output(Bool())
    })

    // FSM的4种状态
    val green :: orange :: red :: black :: Nil = Enum(4)

    // 状态寄存器
    val stateReg = RegInit(green)

    // 状态转换逻辑
    switch(stateReg) {
        is(green) {
            when(io.clear){
                stateReg := green
            }.elsewhen(io.worstEvent){
                stateReg := black
            }.elsewhen(io.badEvent){
                stateReg := orange
            }
        }
        is(orange) {
            when(io.clear){
                stateReg := green
            }.elsewhen(io.worstEvent){
                stateReg := black
            }.elsewhen(io.badEvent){
                stateReg := red
            }
        }
        is(red) {
            when(io.clear){
                stateReg := orange
            }.elsewhen(io.worstEvent){
                stateReg := black
            }.elsewhen(io.badEvent){
                stateReg := red
            }
        }
        is(black) {
            when(io.clear){
                stateReg := red
            }.elsewhen(io.worstEvent){
                stateReg := black
            }.elsewhen(io.badEvent){
                stateReg := black
            }
        }
    }

    // 输出逻辑
    io.ringBell := (stateReg === black && (io.worstEvent || io.badEvent))
}
