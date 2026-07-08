package exp4

import chisel3._
import chiseltest._
import org.scalatest.freespec.AnyFreeSpec

class TestSyncResetDFF extends AnyFreeSpec with ChiselScalatestTester {
    "SyncResetDFF should correctly reset and latch data" in {
        test(new SyncResetDFF) { dut =>
            // Initialize signals
            dut.d.poke(false.B)
            dut.reset.poke(true.B)
            dut.clock.step() // Apply clock edge

            // Print initial state
            println(s"Initial state: d = ${dut.d.peek().litValue}, reset = ${dut.reset.peek().litValue}, q = ${dut.q.peek().litValue}")

            // Check reset functionality
            dut.q.expect(false.B)
            println(s"After reset: q = ${dut.q.peek().litValue}")

            // Release reset
            dut.reset.poke(false.B)
            dut.clock.step() // Apply clock edge

            // Print state after releasing reset
            println(s"After releasing reset: d = ${dut.d.peek().litValue}, reset = ${dut.reset.peek().litValue}, q = ${dut.q.peek().litValue}")

            // Apply data and check latching
            dut.d.poke(true.B)
            dut.clock.step() // Apply clock edge
            println(s"After applying d = true: q = ${dut.q.peek().litValue}")
            dut.q.expect(true.B)

            // Change data and check latching
            dut.d.poke(false.B)
            dut.clock.step() // Apply clock edge
            println(s"After applying d = false: q = ${dut.q.peek().litValue}")
            dut.q.expect(false.B)

            // Apply reset again
            dut.reset.poke(true.B)
            dut.clock.step() // Apply clock edge
            println(s"After applying reset again: q = ${dut.q.peek().litValue}")
            dut.q.expect(false.B)
        }
    }
}
