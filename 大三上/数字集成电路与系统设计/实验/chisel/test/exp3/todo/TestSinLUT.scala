package exp3.todo

import chisel3._
import chiseltest._
import org.scalatest.freespec.AnyFreeSpec
import scala.math._

class TestSinLUT extends AnyFreeSpec with ChiselScalatestTester {
    "SinLUT should generate a sine wave" in {
        test(new SinLUT) { dut =>
            // 定义打印波形的方法
            def printWave(output: Int): Unit = {
                val width = output / 4
                var out = " " * width + "*" + " --> " + output
                println(out)
            }

            // 测试查找表的输出，并打印波形
            for (i <- 0 until 50) {
                dut.io.in.poke(i.U)
                dut.clock.step(1)
                val out = dut.io.out.peek().litValue.toInt
                printWave(out)
            }
        }
    }
}
