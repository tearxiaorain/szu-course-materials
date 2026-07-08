package exp2

import chisel3._
import scala.util._
import chiseltest._
import org.scalatest.freespec.AnyFreeSpec
import chisel3.experimental.BundleLiterals._

class TestRouter extends AnyFreeSpec with ChiselScalatestTester {

    "Router should pass these test" in {
        test(new Router) { dut =>
            val randNum = new Random

            for (i <- 0 until 100) {
                val a    = randNum.nextInt(32)
                val b    = randNum.nextInt(32)
                val c    = randNum.nextInt(32)
                val ctrl = randNum.nextInt(4)

                dut.io.in(0).poke(a.U)
                dut.io.in(1).poke(b.U)
                dut.io.in(2).poke(c.U)
                dut.io.ctrlInfo.poke(ctrl)

                dut.clock.step(1)
                if (ctrl == 0) {
                    dut.io.out(0).expect(a.U)
                    dut.io.out(1).expect(c.U)
                    dut.io.out(2).expect(b.U)
                } else if (ctrl == 1) {
                    dut.io.out(0).expect(b.U)
                    dut.io.out(1).expect(a.U)
                    dut.io.out(2).expect(c.U)
                } else if (ctrl == 2) {
                    dut.io.out(0).expect(b.U)
                    dut.io.out(1).expect(c.U)
                    dut.io.out(2).expect(a.U)
                } else if (ctrl == 3) {
                    dut.io.out(0).expect(c.U)
                    dut.io.out(1).expect(b.U)
                    dut.io.out(2).expect(a.U)
                }
            }
        }
    }
}
