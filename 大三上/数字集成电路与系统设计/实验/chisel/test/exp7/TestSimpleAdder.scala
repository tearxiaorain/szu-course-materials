package exp7

import chisel3._
import chiseltest._
import org.scalatest.flatspec.AnyFlatSpec

class TestSimpleAdder extends AnyFlatSpec with ChiselScalatestTester {
    "SimpleAdder" should "correctly add two numbers" in {
        test(new SimpleAdder) { c =>
            // Set inputs
            c.io.a.poke(3.U)
            c.io.b.poke(1.U)

            // Step the clock
            // c.clock.step(1)

            // Check the output
            c.io.sum.expect(4.U)

            // Peek at the output
            val result = c.io.sum.peek().litValue
            println(s"Result of addition: $result")

            // Another test case
            c.io.a.poke(7.U)
            c.io.b.poke(5.U)

            c.clock.step(1)

            // This will fail as the result is 12 (0b1100) and we expect 2 (0b0010)
            c.io.sum.expect(2.U) // This will throw an error
        }
    }
}
