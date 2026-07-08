package exp5

import chisel3._
import chiseltest._
import org.scalatest.freespec.AnyFreeSpec

class TestFsm extends AnyFreeSpec with ChiselScalatestTester {
    "Fsm should correctly switch and ring the bell" in {
        test(new Fsm) { dut =>
            dut.io.badEvent.poke(false.B)
            dut.io.worstEvent.poke(false.B)
            dut.io.clear.poke(false.B)

            for (i <- 1 to 99) {
                dut.clock.step()
            }

            // worst event, state --> black
            dut.io.badEvent.poke(false.B)
            dut.io.clear.poke(false.B)
            dut.io.worstEvent.poke(true.B)
            dut.clock.step()

            dut.io.badEvent.poke(false.B)
            dut.io.clear.poke(false.B)
            dut.io.worstEvent.poke(false.B)
            dut.clock.step()
            dut.io.ringBell.expect(false.B)

            // worst event, state black --> black --> ring bell
            dut.io.badEvent.poke(false.B)
            dut.io.clear.poke(false.B)
            dut.io.worstEvent.poke(true.B)
            dut.clock.step()
            dut.io.ringBell.expect(true.B)

            // bad event, state black --> black --> ring bell
            dut.io.badEvent.poke(true.B)
            dut.io.clear.poke(false.B)
            dut.io.worstEvent.poke(false.B)
            dut.clock.step()
            dut.io.ringBell.expect(true.B)

            // clear , state black --> red
            dut.io.badEvent.poke(false.B)
            dut.io.clear.poke(true.B)
            dut.io.worstEvent.poke(false.B)
            dut.clock.step()
            dut.io.ringBell.expect(false.B)

            // clear, state --> orange
            dut.io.badEvent.poke(false.B)
            dut.io.clear.poke(true.B)
            dut.io.worstEvent.poke(false.B)
            dut.clock.step()
            dut.io.ringBell.expect(false.B)

            // worst event, state --> black
            dut.io.badEvent.poke(false.B)
            dut.io.clear.poke(false.B)
            dut.io.worstEvent.poke(true.B)
            dut.clock.step()

            dut.io.badEvent.poke(false.B)
            dut.io.clear.poke(false.B)
            dut.io.worstEvent.poke(false.B)
            dut.io.ringBell.expect(false.B)

            // worst event, state --> black --> ring bell
            dut.io.badEvent.poke(false.B)
            dut.io.clear.poke(false.B)
            dut.io.worstEvent.poke(true.B)
            dut.clock.step()
            dut.io.ringBell.expect(true.B)

        }
    }
}
