package exp5

import chisel3._
import chiseltest._
import org.scalatest.freespec.AnyFreeSpec

class TestSimpleFsm extends AnyFreeSpec with ChiselScalatestTester {
    "SimpleFsm should correctly switch and ring the bell" in {
        test(new SimpleFsm) { dut =>
            dut.io.badEvent.poke(false.B)
            dut.io.clear.poke(false.B)

            for (i <- 1 to 99) {
                dut.clock.step()
            }

            // bad event, state --> orange
            dut.io.badEvent.poke(true.B)
            dut.io.clear.poke(false.B)
            dut.clock.step()
            dut.io.ringBell.expect(false.B)

            // bad event, state --> red --> ring bell
            dut.io.badEvent.poke(true.B)
            dut.io.clear.poke(false.B)
            dut.clock.step()
            dut.io.ringBell.expect(true.B)

            // clear, state --> green
            dut.io.badEvent.poke(false.B)
            dut.io.clear.poke(true.B)
            dut.clock.step()
            dut.io.ringBell.expect(false.B)

            // bad event, state --> orange
            dut.io.badEvent.poke(true.B)
            dut.io.clear.poke(false.B)
            dut.clock.step()
            dut.io.ringBell.expect(false.B)

            // clear, state --> green
            dut.io.badEvent.poke(false.B)
            dut.io.clear.poke(true.B)
            dut.clock.step()
            dut.io.ringBell.expect(false.B)

            // bad event, state --> orange
            dut.io.badEvent.poke(true.B)
            dut.io.clear.poke(false.B)
            dut.clock.step()
            dut.io.ringBell.expect(false.B)

            // bad event, state --> red, ring bell
            dut.io.badEvent.poke(true.B)
            dut.io.clear.poke(false.B)
            dut.clock.step()
            dut.io.ringBell.expect(true.B)
        }
    }
}
