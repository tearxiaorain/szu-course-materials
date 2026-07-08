package exp3

import chisel3._
import chiseltest._
import org.scalatest.freespec.AnyFreeSpec

class TestDecoder3to8 extends AnyFreeSpec with ChiselScalatestTester {

    "Decoder3to8 should work" in {
        test(new Decoder3to8) { dut =>
            val inputs = Seq(
                "b000".U -> "b00000001",
                "b001".U -> "b00000010",
                "b010".U -> "b00000100",
                "b011".U -> "b00001000",
                "b100".U -> "b00010000",
                "b101".U -> "b00100000",
                "b110".U -> "b01000000",
                "b111".U -> "b10000000"
            )

            for ((input, expectedOutput) <- inputs) {
                dut.io.a.poke(input)
                dut.clock.step(1)
                val output = "b" + dut.io.b.peek().litValue.toInt.toBinaryString.reverse.padTo(8, '0').reverse
                println(s"input: $input output: $output")
                assert(output == expectedOutput, s"Expected: $expectedOutput, but got: $output")
            }
        }
    }
}
