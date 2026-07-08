package exp3.todo

import chisel3._
import chiseltest._
import org.scalatest.flatspec.AnyFlatSpec

class TestDecoder4to16 extends AnyFlatSpec with ChiselScalatestTester {
    "Decoder4to16" should "pass" in {
        test(new Decoder4to16) { dut =>
            for (i <- 0 until 16) {
                dut.io.in.poke(i.U)
                dut.io.out.expect((1 << i).U)
                dut.clock.step(1)
            }
        }
    }
}
