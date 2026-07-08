package exp4

import chisel3._
import chiseltest._
import org.scalatest.freespec.AnyFreeSpec

class TestCounterWithFlag extends AnyFreeSpec with ChiselScalatestTester {
    "CounterWithFlag should correctly toggle flag at 10 and 20 and reset counter" in {
        // Define the maximum count value for the test
        val maxCount = 30
        println(s"maxCount is ${maxCount}")

        test(new CounterWithFlag(maxCount)) { dut =>
            // Initialize the flag and check the initial value
            dut.io.flagOut.expect(false.B)
            println(s"Initial flag: ${dut.io.flagOut.peek().litValue}")

            // Step through the counter and check the flag value at each step
            for (i <- 0 until maxCount) {
                dut.clock.step() // Apply clock edge
                println(s"Counter at step $i: flagOut = ${dut.io.flagOut.peek().litValue}")

                // Check the flag at specific counter values
                if (i >= 0 && i < 10) {
                    dut.io.flagOut.expect(false.B)
                } else if (i >= 10 && i < 20) {
                    dut.io.flagOut.expect(true.B)
                } else {
                    dut.io.flagOut.expect(false.B)
                }
            }

            // After maxCount steps, the counter should reset and flag should remain as expected
            dut.clock.step() // Apply clock edge
            println(s"Counter after maxCount steps: ${dut.io.flagOut.peek().litValue}")
            dut.io.flagOut.expect(false.B)
        }
    }
}
