package exp4.todo

import chisel3._
import chiseltest._
import org.scalatest.freespec.AnyFreeSpec

class TestSquareWave extends AnyFreeSpec with ChiselScalatestTester {
    "TestSquareWave should work well" in {
        test(new SquareWave) { dut =>
            val counterMax          = 100
            val expectedDutyCycle   = 10
            val expectedPhaseOffset = 30

            var highTime = 0
            var detectedPhaseOffset = -1
            var phaseDetected = false

            for (i <- 0 until counterMax) {
                dut.clock.step(1)

                // 检测高电平时间
                if (dut.io.waveOut.peek().litValue == 1) {
                    highTime += 1
                    if (!phaseDetected && i >= expectedPhaseOffset) {
                        detectedPhaseOffset = i
                        phaseDetected = true
                    }
                }
            }

            // 计算实际占空比
            val actualDutyCycle = highTime.toDouble / counterMax * 100

            // 输出检测结果
            println(s"Detected High Time: $highTime")
            println(s"Expected Duty Cycle: $expectedDutyCycle%, Actual Duty Cycle: $actualDutyCycle%")
            println(s"Expected Phase Offset: $expectedPhaseOffset, Detected Phase Offset: $detectedPhaseOffset")

            // 断言占空比和相位偏移
            assert(actualDutyCycle === expectedDutyCycle, s"Expected duty cycle: $expectedDutyCycle%, but got: $actualDutyCycle%")
            assert(detectedPhaseOffset === expectedPhaseOffset, s"Expected phase offset: $expectedPhaseOffset, but got: $detectedPhaseOffset")
        }
    }
}
