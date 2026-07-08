package exp4

import chisel3._
import chiseltest._
import org.scalatest.freespec.AnyFreeSpec

class TestEnableDFF extends AnyFreeSpec with ChiselScalatestTester {
    "EnableDFF should correctly latch data when enabled" in {
        test(new EnableDFF) { dut =>
            // Initialize signals
            dut.io.d.poke(false.B)
            dut.io.en.poke(false.B)
            dut.clock.step() // Apply clock edge

            // Print initial state
            println(s"Initial state: d = ${dut.io.d.peek().litValue}, en = ${dut.io.en.peek().litValue}, q = ${dut.io.q.peek().litValue}")

            // Initial state check
            dut.io.q.expect(false.B)
            println(s"Initial q: q = ${dut.io.q.peek().litValue}")

            // Apply data with enable = false
            dut.io.d.poke(true.B)
            dut.clock.step() // Apply clock edge
            println(s"After applying d = true with en = false: q = ${dut.io.q.peek().litValue}")
            dut.io.q.expect(false.B)

            // Enable and apply data
            dut.io.en.poke(true.B)
            dut.clock.step() // Apply clock edge
            println(s"After setting en = true: d = ${dut.io.d.peek().litValue}, q = ${dut.io.q.peek().litValue}")
            dut.io.q.expect(true.B)

            // Change data with enable = true
            dut.io.d.poke(false.B)
            dut.clock.step() // Apply clock edge
            println(s"After applying d = false with en = true: q = ${dut.io.q.peek().litValue}")
            dut.io.q.expect(false.B)

            // Disable and change data
            dut.io.en.poke(false.B)
            dut.io.d.poke(true.B)
            dut.clock.step() // Apply clock edge
            println(s"After disabling en and applying d = true: q = ${dut.io.q.peek().litValue}")
            dut.io.q.expect(false.B)

            // Enable again and check latching
            dut.io.en.poke(true.B)
            dut.clock.step() // Apply clock edge
            println(s"After enabling en again: d = ${dut.io.d.peek().litValue}, q = ${dut.io.q.peek().litValue}")
            dut.io.q.expect(true.B)
        }
    }
}

class TestEnableDFF_1 extends AnyFreeSpec with ChiselScalatestTester {
    "EnableDFF_1 should correctly latch data when enabled" in {
        test(new EnableDFF_1) { dut =>
            // Initialize signals
            dut.io.d.poke(false.B)
            dut.io.en.poke(false.B)
            dut.clock.step() // Apply clock edge

            // Print initial state
            println(s"Initial state: d = ${dut.io.d.peek().litValue}, en = ${dut.io.en.peek().litValue}, q = ${dut.io.q.peek().litValue}")

            // Initial state check
            dut.io.q.expect(false.B)
            println(s"Initial q: q = ${dut.io.q.peek().litValue}")

            // Apply data with enable = false
            dut.io.d.poke(true.B)
            dut.clock.step() // Apply clock edge
            println(s"After applying d = true with en = false: q = ${dut.io.q.peek().litValue}")
            dut.io.q.expect(false.B)

            // Enable and apply data
            dut.io.en.poke(true.B)
            dut.clock.step() // Apply clock edge
            println(s"After setting en = true: d = ${dut.io.d.peek().litValue}, q = ${dut.io.q.peek().litValue}")
            dut.io.q.expect(true.B)

            // Change data with enable = true
            dut.io.d.poke(false.B)
            dut.clock.step() // Apply clock edge
            println(s"After applying d = false with en = true: q = ${dut.io.q.peek().litValue}")
            dut.io.q.expect(false.B)

            // Disable and change data
            dut.io.en.poke(false.B)
            dut.io.d.poke(true.B)
            dut.clock.step() // Apply clock edge
            println(s"After disabling en and applying d = true: q = ${dut.io.q.peek().litValue}")
            dut.io.q.expect(false.B)

            // Enable again and check latching
            dut.io.en.poke(true.B)
            dut.clock.step() // Apply clock edge
            println(s"After enabling en again: d = ${dut.io.d.peek().litValue}, q = ${dut.io.q.peek().litValue}")
            dut.io.q.expect(true.B)
        }
    }
}
