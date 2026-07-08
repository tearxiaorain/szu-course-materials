package exp9.todo

import chisel3._
import scala.util._
import chiseltest._
import org.scalatest.freespec.AnyFreeSpec
import chisel3.experimental.BundleLiterals._

class TestDDS extends AnyFreeSpec with ChiselScalatestTester {

    "DDS test" in {
        test(new DDS).withAnnotations(Seq(WriteVcdAnnotation)) { dut =>
            dut.clock.setTimeout(0)
            for (i <- 0 until 5000) {
                dut.clock.step(1)
            }
        }
    }
}
