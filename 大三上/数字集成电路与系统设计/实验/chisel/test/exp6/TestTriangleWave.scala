package exp6

import chisel3._
import chiseltest._
import org.scalatest.freespec.AnyFreeSpec

class TestTriangleWave extends AnyFreeSpec with ChiselScalatestTester {
    "TestTriangleWave should generate VCD file" in {
        val maxCycles = 500

        test(new TriangleWave).withAnnotations(Seq(WriteVcdAnnotation)) { dut =>
            dut.clock.setTimeout(0) // setting it to 0 means 'no timeout'

            for (i <- 0 until maxCycles) {
                dut.clock.step()
            }
        }
    }
}
