package exp4

import chisel3._
import chiseltest._
import org.scalatest.freespec.AnyFreeSpec

class TestSimpleCounter extends AnyFreeSpec with ChiselScalatestTester {
    "SimpleCounter should correctly count up to max and reset" in {
        // Define the maximum count value for the test
        val maxCount = 4
        println(s"maxCount is ${maxCount}")

        test(new SimpleCounter(maxCount)) { dut =>
            // Initialize the count value to 0
            dut.io.out.expect(0.U)
            println(s"Initial count: ${dut.io.out.peek().litValue}")

            // Step through the counter and check its value
            for (i <- 1 until maxCount) {
                dut.clock.step() // Apply clock edge
                println(s"Count at step $i: ${dut.io.out.peek().litValue}")
                dut.io.out.expect(i.U)
            }

            // After maxCount steps, the counter should reset to 0
            dut.clock.step() // Apply clock edge
            println(s"Count after maxCount steps: ${dut.io.out.peek().litValue}")
            dut.io.out.expect(0.U)
        }
    }
}
