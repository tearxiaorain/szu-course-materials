package exp8

import chisel3._
import chisel3.util._

class PopCounter extends Module {
    val io = IO(new Bundle() {
        val in  = Flipped(DecoupledIO(UInt(7.W)))
        val res = ValidIO(UInt(3.W))
    })
    val readyCnt = Counter(15)
    readyCnt.inc()
    io.in.ready  := (readyCnt.value <= 10.U)
    io.res.valid := io.in.fire
    io.res.bits  := PopCount(io.in.bits)
}
class Sender extends Module {
    val io = IO(new Bundle() {
        val out = DecoupledIO(UInt(7.W))
    })
    val (cnt, _) = Counter(io.out.fire, 7)
    io.out.valid := true.B
    io.out.bits  := cnt
}
class PopCounterModule extends Module {
    val io = IO(new Bundle() {
        val res = ValidIO(UInt(3.W))
    })
    val sender   = Module(new Sender)
    val receiver = Module(new PopCounter)
    receiver.io.in <> sender.io.out
    io.res         := receiver.io.res
}
