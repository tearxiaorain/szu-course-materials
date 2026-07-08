package exp7

import chisel3._
import chiseltest._
import org.scalatest.freespec.AnyFreeSpec
import scala.util.Random

class TestEnableDFF_1 extends AnyFreeSpec with ChiselScalatestTester {
    "EnableDFF should correctly latch data when enabled" in {
        test(new EnableDFF) { dut =>
            // Initialize random number generator
            val rand = new Random()

            // Loop through a fixed number of test cases
            for (i <- 0 until 10) {
                // Randomly assign d and toggle en
                val dValue  = rand.nextBoolean()                  // Random boolean for d
                val enValue = if (i % 2 == 0) true.B else false.B // Toggle en every iteration

                // Set d and en values
                dut.io.d.poke(dValue.B)
                dut.io.en.poke(enValue)
                dut.clock.step() // Apply clock edge

                // Print current state
                println(s"Test $i: d = $dValue, en = $enValue, q = ${dut.io.q.peek().litValue}")

                // Expectation logic based on enable state
                if (enValue.litValue == 1) {
                    // When enabled, q should follow d
                    dut.io.q.expect(dValue.B)
                } else {
                    println(s"Expecting q to retain previous value (not checked in this simple test)")
                }
            }
        }
    }
}
