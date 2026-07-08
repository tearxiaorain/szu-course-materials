package exp7.todo

import chisel3._
import chiseltest._
import org.scalatest.freespec.AnyFreeSpec

class TestCounter4 extends AnyFreeSpec with ChiselScalatestTester {
    "Counter4 should count only when enabled" in {
        // 下面这里使用 WriteVcdAnnotation 开启了 VCD 波形
        // VCD 波形将会输出到 test_run_dir/Counter4_should_count_only_when_enabled/Counter4.vcd 这个文件中
        test(new Counter4).withAnnotations(Seq(WriteVcdAnnotation)) { dut =>
            // 初始状态
            dut.io.enable.poke(false.B)
            dut.clock.step(1) // 第一个时钟周期
            println(s"Count after 1 clock: ${dut.io.count.peek().litValue}")
            dut.io.count.expect(0.U)

            // 使能计数
            dut.io.enable.poke(true.B)

            /**
       * TODO: 计数几次，使用println将count的值打印出来。
       *       为了观察到计数超时复位的情况，你可能需要
       *       使用for循环step并打印15次, 例如 for(i <- 0 until 15),
       *       接下来再次step应该会观察到数值变为了 0 
       */
            println("test count")
            for(i <- 0 until 15){
                dut.clock.step()
                print("Count after ")
                print(i + 2)
                print(" clock: ")
                println(dut.io.count.peek().litValue)
            }
            dut.clock.step()
            println("test 0: ")
            print("Count after 17 clock: ")
            println(dut.io.count.peek().litValue)

            // 你可以将 enable 赋值为 false.B 再试试看
            println("test enable false: ")
            dut.io.enable.poke(false.B)
            for(i <- 0 until 5){
                dut.clock.step()
                print("Count after ")
                print(i + 18)
                print(" clock: ")
                println(dut.io.count.peek().litValue)
            }

        }
    }
}

// 测试命令：
// mill MyChiselProject.test.testOnly exp7.todo.TestCounter4
