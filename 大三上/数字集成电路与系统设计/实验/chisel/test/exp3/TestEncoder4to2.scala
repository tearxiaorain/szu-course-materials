package exp3

import chisel3._
import chiseltest._
import org.scalatest.freespec.AnyFreeSpec

class TestEncoder4to2 extends AnyFreeSpec with ChiselScalatestTester {

    "Encoder4to2 should work" in {
        test(new Encoder4to2) { dut =>
            dut.io.a.poke("b0001".U)
            println(s"input: b0001 output:b${dut.io.b.peek().litValue.toInt.toBinaryString}")

            dut.io.a.poke("b0010".U)
            println(s"input: b0010 output:b${dut.io.b.peek().litValue.toInt.toBinaryString}")

            dut.io.a.poke("b0100".U)
            println(s"input: b0100 output:b${dut.io.b.peek().litValue.toInt.toBinaryString}")

            dut.io.a.poke("b1000".U)
            println(s"input: b1000 output:b${dut.io.b.peek().litValue.toInt.toBinaryString}")

            dut.io.a.poke("b1010".U)
            println(s"input: b1010 output:b${dut.io.b.peek().litValue.toInt.toBinaryString}")
        }
    }
}

class TestEncoder4to2_1 extends AnyFreeSpec with ChiselScalatestTester {

    "Encoder4to2_1 should work" in {
        test(new Encoder4to2_1) { dut =>
            dut.io.a.poke("b0001".U)
            println(s"input: b0001 output:b${dut.io.b.peek().litValue.toInt.toBinaryString}")

            dut.io.a.poke("b0010".U)
            println(s"input: b0010 output:b${dut.io.b.peek().litValue.toInt.toBinaryString}")

            dut.io.a.poke("b0100".U)
            println(s"input: b0100 output:b${dut.io.b.peek().litValue.toInt.toBinaryString}")

            dut.io.a.poke("b1000".U)
            println(s"input: b1000 output:b${dut.io.b.peek().litValue.toInt.toBinaryString}")

            dut.io.a.poke("b1010".U)
            println(s"input: b1010 output:b${dut.io.b.peek().litValue.toInt.toBinaryString}")
        }
    }
}
