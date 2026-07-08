package exp9.todo

import chisel3._
import chisel3.util._
import chisel3.util.experimental._
import firrtl.annotations.{MemoryLoadFileType}

object WaveType {
    val triangular = 0.U
    val sawtooth   = 1.U
    val square     = 2.U
    val sine       = 3.U

    val width = 2
    def apply(): UInt = UInt(width.W)
}

object FrequencyType {
    val f   = 0.U
    val f_2 = 1.U

    val width = 1
    def apply(): UInt = UInt(width.W)
}

class DDSCtrl extends Module {
    val io = IO(new Bundle() {
        val waveType = Output(WaveType())
        val freType  = Output(FrequencyType())
    })

    // todo
    io.waveType := WaveType.sine
    io.freType  := FrequencyType.f
}

class TriangularWaveGen extends Module {
    val dataWidth = 8
    val io = IO(new Bundle() {
        val enable  = Input(Bool())
        val freType = Input(FrequencyType())
        val wave    = Output(UInt(dataWidth.W))
    })

    io.wave := DontCare

    val counter   = RegInit(0.U(16.W))
    val direction = RegInit(true.B) // true for up, false for down
    val waveReg   = RegInit(0.U(16.W))

    when(counter(7) ^ ~direction) {
        direction := ~direction
    }
    counter := counter + 1.U + io.freType

    when(direction) {
        waveReg := waveReg + 1.U + io.freType
    }.otherwise {
        waveReg := waveReg - 1.U - io.freType
    }

    io.wave := waveReg
}

class SawtoothWaveGen extends Module {
    val dataWidth = 8
    val io = IO(new Bundle() {
        val enable  = Input(Bool())
        val freType = Input(FrequencyType())
        val wave    = Output(UInt(dataWidth.W))
    })

    io.wave := DontCare

    val counter   = RegInit(0.U(16.W))
    val waveReg   = RegInit(0.U(16.W))

    counter := counter + 1.U + io.freType 

    when(counter === 0.U) {
        waveReg := 0.U;
    }.otherwise {
        waveReg := waveReg + 1.U + io.freType 
    }

    io.wave := waveReg
}

class SquareWaveGen extends Module {
    val dataWidth = 8
    val io = IO(new Bundle() {
        val enable  = Input(Bool())
        val freType = Input(FrequencyType())
        val wave    = Output(UInt(dataWidth.W))
    })

    io.wave := DontCare

    val counter   = RegInit(0.U(16.W))
    val direction = RegInit(true.B) // true for up, false for down
    val waveReg   = RegInit(0.U(16.W))

    when(counter(7) ^ ~direction) {
        direction := ~direction
        waveReg := ~waveReg
    }
    counter := counter + 1.U + io.freType

    io.wave := waveReg
}

class SineDataRAM extends Module {
    val io = IO(new Bundle() {
        val address = Input(UInt(8.W))
        val value   = Output(UInt(8.W))
    })

    val memory = Mem(256, UInt(8.W))
    io.value := memory.read(io.address)

    loadMemoryFromFileInline(memory, "src/main/scala/exp9/todo/data.txt", MemoryLoadFileType.Binary)
}

class SineWaveGen extends Module {
    val dataWidth = 8
    val io = IO(new Bundle() {
        val enable  = Input(Bool())
        val freType = Input(FrequencyType())
        val wave    = Output(UInt(dataWidth.W))
    })

    val dataModule = Module(new SineDataRAM)
    val readAddr   = RegInit(0.U(8.W))

    val counter   = RegInit(0.U(16.W))
    val waveReg   = RegInit(0.U(16.W))

    counter := counter + 1.U

    when(counter % 256.U === 0.U) {
        readAddr := 0.U
    }.otherwise {
        readAddr := readAddr + 1.U + io.freType
    }

    //io.wave := waveReg

    dataModule.io.address := readAddr
    io.wave               := dataModule.io.value
}

class DDSGen extends Module {
    val dataWidth = 8
    val io = IO(new Bundle() {
        val waveType = Input(WaveType())
        val freType  = Input(FrequencyType())
        val wave     = Output(UInt(dataWidth.W))
    })

    val sineWave       = Module(new SineWaveGen)
    val squareWave     = Module(new SquareWaveGen)
    val sawtoothWave   = Module(new SawtoothWaveGen)
    val triangularWave = Module(new TriangularWaveGen)

    sineWave.io.freType := io.freType
    sineWave.io.enable  := (io.waveType === WaveType.sine)

    squareWave.io.freType := io.freType
    squareWave.io.enable  := (io.waveType === WaveType.square)

    sawtoothWave.io.freType := io.freType
    sawtoothWave.io.enable  := (io.waveType === WaveType.sawtooth)

    triangularWave.io.freType := io.freType
    triangularWave.io.enable  := (io.waveType === WaveType.triangular)

    io.wave := DontCare
    when(io.waveType === WaveType.sine){
        io.wave := sineWave.io.wave
    }.elsewhen(io.waveType === WaveType.square){
        io.wave := squareWave.io.wave
    }.elsewhen(io.waveType === WaveType.sawtooth){
        io.wave := sawtoothWave.io.wave
    }.elsewhen(io.waveType === WaveType.triangular){
        io.wave := triangularWave.io.wave
    }
}

class DDS extends Module {
    val dataWidth = 8
    val io = IO(new Bundle() {
        val wave = Output(UInt(dataWidth.W))
        val flag = Output(Bool())
    })

    val ctrlInfo = Module(new DDSCtrl)
    val waveGen  = Module(new DDSGen)

    io.wave := DontCare

    waveGen.io.waveType := ctrlInfo.io.waveType
    waveGen.io.freType  := ctrlInfo.io.freType
    io.wave := waveGen.io.wave

    val cntTmp = RegInit(0.U(8.W))
    cntTmp  := cntTmp + 1.U
    io.flag := cntTmp === 0.U
}
