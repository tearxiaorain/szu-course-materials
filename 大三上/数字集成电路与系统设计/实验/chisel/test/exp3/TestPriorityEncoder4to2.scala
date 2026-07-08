package exp3

import chisel3._
import chiseltest._
import org.scalatest.freespec.AnyFreeSpec

class TestPriorityEncoder4to2 extends AnyFreeSpec with ChiselScalatestTester {

    "PriorityEncoder4to2 should work" in {
        test(new PriorityEncoder4to2) { dut =>
            val inputs = Seq(
                "b0001".U -> "b00",
                "b0010".U -> "b01",
                "b0100".U -> "b10",
                "b1000".U -> "b11",
                "b1100".U -> "b11", // Multiple high bits, highest priority is 3
                "b1010".U -> "b11", // Multiple high bits, highest priority is 3
                "b0110".U -> "b10", // Multiple high bits, highest priority is 2
                "b0011".U -> "b01"  // Multiple high bits, highest priority is 1
            )

            for ((input, expectedOutput) <- inputs) {
                dut.io.in.poke(input)
                dut.clock.step(1)
                val output = "b" + dut.io.out.peek().litValue.toInt.toBinaryString.reverse.padTo(2, '0').reverse
                println(s"input: $input output: $output")
                assert(output == expectedOutput, s"Expected: $expectedOutput, but got: $output")
            }

            // Testing invalid inputs (0000) - should output default "b00"
            val invalidInput = "b0000".U
            dut.io.in.poke(invalidInput)
            dut.clock.step(1)
            val output = "b" + dut.io.out.peek().litValue.toInt.toBinaryString.reverse.padTo(2, '0').reverse
            println(s"input: $invalidInput output: $output")
            assert(output == "b00", s"Expected: b00, but got: $output")
        }
    }
}

class TestPriorityEncoder4to2_1 extends AnyFreeSpec with ChiselScalatestTester {

    "PriorityEncoder4to2_1 should work" in {
        test(new PriorityEncoder4to2_1) { dut =>
            val inputs = Seq(
                "b0001".U -> "b00",
                "b0010".U -> "b01",
                "b0100".U -> "b10",
                "b1000".U -> "b11",
                "b1100".U -> "b11", // Multiple high bits, highest priority is 3
                "b1010".U -> "b11", // Multiple high bits, highest priority is 3
                "b0110".U -> "b10", // Multiple high bits, highest priority is 2
                "b0011".U -> "b01"  // Multiple high bits, highest priority is 1
            )

            for ((input, expectedOutput) <- inputs) {
                dut.io.in.poke(input)
                dut.clock.step(1)
                val output = "b" + dut.io.out.peek().litValue.toInt.toBinaryString.reverse.padTo(2, '0').reverse
                println(s"input: $input output: $output")
                assert(output == expectedOutput, s"Expected: $expectedOutput, but got: $output")
            }

            // Testing invalid inputs (0000) - should output default "b00"
            val invalidInput = "b0000".U
            dut.io.in.poke(invalidInput)
            dut.clock.step(1)
            val output = "b" + dut.io.out.peek().litValue.toInt.toBinaryString.reverse.padTo(2, '0').reverse
            println(s"input: $invalidInput output: $output")
            assert(output == "b00", s"Expected: b00, but got: $output")
        }
    }
}
