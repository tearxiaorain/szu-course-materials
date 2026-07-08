package exp3

import chisel3._
import chiseltest._
import org.scalatest.freespec.AnyFreeSpec

class TestLUT extends AnyFreeSpec with ChiselScalatestTester {
    "LUT should work" in {
        test(new LUT) { dut =>
            // 测试输入和预期输出
            val inputsOutputs = Seq(
                0.U -> 0.U,
                1.U -> 1.U,
                2.U -> 4.U,
                3.U -> 9.U,
                4.U -> 0.U, // 默认输出
                5.U -> 0.U, // 默认输出
                6.U -> 0.U, // 默认输出
                7.U -> 0.U  // 默认输出
            )

            // 逐个测试
            for ((input, expectedOutput) <- inputsOutputs) {
                dut.io.a.poke(input)
                dut.clock.step(1)
                val output = dut.io.b.peek()
                println(s"Input: ${input.litValue}, Output: ${output.litValue}, Expected: ${expectedOutput.litValue}")
            }
        }
    }
}

class TestLUT_1 extends AnyFreeSpec with ChiselScalatestTester {
    "LUT_1 should work" in {
        test(new LUT_1) { dut =>
            // 测试输入和预期输出
            val inputsOutputs = Seq(
                0.U -> 0.U,
                1.U -> 1.U,
                2.U -> 4.U,
                3.U -> 9.U,
                4.U -> 16.U,
                5.U -> 25.U,
                6.U -> 36.U,
                7.U -> 49.U
            )

            // 逐个测试
            for ((input, expectedOutput) <- inputsOutputs) {
                dut.io.a.poke(input)
                dut.clock.step(1)
                val output = dut.io.b.peek()
                println(s"Input: ${input.litValue}, Output: ${output.litValue}, Expected: ${expectedOutput.litValue}")
            }
        }
    }
}
