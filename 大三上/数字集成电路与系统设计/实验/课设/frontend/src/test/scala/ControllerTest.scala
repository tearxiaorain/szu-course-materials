package LC3

import chisel3._
import chiseltest._
import org.scalatest.flatspec.AnyFlatSpec

class ControllerTest extends AnyFlatSpec
  with ChiselScalatestTester
{
  behavior of "Controller"

  
  it should "test state machine" in {
    test(new Controller) { c =>

      // 初始状态
      c.io.work.poke(true.B) 
      c.io.end.poke(false.B)
      c.clock.step()
      println(s"io.state=${c.io.state.peek}")
      
      // add指令状态转移
      println(s"add指令状态转移: 18 33 35 32 1 18")
      c.io.in.int.poke(false.B)
      c.clock.step()
      println(s"io.state=${c.io.state.peek}")

      c.io.in.r.poke(true.B)
      c.clock.step()
      println(s"io.state=${c.io.state.peek}")

      c.clock.step()
      println(s"io.state=${c.io.state.peek}")
      
      c.io.in.ir.poke(2.U)
      c.clock.step()
      println(s"io.state=${c.io.state.peek}")

      c.clock.step()
      println(s"io.state=${c.io.state.peek}")

      // and指令状态转移
      println(s"and指令状态转移: 18 33 35 32 5 18")
      c.io.in.int.poke(false.B)
      c.clock.step()
      println(s"io.state=${c.io.state.peek}")

      c.io.in.r.poke(true.B)
      c.clock.step()
      println(s"io.state=${c.io.state.peek}")

      c.clock.step()
      println(s"io.state=${c.io.state.peek}")
      
      c.io.in.ir.poke(10.U)
      c.clock.step()
      println(s"io.state=${c.io.state.peek}")

      c.clock.step()
      println(s"io.state=${c.io.state.peek}")

      // not指令状态转移
      println(s"not指令状态转移: 18 33 35 32 9 18")
      c.io.in.int.poke(false.B)
      c.clock.step()
      println(s"io.state=${c.io.state.peek}")

      c.io.in.r.poke(true.B)
      c.clock.step()
      println(s"io.state=${c.io.state.peek}")

      c.clock.step()
      println(s"io.state=${c.io.state.peek}")
      
      c.io.in.ir.poke(18.U)
      c.clock.step()
      println(s"io.state=${c.io.state.peek}")

      c.clock.step()
      println(s"io.state=${c.io.state.peek}")

      // ld指令状态转移
      println(s"ld指令状态转移: 18 33 35 32 2 25 27 18")
      c.io.in.int.poke(false.B)
      c.clock.step()
      println(s"io.state=${c.io.state.peek}")

      c.io.in.r.poke(true.B)
      c.clock.step()
      println(s"io.state=${c.io.state.peek}")

      c.clock.step()
      println(s"io.state=${c.io.state.peek}")
      
      c.io.in.ir.poke(4.U)
      c.clock.step()
      println(s"io.state=${c.io.state.peek}")

      c.clock.step()
      println(s"io.state=${c.io.state.peek}")

      c.io.in.r.poke(true.B)
      c.clock.step()
      println(s"io.state=${c.io.state.peek}")

      c.clock.step()
      println(s"io.state=${c.io.state.peek}")

    }
  }
}