package exp8.todo

import chisel3._
import scala.util._
import chiseltest._
import org.scalatest.freespec.AnyFreeSpec
import chisel3.experimental.BundleLiterals._

class TestDataTrans extends AnyFreeSpec with ChiselScalatestTester {

    "dataTrans should pass these test" in {
        test(new DataTrans).withAnnotations(Seq(WriteVcdAnnotation)) { dut =>
            val randNum = new Random

            for (i <- 0 until 100) {
                dut.clock.step(1)
            }

            for (i <- 0 until 32) {
                val sendData     = dut.io.senderData(i).peek.litValue
                val receiverData = dut.io.receiverData(i).peek.litValue
                println("i = " + i + " sendData = " + sendData + " receiverData = " + receiverData)
                assert(sendData == receiverData)
            }

        }
    }
}
