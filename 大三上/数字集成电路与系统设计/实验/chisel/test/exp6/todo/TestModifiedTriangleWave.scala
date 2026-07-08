package exp6.todo

import chisel3._
import chiseltest._
import org.scalatest.freespec.AnyFreeSpec

class TestModifiedTriangleWave extends AnyFreeSpec with ChiselScalatestTester {
    "TestModifiedTriangleWave should generate VCD file" in {
        val maxCycles = 2000

        test(new ModifiedTriangleWave).withAnnotations(Seq(WriteVcdAnnotation)) { dut =>
            dut.clock.setTimeout(0) // setting it to 0 means 'no timeout'

            for (i <- 0 until maxCycles) {
                dut.clock.step()
            }
        }
    }
}
