module Boot(
  input         clock,
  input         reset,
  output        io_uartRx_ready,
  input         io_uartRx_valid,
  input  [7:0]  io_uartRx_bits,
  output        io_work,
  output        io_initPC_valid,
  output [15:0] io_initPC_bits,
  output [15:0] io_initMem_raddr,
  input  [15:0] io_initMem_rdata,
  output [15:0] io_initMem_waddr,
  output [15:0] io_initMem_wdata,
  output        io_initMem_wen,
  input         io_initMem_R,
  output        io_initMem_mio_en
);
`ifdef RANDOMIZE_REG_INIT
  reg [31:0] _RAND_0;
  reg [31:0] _RAND_1;
  reg [31:0] _RAND_2;
  reg [31:0] _RAND_3;
  reg [31:0] _RAND_4;
  reg [31:0] _RAND_5;
`endif // RANDOMIZE_REG_INIT
  reg [12:0] timeCount; // @[Boot.scala 19:26]
  wire [12:0] _timeCount_T_1 = timeCount + 13'h1; // @[Boot.scala 20:46]
  reg  inTransStart; // @[Boot.scala 22:29]
  wire  timeOut = inTransStart & timeCount > 13'h1b10; // @[Boot.scala 25:30]
  reg [15:0] memAddr; // @[Boot.scala 27:20]
  reg  second; // @[Boot.scala 28:26]
  reg [7:0] firstData; // @[Reg.scala 16:16]
  wire [15:0] fullData = {firstData,io_uartRx_bits}; // @[Cat.scala 31:58]
  wire  fullValid = second & io_uartRx_valid; // @[Boot.scala 31:27]
  wire  _T_1 = ~reset; // @[Boot.scala 34:26]
  reg [1:0] lc3State; // @[Boot.scala 37:25]
  wire  _T_3 = lc3State == 2'h0; // @[Boot.scala 40:17]
  wire  _T_5 = lc3State == 2'h1; // @[Boot.scala 45:17]
  wire [15:0] _memAddr_T_1 = memAddr + 16'h1; // @[Boot.scala 46:24]
  wire  _T_8 = _T_5 & timeOut; // @[Boot.scala 49:29]
  assign io_uartRx_ready = 1'h1; // @[Boot.scala 17:19]
  assign io_work = lc3State == 2'h2; // @[Boot.scala 63:24]
  assign io_initPC_valid = _T_3 & fullValid; // @[Boot.scala 55:44]
  assign io_initPC_bits = {firstData,io_uartRx_bits}; // @[Cat.scala 31:58]
  assign io_initMem_raddr = 16'h0;
  assign io_initMem_waddr = memAddr; // @[Boot.scala 61:20]
  assign io_initMem_wdata = {firstData,io_uartRx_bits}; // @[Cat.scala 31:58]
  assign io_initMem_wen = _T_5 & fullValid; // @[Boot.scala 59:44]
  assign io_initMem_mio_en = 1'h0;
  always @(posedge clock) begin
    if (reset) begin // @[Boot.scala 19:26]
      timeCount <= 13'h0; // @[Boot.scala 19:26]
    end else if (io_uartRx_valid) begin // @[Boot.scala 20:19]
      timeCount <= 13'h0;
    end else begin
      timeCount <= _timeCount_T_1;
    end
    if (reset) begin // @[Boot.scala 22:29]
      inTransStart <= 1'h0; // @[Boot.scala 22:29]
    end else begin
      inTransStart <= inTransStart | io_uartRx_valid; // @[Boot.scala 23:16]
    end
    if (lc3State == 2'h1 & fullValid) begin // @[Boot.scala 45:42]
      memAddr <= _memAddr_T_1; // @[Boot.scala 46:13]
    end else if (lc3State == 2'h0 & fullValid) begin // @[Boot.scala 40:41]
      memAddr <= fullData; // @[Boot.scala 41:13]
    end
    if (reset) begin // @[Boot.scala 28:26]
      second <= 1'h0; // @[Boot.scala 28:26]
    end else if (io_uartRx_valid) begin // @[Boot.scala 33:18]
      second <= ~second; // @[Boot.scala 33:27]
    end
    if (io_uartRx_valid) begin // @[Reg.scala 17:18]
      firstData <= io_uartRx_bits; // @[Reg.scala 17:22]
    end
    if (reset) begin // @[Boot.scala 37:25]
      lc3State <= 2'h0; // @[Boot.scala 37:25]
    end else if (_T_5 & timeOut) begin // @[Boot.scala 49:40]
      lc3State <= 2'h2; // @[Boot.scala 50:14]
    end else if (lc3State == 2'h0 & fullValid) begin // @[Boot.scala 40:41]
      lc3State <= 2'h1; // @[Boot.scala 42:14]
    end else if (reset) begin // @[Boot.scala 38:23]
      lc3State <= 2'h0; // @[Boot.scala 38:34]
    end
    `ifndef SYNTHESIS
    `ifdef PRINTF_COND
      if (`PRINTF_COND) begin
    `endif
        if (fullValid & ~reset) begin
          $fwrite(32'h80000002,"fullValid: %x\n",fullData); // @[Boot.scala 34:26]
        end
    `ifdef PRINTF_COND
      end
    `endif
    `endif // SYNTHESIS
    `ifndef SYNTHESIS
    `ifdef PRINTF_COND
      if (`PRINTF_COND) begin
    `endif
        if (_T_8 & _T_1) begin
          $fwrite(32'h80000002,"Mem init finished, LC3 start work\n"); // @[Boot.scala 51:11]
        end
    `ifdef PRINTF_COND
      end
    `endif
    `endif // SYNTHESIS
  end
// Register and memory initialization
`ifdef RANDOMIZE_GARBAGE_ASSIGN
`define RANDOMIZE
`endif
`ifdef RANDOMIZE_INVALID_ASSIGN
`define RANDOMIZE
`endif
`ifdef RANDOMIZE_REG_INIT
`define RANDOMIZE
`endif
`ifdef RANDOMIZE_MEM_INIT
`define RANDOMIZE
`endif
`ifndef RANDOM
`define RANDOM $random
`endif
`ifdef RANDOMIZE_MEM_INIT
  integer initvar;
`endif
`ifndef SYNTHESIS
`ifdef FIRRTL_BEFORE_INITIAL
`FIRRTL_BEFORE_INITIAL
`endif
initial begin
  `ifdef RANDOMIZE
    `ifdef INIT_RANDOM
      `INIT_RANDOM
    `endif
    `ifndef VERILATOR
      `ifdef RANDOMIZE_DELAY
        #`RANDOMIZE_DELAY begin end
      `else
        #0.002 begin end
      `endif
    `endif
`ifdef RANDOMIZE_REG_INIT
  _RAND_0 = {1{`RANDOM}};
  timeCount = _RAND_0[12:0];
  _RAND_1 = {1{`RANDOM}};
  inTransStart = _RAND_1[0:0];
  _RAND_2 = {1{`RANDOM}};
  memAddr = _RAND_2[15:0];
  _RAND_3 = {1{`RANDOM}};
  second = _RAND_3[0:0];
  _RAND_4 = {1{`RANDOM}};
  firstData = _RAND_4[7:0];
  _RAND_5 = {1{`RANDOM}};
  lc3State = _RAND_5[1:0];
`endif // RANDOMIZE_REG_INIT
  `endif // RANDOMIZE
end // initial
`ifdef FIRRTL_AFTER_INITIAL
`FIRRTL_AFTER_INITIAL
`endif
`endif // SYNTHESIS
endmodule
module Controller(
  input        clock,
  input        reset,
  input  [9:0] io_in_sig,
  input        io_in_int,
  input        io_in_r,
  input  [4:0] io_in_ir,
  input        io_in_ben,
  input        io_in_psr,
  output       io_out_LD_MAR,
  output       io_out_LD_MDR,
  output       io_out_LD_IR,
  output       io_out_LD_BEN,
  output       io_out_LD_REG,
  output       io_out_LD_CC,
  output       io_out_LD_PC,
  output       io_out_LD_PRIV,
  output       io_out_LD_SAVEDSSP,
  output       io_out_LD_SAVEDUSP,
  output       io_out_LD_VECTOR,
  output       io_out_GATE_PC,
  output       io_out_GATE_MDR,
  output       io_out_GATE_ALU,
  output       io_out_GATE_MARMUX,
  output       io_out_GATE_VECTOR,
  output       io_out_GATE_PC1,
  output       io_out_GATE_PSR,
  output       io_out_GATE_SP,
  output [1:0] io_out_PC_MUX,
  output [1:0] io_out_DR_MUX,
  output [1:0] io_out_SR1_MUX,
  output       io_out_ADDR1_MUX,
  output [1:0] io_out_ADDR2_MUX,
  output [1:0] io_out_SP_MUX,
  output       io_out_MAR_MUX,
  output [1:0] io_out_VECTOR_MUX,
  output       io_out_PSR_MUX,
  output [1:0] io_out_ALUK,
  output       io_out_MIO_EN,
  output       io_out_R_W,
  output       io_out_SET_PRIV,
  output [5:0] io_state,
  input        io_work,
  input        io_end
);
`ifdef RANDOMIZE_REG_INIT
  reg [31:0] _RAND_0;
`endif // RANDOMIZE_REG_INIT
  reg [5:0] state; // @[Controller.scala 52:22]
  wire [4:0] _state_T = io_in_ben ? 5'h16 : 5'h12; // @[Controller.scala 126:30]
  wire [4:0] _state_T_2 = io_in_ir[0] ? 5'h15 : 5'h14; // @[Controller.scala 131:30]
  wire [5:0] _state_T_3 = io_in_psr ? 6'h2c : 6'h24; // @[Controller.scala 136:30]
  wire [5:0] _state_T_4 = io_in_psr ? 6'h2d : 6'h25; // @[Controller.scala 141:31]
  wire [4:0] _state_T_5 = io_in_r ? 5'h12 : 5'h10; // @[Controller.scala 144:31]
  wire [5:0] _state_T_6 = io_in_int ? 6'h31 : 6'h21; // @[Controller.scala 148:31]
  wire [4:0] _state_T_7 = io_in_r ? 5'h1a : 5'h18; // @[Controller.scala 156:31]
  wire [4:0] _state_T_8 = io_in_r ? 5'h1b : 5'h19; // @[Controller.scala 157:31]
  wire [4:0] _state_T_9 = io_in_r ? 5'h1e : 5'h1c; // @[Controller.scala 160:31]
  wire [4:0] _state_T_10 = io_in_r ? 5'h1f : 5'h1d; // @[Controller.scala 161:31]
  wire [1:0] _state_T_15 = 4'h2 == io_in_ir[4:1] ? 2'h2 : {{1'd0}, 4'h1 == io_in_ir[4:1]}; // @[Mux.scala 81:58]
  wire [1:0] _state_T_17 = 4'h3 == io_in_ir[4:1] ? 2'h3 : _state_T_15; // @[Mux.scala 81:58]
  wire [2:0] _state_T_19 = 4'h4 == io_in_ir[4:1] ? 3'h4 : {{1'd0}, _state_T_17}; // @[Mux.scala 81:58]
  wire [2:0] _state_T_21 = 4'h5 == io_in_ir[4:1] ? 3'h5 : _state_T_19; // @[Mux.scala 81:58]
  wire [2:0] _state_T_23 = 4'h6 == io_in_ir[4:1] ? 3'h6 : _state_T_21; // @[Mux.scala 81:58]
  wire [2:0] _state_T_25 = 4'h7 == io_in_ir[4:1] ? 3'h7 : _state_T_23; // @[Mux.scala 81:58]
  wire [3:0] _state_T_27 = 4'h8 == io_in_ir[4:1] ? 4'h8 : {{1'd0}, _state_T_25}; // @[Mux.scala 81:58]
  wire [3:0] _state_T_29 = 4'h9 == io_in_ir[4:1] ? 4'h9 : _state_T_27; // @[Mux.scala 81:58]
  wire [3:0] _state_T_31 = 4'ha == io_in_ir[4:1] ? 4'ha : _state_T_29; // @[Mux.scala 81:58]
  wire [3:0] _state_T_33 = 4'hb == io_in_ir[4:1] ? 4'hb : _state_T_31; // @[Mux.scala 81:58]
  wire [3:0] _state_T_35 = 4'hc == io_in_ir[4:1] ? 4'hc : _state_T_33; // @[Mux.scala 81:58]
  wire [3:0] _state_T_37 = 4'hd == io_in_ir[4:1] ? 4'hd : _state_T_35; // @[Mux.scala 81:58]
  wire [3:0] _state_T_39 = 4'he == io_in_ir[4:1] ? 4'he : _state_T_37; // @[Mux.scala 81:58]
  wire [3:0] _state_T_41 = 4'hf == io_in_ir[4:1] ? 4'hf : _state_T_39; // @[Mux.scala 81:58]
  wire [5:0] _state_T_42 = io_in_r ? 6'h23 : 6'h21; // @[Controller.scala 187:31]
  wire [5:0] _state_T_43 = io_in_psr ? 6'h3b : 6'h33; // @[Controller.scala 188:31]
  wire [5:0] _state_T_44 = io_in_r ? 6'h26 : 6'h24; // @[Controller.scala 190:31]
  wire [5:0] _state_T_45 = io_in_r ? 6'h2a : 6'h28; // @[Controller.scala 194:31]
  wire [5:0] _state_T_46 = io_in_r ? 6'h2b : 6'h29; // @[Controller.scala 195:31]
  wire [5:0] _state_T_47 = io_in_r ? 6'h32 : 6'h30; // @[Controller.scala 204:31]
  wire [5:0] _state_T_49 = io_in_r ? 6'h36 : 6'h34; // @[Controller.scala 208:31]
  wire [5:0] _GEN_0 = 6'h3b == state ? 6'h12 : state; // @[Controller.scala 124:20 219:25 52:22]
  wire [5:0] _GEN_1 = 6'h36 == state ? 6'h12 : _GEN_0; // @[Controller.scala 124:20 212:25]
  wire [5:0] _GEN_2 = 6'h34 == state ? _state_T_49 : _GEN_1; // @[Controller.scala 124:20 208:25]
  wire [5:0] _GEN_3 = 6'h33 == state ? 6'h12 : _GEN_2; // @[Controller.scala 124:20 207:25]
  wire [5:0] _GEN_4 = 6'h32 == state ? 6'h34 : _GEN_3; // @[Controller.scala 124:20 206:25]
  wire [5:0] _GEN_5 = 6'h31 == state ? _state_T_4 : _GEN_4; // @[Controller.scala 124:20 205:25]
  wire [5:0] _GEN_6 = 6'h30 == state ? _state_T_47 : _GEN_5; // @[Controller.scala 124:20 204:25]
  wire [5:0] _GEN_7 = 6'h2f == state ? 6'h30 : _GEN_6; // @[Controller.scala 124:20 203:25]
  wire [5:0] _GEN_8 = 6'h2d == state ? 6'h25 : _GEN_7; // @[Controller.scala 124:20 199:25]
  wire [5:0] _GEN_9 = 6'h2c == state ? 6'h2d : _GEN_8; // @[Controller.scala 124:20 198:25]
  wire [5:0] _GEN_10 = 6'h2b == state ? 6'h2f : _GEN_9; // @[Controller.scala 124:20 197:25]
  wire [5:0] _GEN_11 = 6'h2a == state ? 6'h22 : _GEN_10; // @[Controller.scala 124:20 196:25]
  wire [5:0] _GEN_12 = 6'h29 == state ? _state_T_46 : _GEN_11; // @[Controller.scala 124:20 195:25]
  wire [5:0] _GEN_13 = 6'h28 == state ? _state_T_45 : _GEN_12; // @[Controller.scala 124:20 194:25]
  wire [5:0] _GEN_14 = 6'h27 == state ? 6'h28 : _GEN_13; // @[Controller.scala 124:20 193:25]
  wire [5:0] _GEN_15 = 6'h26 == state ? 6'h27 : _GEN_14; // @[Controller.scala 124:20 192:25]
  wire [5:0] _GEN_16 = 6'h25 == state ? 6'h29 : _GEN_15; // @[Controller.scala 124:20 191:25]
  wire [5:0] _GEN_17 = 6'h24 == state ? _state_T_44 : _GEN_16; // @[Controller.scala 124:20 190:25]
  wire [5:0] _GEN_18 = 6'h23 == state ? 6'h20 : _GEN_17; // @[Controller.scala 124:20 189:25]
  wire [5:0] _GEN_19 = 6'h22 == state ? _state_T_43 : _GEN_18; // @[Controller.scala 124:20 188:25]
  wire [5:0] _GEN_20 = 6'h21 == state ? _state_T_42 : _GEN_19; // @[Controller.scala 124:20 187:25]
  wire [5:0] _GEN_21 = 6'h20 == state ? {{2'd0}, _state_T_41} : _GEN_20; // @[Controller.scala 124:20 167:15]
  wire [5:0] _GEN_22 = 6'h1f == state ? 6'h17 : _GEN_21; // @[Controller.scala 124:20 163:25]
  wire [5:0] _GEN_23 = 6'h1e == state ? 6'h12 : _GEN_22; // @[Controller.scala 124:20 162:25]
  wire [5:0] _GEN_24 = 6'h1d == state ? {{1'd0}, _state_T_10} : _GEN_23; // @[Controller.scala 124:20 161:25]
  wire [5:0] _GEN_25 = 6'h1c == state ? {{1'd0}, _state_T_9} : _GEN_24; // @[Controller.scala 124:20 160:25]
  wire [5:0] _GEN_26 = 6'h1b == state ? 6'h12 : _GEN_25; // @[Controller.scala 124:20 159:25]
  wire [5:0] _GEN_27 = 6'h1a == state ? 6'h19 : _GEN_26; // @[Controller.scala 124:20 158:25]
  wire [5:0] _GEN_28 = 6'h19 == state ? {{1'd0}, _state_T_8} : _GEN_27; // @[Controller.scala 124:20 157:25]
  wire [5:0] _GEN_29 = 6'h18 == state ? {{1'd0}, _state_T_7} : _GEN_28; // @[Controller.scala 124:20 156:25]
  wire [5:0] _GEN_30 = 6'h17 == state ? 6'h10 : _GEN_29; // @[Controller.scala 124:20 155:25]
  wire [5:0] _GEN_31 = 6'h16 == state ? 6'h12 : _GEN_30; // @[Controller.scala 124:20 154:25]
  wire [5:0] _GEN_32 = 6'h15 == state ? 6'h12 : _GEN_31; // @[Controller.scala 124:20 153:25]
  wire [5:0] _GEN_33 = 6'h14 == state ? 6'h12 : _GEN_32; // @[Controller.scala 124:20 152:25]
  wire [5:0] _GEN_34 = 6'h12 == state ? _state_T_6 : _GEN_33; // @[Controller.scala 124:20 148:25]
  wire [5:0] _GEN_35 = 6'h10 == state ? {{1'd0}, _state_T_5} : _GEN_34; // @[Controller.scala 124:20 144:25]
  wire [5:0] _GEN_36 = 6'hf == state ? 6'h1c : _GEN_35; // @[Controller.scala 124:20 143:25]
  wire [5:0] _GEN_37 = 6'he == state ? 6'h12 : _GEN_36; // @[Controller.scala 124:20 142:25]
  wire [5:0] _GEN_38 = 6'hd == state ? _state_T_4 : _GEN_37; // @[Controller.scala 124:20 141:25]
  wire [5:0] _GEN_39 = 6'hc == state ? 6'h12 : _GEN_38; // @[Controller.scala 124:20 140:25]
  wire [5:0] _GEN_40 = 6'hb == state ? 6'h1d : _GEN_39; // @[Controller.scala 124:20 139:25]
  wire [5:0] _GEN_41 = 6'ha == state ? 6'h18 : _GEN_40; // @[Controller.scala 124:20 138:25]
  wire [5:0] _GEN_42 = 6'h9 == state ? 6'h12 : _GEN_41; // @[Controller.scala 124:20 137:24]
  wire [5:0] _GEN_43 = 6'h8 == state ? _state_T_3 : _GEN_42; // @[Controller.scala 124:20 136:24]
  wire [5:0] _GEN_44 = 6'h7 == state ? 6'h17 : _GEN_43; // @[Controller.scala 124:20 135:24]
  wire [5:0] _GEN_45 = 6'h6 == state ? 6'h19 : _GEN_44; // @[Controller.scala 124:20 134:24]
  wire [5:0] _GEN_46 = 6'h5 == state ? 6'h12 : _GEN_45; // @[Controller.scala 124:20 133:24]
  wire [5:0] _GEN_47 = 6'h4 == state ? {{1'd0}, _state_T_2} : _GEN_46; // @[Controller.scala 124:20 131:24]
  wire [5:0] _GEN_48 = 6'h3 == state ? 6'h17 : _GEN_47; // @[Controller.scala 124:20 130:24]
  wire [5:0] _GEN_49 = 6'h2 == state ? 6'h19 : _GEN_48; // @[Controller.scala 124:20 129:24]
  wire [38:0] _GEN_54 = 6'h1 == state ? 39'h602004000 : 39'h0; // @[]
  wire [38:0] _GEN_55 = 6'h2 == state ? 39'h4001001100 : _GEN_54; // @[]
  wire [38:0] _GEN_56 = 6'h3 == state ? 39'h4001001100 : _GEN_55; // @[]
  wire [38:0] _GEN_57 = 6'h4 == state ? 39'h408010000 : _GEN_56; // @[]
  wire [38:0] _GEN_58 = 6'h5 == state ? 39'h602004008 : _GEN_57; // @[]
  wire [38:0] _GEN_59 = 6'h6 == state ? 39'h4001006900 : _GEN_58; // @[]
  wire [38:0] _GEN_60 = 6'h7 == state ? 39'h4001006900 : _GEN_59; // @[]
  wire [38:0] _GEN_61 = 6'h8 == state ? 39'h4002008018 : _GEN_60; // @[]
  wire [38:0] _GEN_62 = 6'h9 == state ? 39'h602004010 : _GEN_61; // @[]
  wire [38:0] _GEN_63 = 6'ha == state ? 39'h4001001100 : _GEN_62; // @[]
  wire [38:0] _GEN_64 = 6'hb == state ? 39'h4001001100 : _GEN_63; // @[]
  wire [38:0] _GEN_65 = 6'hc == state ? 39'h100086000 : _GEN_64; // @[]
  wire [38:0] _GEN_66 = 6'hd == state ? 39'h2090200080 : _GEN_65; // @[]
  wire [38:0] _GEN_67 = 6'he == state ? 39'h601001100 : _GEN_66; // @[]
  wire [38:0] _GEN_68 = 6'hf == state ? 39'h4001000000 : _GEN_67; // @[]
  wire [38:0] _GEN_69 = 6'h10 == state ? 39'h6 : _GEN_68; // @[]
  wire [38:0] _GEN_70 = 6'h11 == state ? 39'h0 : _GEN_69; // @[]
  wire [38:0] _GEN_71 = 6'h12 == state ? 39'h4108000000 : _GEN_70; // @[]
  wire [38:0] _GEN_72 = 6'h13 == state ? 39'h0 : _GEN_71; // @[]
  wire [38:0] _GEN_73 = 6'h14 == state ? 39'h508096000 : _GEN_72; // @[]
  wire [38:0] _GEN_74 = 6'h15 == state ? 39'h100081800 : _GEN_73; // @[]
  wire [38:0] _GEN_75 = 6'h16 == state ? 39'h100081000 : _GEN_74; // @[]
  wire [38:0] _GEN_76 = 6'h17 == state ? 39'h2002000018 : _GEN_75; // @[]
  wire [38:0] _GEN_77 = 6'h18 == state ? 39'h2000000004 : _GEN_76; // @[]
  wire [38:0] _GEN_78 = 6'h19 == state ? 39'h2000000004 : _GEN_77; // @[]
  wire [38:0] _GEN_79 = 6'h1a == state ? 39'h4004000000 : _GEN_78; // @[]
  wire [38:0] _GEN_80 = 6'h1b == state ? 39'h604000000 : _GEN_79; // @[]
  wire [38:0] _GEN_81 = 6'h1c == state ? 39'h2408010004 : _GEN_80; // @[]
  wire [38:0] _GEN_82 = 6'h1d == state ? 39'h2000000004 : _GEN_81; // @[]
  wire [38:0] _GEN_83 = 6'h1e == state ? 39'h104040000 : _GEN_82; // @[]
  wire [38:0] _GEN_84 = 6'h1f == state ? 39'h4004000000 : _GEN_83; // @[]
  wire [38:0] _GEN_85 = 6'h20 == state ? 39'h800000000 : _GEN_84; // @[]
  wire [38:0] _GEN_86 = 6'h21 == state ? 39'h2000000004 : _GEN_85; // @[]
  wire [38:0] _GEN_87 = 6'h22 == state ? 39'h400128000 : _GEN_86; // @[]
  wire [38:0] _GEN_88 = 6'h23 == state ? 39'h1004000000 : _GEN_87; // @[]
  wire [38:0] _GEN_89 = 6'h24 == state ? 39'h2000000004 : _GEN_88; // @[]
  wire [38:0] _GEN_90 = 6'h25 == state ? 39'h4400128200 : _GEN_89; // @[]
  wire [38:0] _GEN_91 = 6'h26 == state ? 39'h104040000 : _GEN_90; // @[]
  wire [38:0] _GEN_92 = 6'h27 == state ? 39'h4400128000 : _GEN_91; // @[]
  wire [38:0] _GEN_93 = 6'h28 == state ? 39'h2000000004 : _GEN_92; // @[]
  wire [38:0] _GEN_94 = 6'h29 == state ? 39'h26 : _GEN_93; // @[]
  wire [38:0] _GEN_95 = 6'h2a == state ? 39'h284000000 : _GEN_94; // @[]
  wire [38:0] _GEN_96 = 6'h2b == state ? 39'h2000400000 : _GEN_95; // @[]
  wire [38:0] _GEN_97 = 6'h2c == state ? 39'h2090200040 : _GEN_96; // @[]
  wire [38:0] _GEN_98 = 6'h2d == state ? 39'h420128400 : _GEN_97; // @[]
  wire [38:0] _GEN_99 = 6'h2e == state ? 39'h0 : _GEN_98; // @[]
  wire [38:0] _GEN_100 = 6'h2f == state ? 39'h4400128400 : _GEN_99; // @[]
  wire [38:0] _GEN_101 = 6'h30 == state ? 39'h6 : _GEN_100; // @[]
  wire [38:0] _GEN_102 = 6'h31 == state ? 39'h2090200000 : _GEN_101; // @[]
  wire [38:0] _GEN_103 = 6'h32 == state ? 39'h4000800000 : _GEN_102; // @[]
  wire [38:0] _GEN_104 = 6'h33 == state ? 39'h0 : _GEN_103; // @[]
  wire [38:0] _GEN_105 = 6'h34 == state ? 39'h2000000004 : _GEN_104; // @[]
  wire [38:0] _GEN_106 = 6'h35 == state ? 39'h0 : _GEN_105; // @[]
  wire [38:0] _GEN_107 = 6'h36 == state ? 39'h104040000 : _GEN_106; // @[]
  wire [38:0] _GEN_108 = 6'h37 == state ? 39'h0 : _GEN_107; // @[]
  wire [38:0] _GEN_109 = 6'h38 == state ? 39'h0 : _GEN_108; // @[]
  wire [38:0] _GEN_110 = 6'h39 == state ? 39'h0 : _GEN_109; // @[]
  wire [38:0] _GEN_111 = 6'h3a == state ? 39'h0 : _GEN_110; // @[]
  wire [38:0] _GEN_112 = 6'h3b == state ? 39'h440128600 : _GEN_111; // @[]
  wire [38:0] _GEN_113 = 6'h3c == state ? 39'h0 : _GEN_112; // @[]
  wire [38:0] _GEN_114 = 6'h3d == state ? 39'h0 : _GEN_113; // @[]
  wire [38:0] _GEN_115 = 6'h3e == state ? 39'h0 : _GEN_114; // @[]
  wire [38:0] _GEN_116 = 6'h3f == state ? 39'h0 : _GEN_115; // @[]
  assign io_out_LD_MAR = _GEN_116[38]; // @[Controller.scala 224:37]
  assign io_out_LD_MDR = _GEN_116[37]; // @[Controller.scala 224:37]
  assign io_out_LD_IR = _GEN_116[36]; // @[Controller.scala 224:37]
  assign io_out_LD_BEN = _GEN_116[35]; // @[Controller.scala 224:37]
  assign io_out_LD_REG = _GEN_116[34]; // @[Controller.scala 224:37]
  assign io_out_LD_CC = _GEN_116[33]; // @[Controller.scala 224:37]
  assign io_out_LD_PC = _GEN_116[32]; // @[Controller.scala 224:37]
  assign io_out_LD_PRIV = _GEN_116[31]; // @[Controller.scala 224:37]
  assign io_out_LD_SAVEDSSP = _GEN_116[30]; // @[Controller.scala 224:37]
  assign io_out_LD_SAVEDUSP = _GEN_116[29]; // @[Controller.scala 224:37]
  assign io_out_LD_VECTOR = _GEN_116[28]; // @[Controller.scala 224:37]
  assign io_out_GATE_PC = _GEN_116[27]; // @[Controller.scala 224:37]
  assign io_out_GATE_MDR = _GEN_116[26]; // @[Controller.scala 224:37]
  assign io_out_GATE_ALU = _GEN_116[25]; // @[Controller.scala 224:37]
  assign io_out_GATE_MARMUX = _GEN_116[24]; // @[Controller.scala 224:37]
  assign io_out_GATE_VECTOR = _GEN_116[23]; // @[Controller.scala 224:37]
  assign io_out_GATE_PC1 = _GEN_116[22]; // @[Controller.scala 224:37]
  assign io_out_GATE_PSR = _GEN_116[21]; // @[Controller.scala 224:37]
  assign io_out_GATE_SP = _GEN_116[20]; // @[Controller.scala 224:37]
  assign io_out_PC_MUX = _GEN_116[19:18]; // @[Controller.scala 224:37]
  assign io_out_DR_MUX = _GEN_116[17:16]; // @[Controller.scala 224:37]
  assign io_out_SR1_MUX = _GEN_116[15:14]; // @[Controller.scala 224:37]
  assign io_out_ADDR1_MUX = _GEN_116[13]; // @[Controller.scala 224:37]
  assign io_out_ADDR2_MUX = _GEN_116[12:11]; // @[Controller.scala 224:37]
  assign io_out_SP_MUX = _GEN_116[10:9]; // @[Controller.scala 224:37]
  assign io_out_MAR_MUX = _GEN_116[8]; // @[Controller.scala 224:37]
  assign io_out_VECTOR_MUX = _GEN_116[7:6]; // @[Controller.scala 224:37]
  assign io_out_PSR_MUX = _GEN_116[5]; // @[Controller.scala 224:37]
  assign io_out_ALUK = _GEN_116[4:3]; // @[Controller.scala 224:37]
  assign io_out_MIO_EN = _GEN_116[2]; // @[Controller.scala 224:37]
  assign io_out_R_W = _GEN_116[1]; // @[Controller.scala 224:37]
  assign io_out_SET_PRIV = _GEN_116[0]; // @[Controller.scala 224:37]
  assign io_state = state; // @[Controller.scala 225:12]
  always @(posedge clock) begin
    if (reset) begin // @[Controller.scala 52:22]
      state <= 6'h0; // @[Controller.scala 52:22]
    end else if (io_work & ~io_end) begin // @[Controller.scala 123:27]
      if (6'h0 == state) begin // @[Controller.scala 124:20]
        state <= {{1'd0}, _state_T}; // @[Controller.scala 126:24]
      end else if (6'h1 == state) begin // @[Controller.scala 124:20]
        state <= 6'h12; // @[Controller.scala 128:24]
      end else begin
        state <= _GEN_49;
      end
    end
  end
// Register and memory initialization
`ifdef RANDOMIZE_GARBAGE_ASSIGN
`define RANDOMIZE
`endif
`ifdef RANDOMIZE_INVALID_ASSIGN
`define RANDOMIZE
`endif
`ifdef RANDOMIZE_REG_INIT
`define RANDOMIZE
`endif
`ifdef RANDOMIZE_MEM_INIT
`define RANDOMIZE
`endif
`ifndef RANDOM
`define RANDOM $random
`endif
`ifdef RANDOMIZE_MEM_INIT
  integer initvar;
`endif
`ifndef SYNTHESIS
`ifdef FIRRTL_BEFORE_INITIAL
`FIRRTL_BEFORE_INITIAL
`endif
initial begin
  `ifdef RANDOMIZE
    `ifdef INIT_RANDOM
      `INIT_RANDOM
    `endif
    `ifndef VERILATOR
      `ifdef RANDOMIZE_DELAY
        #`RANDOMIZE_DELAY begin end
      `else
        #0.002 begin end
      `endif
    `endif
`ifdef RANDOMIZE_REG_INIT
  _RAND_0 = {1{`RANDOM}};
  state = _RAND_0[5:0];
`endif // RANDOMIZE_REG_INIT
  `endif // RANDOMIZE
end // initial
`ifdef FIRRTL_AFTER_INITIAL
`FIRRTL_AFTER_INITIAL
`endif
`endif // SYNTHESIS
endmodule
module ALU(
  input  [15:0] io_ina,
  input  [15:0] io_inb,
  input  [1:0]  io_op,
  output [15:0] io_out
);
  wire [15:0] _io_out_T_1 = io_ina + io_inb; // @[ALU.scala 22:24]
  wire [15:0] _io_out_T_2 = io_ina & io_inb; // @[ALU.scala 25:24]
  wire [15:0] _io_out_T_3 = ~io_ina; // @[ALU.scala 28:17]
  wire [15:0] _GEN_1 = 2'h2 == io_op ? _io_out_T_3 : io_ina; // @[ALU.scala 20:18 28:14]
  wire [15:0] _GEN_2 = 2'h1 == io_op ? _io_out_T_2 : _GEN_1; // @[ALU.scala 20:18 25:14]
  assign io_out = 2'h0 == io_op ? _io_out_T_1 : _GEN_2; // @[ALU.scala 20:18 22:14]
endmodule
module Regfile(
  input         clock,
  input         reset,
  input         io_wen,
  input  [2:0]  io_wAddr,
  input  [2:0]  io_r1Addr,
  input  [2:0]  io_r2Addr,
  input  [15:0] io_wData,
  output [15:0] io_r1Data,
  output [15:0] io_r2Data
);
`ifdef RANDOMIZE_REG_INIT
  reg [1023:0] _RAND_0;
  reg [1023:0] _RAND_1;
  reg [1023:0] _RAND_2;
  reg [1023:0] _RAND_3;
  reg [1023:0] _RAND_4;
  reg [1023:0] _RAND_5;
  reg [1023:0] _RAND_6;
  reg [1023:0] _RAND_7;
  reg [1023:0] _RAND_8;
  reg [1023:0] _RAND_9;
`endif // RANDOMIZE_REG_INIT
  reg [1023:0] tenReg_0; // @[Regfile.scala 22:23]
  reg [1023:0] tenReg_1; // @[Regfile.scala 22:23]
  reg [1023:0] tenReg_2; // @[Regfile.scala 22:23]
  reg [1023:0] tenReg_3; // @[Regfile.scala 22:23]
  reg [1023:0] tenReg_4; // @[Regfile.scala 22:23]
  reg [1023:0] tenReg_5; // @[Regfile.scala 22:23]
  reg [1023:0] tenReg_6; // @[Regfile.scala 22:23]
  reg [1023:0] tenReg_7; // @[Regfile.scala 22:23]
  reg [1023:0] tenReg_8; // @[Regfile.scala 22:23]
  reg [1023:0] tenReg_9; // @[Regfile.scala 22:23]
  wire [1023:0] _GEN_1 = 3'h1 == io_r1Addr ? tenReg_1 : tenReg_0; // @[Regfile.scala 24:{13,13}]
  wire [1023:0] _GEN_2 = 3'h2 == io_r1Addr ? tenReg_2 : _GEN_1; // @[Regfile.scala 24:{13,13}]
  wire [1023:0] _GEN_3 = 3'h3 == io_r1Addr ? tenReg_3 : _GEN_2; // @[Regfile.scala 24:{13,13}]
  wire [1023:0] _GEN_4 = 3'h4 == io_r1Addr ? tenReg_4 : _GEN_3; // @[Regfile.scala 24:{13,13}]
  wire [1023:0] _GEN_5 = 3'h5 == io_r1Addr ? tenReg_5 : _GEN_4; // @[Regfile.scala 24:{13,13}]
  wire [1023:0] _GEN_6 = 3'h6 == io_r1Addr ? tenReg_6 : _GEN_5; // @[Regfile.scala 24:{13,13}]
  wire [1023:0] _GEN_7 = 3'h7 == io_r1Addr ? tenReg_7 : _GEN_6; // @[Regfile.scala 24:{13,13}]
  wire [3:0] _GEN_40 = {{1'd0}, io_r1Addr}; // @[Regfile.scala 24:{13,13}]
  wire [1023:0] _GEN_8 = 4'h8 == _GEN_40 ? tenReg_8 : _GEN_7; // @[Regfile.scala 24:{13,13}]
  wire [1023:0] _GEN_9 = 4'h9 == _GEN_40 ? tenReg_9 : _GEN_8; // @[Regfile.scala 24:{13,13}]
  wire [1023:0] _GEN_11 = 3'h1 == io_r2Addr ? tenReg_1 : tenReg_0; // @[Regfile.scala 25:{13,13}]
  wire [1023:0] _GEN_12 = 3'h2 == io_r2Addr ? tenReg_2 : _GEN_11; // @[Regfile.scala 25:{13,13}]
  wire [1023:0] _GEN_13 = 3'h3 == io_r2Addr ? tenReg_3 : _GEN_12; // @[Regfile.scala 25:{13,13}]
  wire [1023:0] _GEN_14 = 3'h4 == io_r2Addr ? tenReg_4 : _GEN_13; // @[Regfile.scala 25:{13,13}]
  wire [1023:0] _GEN_15 = 3'h5 == io_r2Addr ? tenReg_5 : _GEN_14; // @[Regfile.scala 25:{13,13}]
  wire [1023:0] _GEN_16 = 3'h6 == io_r2Addr ? tenReg_6 : _GEN_15; // @[Regfile.scala 25:{13,13}]
  wire [1023:0] _GEN_17 = 3'h7 == io_r2Addr ? tenReg_7 : _GEN_16; // @[Regfile.scala 25:{13,13}]
  wire [3:0] _GEN_42 = {{1'd0}, io_r2Addr}; // @[Regfile.scala 25:{13,13}]
  wire [1023:0] _GEN_18 = 4'h8 == _GEN_42 ? tenReg_8 : _GEN_17; // @[Regfile.scala 25:{13,13}]
  wire [1023:0] _GEN_19 = 4'h9 == _GEN_42 ? tenReg_9 : _GEN_18; // @[Regfile.scala 25:{13,13}]
  wire [1023:0] _tenReg_io_wAddr = {{1008'd0}, io_wData}; // @[Regfile.scala 28:{22,22}]
  wire [3:0] _GEN_44 = {{1'd0}, io_wAddr}; // @[Regfile.scala 28:{22,22} 22:23]
  assign io_r1Data = _GEN_9[15:0]; // @[Regfile.scala 24:13]
  assign io_r2Data = _GEN_19[15:0]; // @[Regfile.scala 25:13]
  always @(posedge clock) begin
    if (reset) begin // @[Regfile.scala 22:23]
      tenReg_0 <= 1024'h0; // @[Regfile.scala 22:23]
    end else if (io_wen) begin // @[Regfile.scala 27:15]
      if (3'h0 == io_wAddr) begin // @[Regfile.scala 28:22]
        tenReg_0 <= _tenReg_io_wAddr; // @[Regfile.scala 28:22]
      end
    end
    if (reset) begin // @[Regfile.scala 22:23]
      tenReg_1 <= 1024'h0; // @[Regfile.scala 22:23]
    end else if (io_wen) begin // @[Regfile.scala 27:15]
      if (3'h1 == io_wAddr) begin // @[Regfile.scala 28:22]
        tenReg_1 <= _tenReg_io_wAddr; // @[Regfile.scala 28:22]
      end
    end
    if (reset) begin // @[Regfile.scala 22:23]
      tenReg_2 <= 1024'h0; // @[Regfile.scala 22:23]
    end else if (io_wen) begin // @[Regfile.scala 27:15]
      if (3'h2 == io_wAddr) begin // @[Regfile.scala 28:22]
        tenReg_2 <= _tenReg_io_wAddr; // @[Regfile.scala 28:22]
      end
    end
    if (reset) begin // @[Regfile.scala 22:23]
      tenReg_3 <= 1024'h0; // @[Regfile.scala 22:23]
    end else if (io_wen) begin // @[Regfile.scala 27:15]
      if (3'h3 == io_wAddr) begin // @[Regfile.scala 28:22]
        tenReg_3 <= _tenReg_io_wAddr; // @[Regfile.scala 28:22]
      end
    end
    if (reset) begin // @[Regfile.scala 22:23]
      tenReg_4 <= 1024'h0; // @[Regfile.scala 22:23]
    end else if (io_wen) begin // @[Regfile.scala 27:15]
      if (3'h4 == io_wAddr) begin // @[Regfile.scala 28:22]
        tenReg_4 <= _tenReg_io_wAddr; // @[Regfile.scala 28:22]
      end
    end
    if (reset) begin // @[Regfile.scala 22:23]
      tenReg_5 <= 1024'h0; // @[Regfile.scala 22:23]
    end else if (io_wen) begin // @[Regfile.scala 27:15]
      if (3'h5 == io_wAddr) begin // @[Regfile.scala 28:22]
        tenReg_5 <= _tenReg_io_wAddr; // @[Regfile.scala 28:22]
      end
    end
    if (reset) begin // @[Regfile.scala 22:23]
      tenReg_6 <= 1024'h0; // @[Regfile.scala 22:23]
    end else if (io_wen) begin // @[Regfile.scala 27:15]
      if (3'h6 == io_wAddr) begin // @[Regfile.scala 28:22]
        tenReg_6 <= _tenReg_io_wAddr; // @[Regfile.scala 28:22]
      end
    end
    if (reset) begin // @[Regfile.scala 22:23]
      tenReg_7 <= 1024'h0; // @[Regfile.scala 22:23]
    end else if (io_wen) begin // @[Regfile.scala 27:15]
      if (3'h7 == io_wAddr) begin // @[Regfile.scala 28:22]
        tenReg_7 <= _tenReg_io_wAddr; // @[Regfile.scala 28:22]
      end
    end
    if (reset) begin // @[Regfile.scala 22:23]
      tenReg_8 <= 1024'h0; // @[Regfile.scala 22:23]
    end else if (io_wen) begin // @[Regfile.scala 27:15]
      if (4'h8 == _GEN_44) begin // @[Regfile.scala 28:22]
        tenReg_8 <= _tenReg_io_wAddr; // @[Regfile.scala 28:22]
      end
    end
    if (reset) begin // @[Regfile.scala 22:23]
      tenReg_9 <= 1024'h0; // @[Regfile.scala 22:23]
    end else if (io_wen) begin // @[Regfile.scala 27:15]
      if (4'h9 == _GEN_44) begin // @[Regfile.scala 28:22]
        tenReg_9 <= _tenReg_io_wAddr; // @[Regfile.scala 28:22]
      end
    end
  end
// Register and memory initialization
`ifdef RANDOMIZE_GARBAGE_ASSIGN
`define RANDOMIZE
`endif
`ifdef RANDOMIZE_INVALID_ASSIGN
`define RANDOMIZE
`endif
`ifdef RANDOMIZE_REG_INIT
`define RANDOMIZE
`endif
`ifdef RANDOMIZE_MEM_INIT
`define RANDOMIZE
`endif
`ifndef RANDOM
`define RANDOM $random
`endif
`ifdef RANDOMIZE_MEM_INIT
  integer initvar;
`endif
`ifndef SYNTHESIS
`ifdef FIRRTL_BEFORE_INITIAL
`FIRRTL_BEFORE_INITIAL
`endif
initial begin
  `ifdef RANDOMIZE
    `ifdef INIT_RANDOM
      `INIT_RANDOM
    `endif
    `ifndef VERILATOR
      `ifdef RANDOMIZE_DELAY
        #`RANDOMIZE_DELAY begin end
      `else
        #0.002 begin end
      `endif
    `endif
`ifdef RANDOMIZE_REG_INIT
  _RAND_0 = {32{`RANDOM}};
  tenReg_0 = _RAND_0[1023:0];
  _RAND_1 = {32{`RANDOM}};
  tenReg_1 = _RAND_1[1023:0];
  _RAND_2 = {32{`RANDOM}};
  tenReg_2 = _RAND_2[1023:0];
  _RAND_3 = {32{`RANDOM}};
  tenReg_3 = _RAND_3[1023:0];
  _RAND_4 = {32{`RANDOM}};
  tenReg_4 = _RAND_4[1023:0];
  _RAND_5 = {32{`RANDOM}};
  tenReg_5 = _RAND_5[1023:0];
  _RAND_6 = {32{`RANDOM}};
  tenReg_6 = _RAND_6[1023:0];
  _RAND_7 = {32{`RANDOM}};
  tenReg_7 = _RAND_7[1023:0];
  _RAND_8 = {32{`RANDOM}};
  tenReg_8 = _RAND_8[1023:0];
  _RAND_9 = {32{`RANDOM}};
  tenReg_9 = _RAND_9[1023:0];
`endif // RANDOMIZE_REG_INIT
  `endif // RANDOMIZE
end // initial
`ifdef FIRRTL_AFTER_INITIAL
`FIRRTL_AFTER_INITIAL
`endif
`endif // SYNTHESIS
endmodule
module IOMap(
  input  [15:0] io_mar,
  input         io_mio_en,
  input         io_r_w,
  output        io_r_kbsr,
  output        io_r_kbdr,
  output        io_r_dsr,
  output        io_r_mem,
  output        io_w_kbsr,
  output        io_w_dsr,
  output        io_w_ddr
);
  wire  is_fe00 = io_mar == 16'hfe00; // @[DataPath.scala 41:24]
  wire  is_fe02 = io_mar == 16'hfe02; // @[DataPath.scala 42:24]
  wire  is_fe04 = io_mar == 16'hfe04; // @[DataPath.scala 43:24]
  wire  is_fe06 = io_mar == 16'hfe06; // @[DataPath.scala 44:24]
  wire  is_mem = io_mar < 16'hfe00; // @[DataPath.scala 45:25]
  wire  _io_r_kbsr_T = is_fe00 & io_mio_en; // @[DataPath.scala 48:24]
  wire  _io_r_kbsr_T_1 = ~io_r_w; // @[DataPath.scala 48:40]
  wire  _io_r_dsr_T = is_fe04 & io_mio_en; // @[DataPath.scala 50:24]
  assign io_r_kbsr = is_fe00 & io_mio_en & ~io_r_w; // @[DataPath.scala 48:37]
  assign io_r_kbdr = is_fe02 & io_mio_en & _io_r_kbsr_T_1; // @[DataPath.scala 49:37]
  assign io_r_dsr = is_fe04 & io_mio_en & _io_r_kbsr_T_1; // @[DataPath.scala 50:37]
  assign io_r_mem = io_mio_en & _io_r_kbsr_T_1 & is_mem; // @[DataPath.scala 51:37]
  assign io_w_kbsr = _io_r_kbsr_T & io_r_w; // @[DataPath.scala 54:37]
  assign io_w_dsr = _io_r_dsr_T & io_r_w; // @[DataPath.scala 55:37]
  assign io_w_ddr = is_fe06 & io_mio_en & io_r_w; // @[DataPath.scala 56:37]
endmodule
module DataPath(
  input         clock,
  input         reset,
  input         io_signal_LD_MAR,
  input         io_signal_LD_MDR,
  input         io_signal_LD_IR,
  input         io_signal_LD_BEN,
  input         io_signal_LD_REG,
  input         io_signal_LD_CC,
  input         io_signal_LD_PC,
  input         io_signal_LD_PRIV,
  input         io_signal_LD_SAVEDSSP,
  input         io_signal_LD_SAVEDUSP,
  input         io_signal_LD_VECTOR,
  input         io_signal_GATE_PC,
  input         io_signal_GATE_MDR,
  input         io_signal_GATE_ALU,
  input         io_signal_GATE_MARMUX,
  input         io_signal_GATE_VECTOR,
  input         io_signal_GATE_PC1,
  input         io_signal_GATE_PSR,
  input         io_signal_GATE_SP,
  input  [1:0]  io_signal_PC_MUX,
  input  [1:0]  io_signal_DR_MUX,
  input  [1:0]  io_signal_SR1_MUX,
  input         io_signal_ADDR1_MUX,
  input  [1:0]  io_signal_ADDR2_MUX,
  input  [1:0]  io_signal_SP_MUX,
  input         io_signal_MAR_MUX,
  input  [1:0]  io_signal_VECTOR_MUX,
  input         io_signal_PSR_MUX,
  input  [1:0]  io_signal_ALUK,
  input         io_signal_MIO_EN,
  input         io_signal_R_W,
  input         io_signal_SET_PRIV,
  output [15:0] io_mem_raddr,
  input  [15:0] io_mem_rdata,
  output [15:0] io_mem_waddr,
  output [15:0] io_mem_wdata,
  output        io_mem_wen,
  input         io_mem_R,
  output        io_mem_mio_en,
  output [9:0]  io_out_sig,
  output        io_out_int,
  output        io_out_r,
  output [4:0]  io_out_ir,
  output        io_out_ben,
  output        io_out_psr,
  input         io_initPC_valid,
  input  [15:0] io_initPC_bits,
  output        io_uartRx_ready,
  input         io_uartRx_valid,
  input  [7:0]  io_uartRx_bits,
  input         io_uartTx_ready,
  output        io_uartTx_valid,
  output [7:0]  io_uartTx_bits,
  output        io_end
);
`ifdef RANDOMIZE_REG_INIT
  reg [63:0] _RAND_0;
  reg [31:0] _RAND_1;
  reg [31:0] _RAND_2;
  reg [31:0] _RAND_3;
  reg [31:0] _RAND_4;
  reg [31:0] _RAND_5;
  reg [31:0] _RAND_6;
  reg [31:0] _RAND_7;
  reg [31:0] _RAND_8;
  reg [31:0] _RAND_9;
  reg [31:0] _RAND_10;
  reg [31:0] _RAND_11;
  reg [31:0] _RAND_12;
  reg [31:0] _RAND_13;
  reg [31:0] _RAND_14;
  reg [31:0] _RAND_15;
  reg [31:0] _RAND_16;
  reg [31:0] _RAND_17;
  reg [31:0] _RAND_18;
`endif // RANDOMIZE_REG_INIT
  wire [15:0] alu_io_ina; // @[DataPath.scala 183:19]
  wire [15:0] alu_io_inb; // @[DataPath.scala 183:19]
  wire [1:0] alu_io_op; // @[DataPath.scala 183:19]
  wire [15:0] alu_io_out; // @[DataPath.scala 183:19]
  wire  regfile_clock; // @[DataPath.scala 191:23]
  wire  regfile_reset; // @[DataPath.scala 191:23]
  wire  regfile_io_wen; // @[DataPath.scala 191:23]
  wire [2:0] regfile_io_wAddr; // @[DataPath.scala 191:23]
  wire [2:0] regfile_io_r1Addr; // @[DataPath.scala 191:23]
  wire [2:0] regfile_io_r2Addr; // @[DataPath.scala 191:23]
  wire [15:0] regfile_io_wData; // @[DataPath.scala 191:23]
  wire [15:0] regfile_io_r1Data; // @[DataPath.scala 191:23]
  wire [15:0] regfile_io_r2Data; // @[DataPath.scala 191:23]
  wire [15:0] iomap_io_mar; // @[DataPath.scala 206:21]
  wire  iomap_io_mio_en; // @[DataPath.scala 206:21]
  wire  iomap_io_r_w; // @[DataPath.scala 206:21]
  wire  iomap_io_r_kbsr; // @[DataPath.scala 206:21]
  wire  iomap_io_r_kbdr; // @[DataPath.scala 206:21]
  wire  iomap_io_r_dsr; // @[DataPath.scala 206:21]
  wire  iomap_io_r_mem; // @[DataPath.scala 206:21]
  wire  iomap_io_w_kbsr; // @[DataPath.scala 206:21]
  wire  iomap_io_w_dsr; // @[DataPath.scala 206:21]
  wire  iomap_io_w_ddr; // @[DataPath.scala 206:21]
  reg [63:0] time_; // @[utils.scala 23:20]
  wire [63:0] _time_c_T_1 = time_ + 64'h1; // @[utils.scala 24:12]
  reg [15:0] PC; // @[DataPath.scala 80:20]
  reg [15:0] RESET_PC; // @[DataPath.scala 81:26]
  reg [15:0] IR; // @[DataPath.scala 86:20]
  reg [15:0] MAR; // @[DataPath.scala 87:20]
  reg [15:0] MDR; // @[DataPath.scala 88:20]
  reg [15:0] KBDR; // @[DataPath.scala 91:21]
  reg [15:0] KBSR; // @[DataPath.scala 92:21]
  reg [15:0] DDR; // @[DataPath.scala 93:21]
  reg [15:0] DSR; // @[DataPath.scala 94:21]
  reg  BEN; // @[DataPath.scala 96:20]
  reg  N; // @[DataPath.scala 97:18]
  reg  P; // @[DataPath.scala 98:18]
  reg  Z; // @[DataPath.scala 99:18]
  wire  offset5_signBit = IR[4]; // @[utils.scala 9:20]
  wire [10:0] _offset5_T_2 = offset5_signBit ? 11'h7ff : 11'h0; // @[Bitwise.scala 74:12]
  wire [15:0] offset5 = {_offset5_T_2,IR[4:0]}; // @[Cat.scala 31:58]
  wire  offset6_signBit = IR[5]; // @[utils.scala 9:20]
  wire [9:0] _offset6_T_2 = offset6_signBit ? 10'h3ff : 10'h0; // @[Bitwise.scala 74:12]
  wire [15:0] offset6 = {_offset6_T_2,IR[5:0]}; // @[Cat.scala 31:58]
  wire  offset9_signBit = IR[8]; // @[utils.scala 9:20]
  wire [6:0] _offset9_T_2 = offset9_signBit ? 7'h7f : 7'h0; // @[Bitwise.scala 74:12]
  wire [15:0] offset9 = {_offset9_T_2,IR[8:0]}; // @[Cat.scala 31:58]
  wire  offset11_signBit = IR[10]; // @[utils.scala 9:20]
  wire [4:0] _offset11_T_2 = offset11_signBit ? 5'h1f : 5'h0; // @[Bitwise.scala 74:12]
  wire [15:0] offset11 = {_offset11_T_2,IR[10:0]}; // @[Cat.scala 31:58]
  wire [15:0] offset8 = {8'h0,IR[7:0]}; // @[Cat.scala 31:58]
  wire [15:0] r1Data = regfile_io_r1Data;
  wire [15:0] ADDR1MUX = io_signal_ADDR1_MUX ? r1Data : PC; // @[DataPath.scala 127:18]
  wire [15:0] _ADDR2MUX_T_1 = 2'h1 == io_signal_ADDR2_MUX ? offset6 : 16'h0; // @[Mux.scala 81:58]
  wire [15:0] _ADDR2MUX_T_3 = 2'h2 == io_signal_ADDR2_MUX ? offset9 : _ADDR2MUX_T_1; // @[Mux.scala 81:58]
  wire [15:0] ADDR2MUX = 2'h3 == io_signal_ADDR2_MUX ? offset11 : _ADDR2MUX_T_3; // @[Mux.scala 81:58]
  wire [15:0] addrOut = ADDR1MUX + ADDR2MUX; // @[DataPath.scala 136:23]
  wire [15:0] _PCMUX_T_2 = PC + 16'h1; // @[DataPath.scala 139:40]
  wire [15:0] _PCMUX_T_3 = PC == 16'h0 ? RESET_PC : _PCMUX_T_2; // @[DataPath.scala 139:15]
  wire [15:0] _PCMUX_T_5 = 2'h0 == io_signal_PC_MUX ? _PCMUX_T_3 : RESET_PC; // @[Mux.scala 81:58]
  reg [15:0] savedUSP; // @[DataPath.scala 162:25]
  reg [15:0] savedSSP; // @[DataPath.scala 161:25]
  wire [15:0] _SPMUX_T_5 = r1Data - 16'h1; // @[DataPath.scala 167:20]
  wire [15:0] _SPMUX_T_3 = r1Data + 16'h1; // @[DataPath.scala 166:20]
  wire [15:0] _SPMUX_T_7 = 2'h1 == io_signal_SP_MUX ? _SPMUX_T_5 : _SPMUX_T_3; // @[Mux.scala 81:58]
  wire [15:0] _SPMUX_T_9 = 2'h2 == io_signal_SP_MUX ? savedSSP : _SPMUX_T_7; // @[Mux.scala 81:58]
  wire [15:0] SPMUX = 2'h3 == io_signal_SP_MUX ? savedUSP : _SPMUX_T_9; // @[Mux.scala 81:58]
  wire [15:0] _GATEOUT_T_1 = PC - 16'h1; // @[DataPath.scala 263:40]
  wire [15:0] MARMUX = io_signal_MAR_MUX ? addrOut : offset8; // @[DataPath.scala 172:16]
  wire [15:0] aluOut = alu_io_out; // @[DataPath.scala 113:23 187:10]
  wire [15:0] _GEN_5 = io_signal_GATE_MDR ? MDR : PC; // @[DataPath.scala 259:{25,34}]
  wire [15:0] _GEN_6 = io_signal_GATE_ALU ? aluOut : _GEN_5; // @[DataPath.scala 260:{25,34}]
  wire [15:0] _GEN_7 = io_signal_GATE_MARMUX ? MARMUX : _GEN_6; // @[DataPath.scala 261:{25,34}]
  wire [15:0] _GEN_8 = io_signal_GATE_VECTOR ? 16'h0 : _GEN_7; // @[DataPath.scala 262:{25,34}]
  wire [15:0] _GEN_9 = io_signal_GATE_PC1 ? _GATEOUT_T_1 : _GEN_8; // @[DataPath.scala 263:{25,34}]
  wire [15:0] _GEN_10 = io_signal_GATE_PSR ? 16'h0 : _GEN_9; // @[DataPath.scala 264:{25,34}]
  wire [15:0] GATEOUT = io_signal_GATE_SP ? SPMUX : _GEN_10; // @[DataPath.scala 265:{25,34}]
  wire [2:0] _DRMUX_T_3 = 2'h0 == io_signal_DR_MUX ? IR[11:9] : IR[11:9]; // @[Mux.scala 81:58]
  wire [2:0] _DRMUX_T_5 = 2'h1 == io_signal_DR_MUX ? 3'h7 : _DRMUX_T_3; // @[Mux.scala 81:58]
  wire [2:0] _DRMUX_T_7 = 2'h2 == io_signal_DR_MUX ? 3'h6 : _DRMUX_T_5; // @[Mux.scala 81:58]
  wire [2:0] _SR1MUX_T_4 = 2'h0 == io_signal_SR1_MUX ? IR[11:9] : IR[11:9]; // @[Mux.scala 81:58]
  wire [2:0] _SR1MUX_T_6 = 2'h1 == io_signal_SR1_MUX ? IR[8:6] : _SR1MUX_T_4; // @[Mux.scala 81:58]
  wire [2:0] _SR1MUX_T_8 = 2'h2 == io_signal_SR1_MUX ? 3'h6 : _SR1MUX_T_6; // @[Mux.scala 81:58]
  wire [15:0] r2Data = regfile_io_r2Data;
  wire [15:0] _IN_MUX_T = iomap_io_r_mem ? io_mem_rdata : {{15'd0}, iomap_io_r_mem}; // @[Mux.scala 101:16]
  wire [15:0] _IN_MUX_T_1 = iomap_io_r_dsr ? DSR : _IN_MUX_T; // @[Mux.scala 101:16]
  wire [15:0] _IN_MUX_T_2 = iomap_io_r_kbdr ? KBDR : _IN_MUX_T_1; // @[Mux.scala 101:16]
  wire  _T = io_uartRx_ready & io_uartRx_valid; // @[Decoupled.scala 50:35]
  wire [15:0] _KBDR_T = {8'h0,io_uartRx_bits}; // @[Cat.scala 31:58]
  wire [15:0] _DSR_T = {io_uartTx_ready,15'h0}; // @[Cat.scala 31:58]
  reg  io_uartTx_valid_REG; // @[DataPath.scala 246:29]
  wire [15:0] dstData = regfile_io_wData;
  wire  _Z_T = |dstData; // @[DataPath.scala 279:22]
  wire  _GEN_18 = io_signal_LD_CC ? ~(|dstData) : Z; // @[DataPath.scala 277:19 279:7 99:18]
  reg [15:0] PRE_IR; // @[DataPath.scala 301:23]
  reg  END; // @[DataPath.scala 302:20]
  wire  _GEN_25 = IR == 16'h0 & PRE_IR != 16'h0 | END; // @[DataPath.scala 302:20 304:38 305:9]
  wire [15:0] DRMUX = {{13'd0}, _DRMUX_T_7}; // @[DataPath.scala 105:23 146:9]
  wire [15:0] SR1MUX = {{13'd0}, _SR1MUX_T_8}; // @[DataPath.scala 106:23 152:10]
  ALU alu ( // @[DataPath.scala 183:19]
    .io_ina(alu_io_ina),
    .io_inb(alu_io_inb),
    .io_op(alu_io_op),
    .io_out(alu_io_out)
  );
  Regfile regfile ( // @[DataPath.scala 191:23]
    .clock(regfile_clock),
    .reset(regfile_reset),
    .io_wen(regfile_io_wen),
    .io_wAddr(regfile_io_wAddr),
    .io_r1Addr(regfile_io_r1Addr),
    .io_r2Addr(regfile_io_r2Addr),
    .io_wData(regfile_io_wData),
    .io_r1Data(regfile_io_r1Data),
    .io_r2Data(regfile_io_r2Data)
  );
  IOMap iomap ( // @[DataPath.scala 206:21]
    .io_mar(iomap_io_mar),
    .io_mio_en(iomap_io_mio_en),
    .io_r_w(iomap_io_r_w),
    .io_r_kbsr(iomap_io_r_kbsr),
    .io_r_kbdr(iomap_io_r_kbdr),
    .io_r_dsr(iomap_io_r_dsr),
    .io_r_mem(iomap_io_r_mem),
    .io_w_kbsr(iomap_io_w_kbsr),
    .io_w_dsr(iomap_io_w_dsr),
    .io_w_ddr(iomap_io_w_ddr)
  );
  assign io_mem_raddr = MAR; // @[DataPath.scala 249:18]
  assign io_mem_waddr = MAR; // @[DataPath.scala 250:18]
  assign io_mem_wdata = MDR; // @[DataPath.scala 251:17]
  assign io_mem_wen = io_signal_MIO_EN & io_signal_R_W; // @[DataPath.scala 252:31]
  assign io_mem_mio_en = io_signal_MIO_EN; // @[DataPath.scala 253:17]
  assign io_out_sig = 10'h0;
  assign io_out_int = 1'h0; // @[DataPath.scala 294:15]
  assign io_out_r = io_mem_R; // @[DataPath.scala 295:15]
  assign io_out_ir = IR[15:11]; // @[DataPath.scala 296:20]
  assign io_out_ben = BEN; // @[DataPath.scala 297:15]
  assign io_out_psr = 1'h0; // @[DataPath.scala 298:21]
  assign io_uartRx_ready = ~KBSR[15]; // @[DataPath.scala 230:22]
  assign io_uartTx_valid = io_uartTx_valid_REG; // @[DataPath.scala 246:19]
  assign io_uartTx_bits = DDR[7:0]; // @[DataPath.scala 247:25]
  assign io_end = END; // @[DataPath.scala 303:10]
  assign alu_io_ina = regfile_io_r1Data; // @[DataPath.scala 184:14]
  assign alu_io_inb = IR[5] ? offset5 : r2Data; // @[DataPath.scala 158:16]
  assign alu_io_op = io_signal_ALUK; // @[DataPath.scala 186:13]
  assign regfile_clock = clock;
  assign regfile_reset = reset;
  assign regfile_io_wen = io_signal_LD_REG; // @[DataPath.scala 192:18]
  assign regfile_io_wAddr = DRMUX[2:0]; // @[DataPath.scala 193:20]
  assign regfile_io_r1Addr = SR1MUX[2:0]; // @[DataPath.scala 194:21]
  assign regfile_io_r2Addr = IR[2:0]; // @[DataPath.scala 195:26]
  assign regfile_io_wData = io_signal_GATE_SP ? SPMUX : _GEN_10; // @[DataPath.scala 265:{25,34}]
  assign iomap_io_mar = MAR; // @[DataPath.scala 207:16]
  assign iomap_io_mio_en = io_signal_MIO_EN; // @[DataPath.scala 208:19]
  assign iomap_io_r_w = io_signal_R_W; // @[DataPath.scala 209:16]
  always @(posedge clock) begin
    if (reset) begin // @[utils.scala 23:20]
      time_ <= 64'h0; // @[utils.scala 23:20]
    end else begin
      time_ <= _time_c_T_1; // @[utils.scala 24:7]
    end
    if (reset) begin // @[DataPath.scala 80:20]
      PC <= 16'h3000; // @[DataPath.scala 80:20]
    end else if (io_signal_LD_PC | time_ == 64'h0) begin // @[DataPath.scala 275:36]
      if (2'h2 == io_signal_PC_MUX) begin // @[Mux.scala 81:58]
        PC <= addrOut;
      end else if (2'h1 == io_signal_PC_MUX) begin // @[Mux.scala 81:58]
        PC <= GATEOUT;
      end else begin
        PC <= _PCMUX_T_5;
      end
    end else if (io_initPC_valid) begin // @[DataPath.scala 82:25]
      PC <= io_initPC_bits; // @[DataPath.scala 83:8]
    end
    if (reset) begin // @[DataPath.scala 81:26]
      RESET_PC <= 16'h3000; // @[DataPath.scala 81:26]
    end else if (io_initPC_valid) begin // @[DataPath.scala 82:25]
      RESET_PC <= io_initPC_bits; // @[DataPath.scala 84:14]
    end
    if (reset) begin // @[DataPath.scala 86:20]
      IR <= 16'h0; // @[DataPath.scala 86:20]
    end else if (io_signal_LD_IR) begin // @[DataPath.scala 273:20]
      IR <= MDR; // @[DataPath.scala 273:26]
    end
    if (reset) begin // @[DataPath.scala 87:20]
      MAR <= 16'h0; // @[DataPath.scala 87:20]
    end else if (io_signal_LD_MAR) begin // @[DataPath.scala 270:20]
      if (io_signal_GATE_SP) begin // @[DataPath.scala 265:25]
        if (2'h3 == io_signal_SP_MUX) begin // @[Mux.scala 81:58]
          MAR <= savedUSP;
        end else begin
          MAR <= _SPMUX_T_9;
        end
      end else if (io_signal_GATE_PSR) begin // @[DataPath.scala 264:25]
        MAR <= 16'h0; // @[DataPath.scala 264:34]
      end else begin
        MAR <= _GEN_9;
      end
    end
    if (reset) begin // @[DataPath.scala 88:20]
      MDR <= 16'h0; // @[DataPath.scala 88:20]
    end else if (io_signal_LD_MDR) begin // @[DataPath.scala 271:20]
      if (io_signal_MIO_EN) begin // @[DataPath.scala 271:32]
        if (iomap_io_r_kbsr) begin // @[Mux.scala 101:16]
          MDR <= KBSR;
        end else begin
          MDR <= _IN_MUX_T_2;
        end
      end else if (io_signal_GATE_SP) begin // @[DataPath.scala 265:25]
        MDR <= SPMUX; // @[DataPath.scala 265:34]
      end else begin
        MDR <= _GEN_10;
      end
    end
    if (reset) begin // @[DataPath.scala 91:21]
      KBDR <= 16'h0; // @[DataPath.scala 91:21]
    end else if (_T) begin // @[DataPath.scala 231:24]
      KBDR <= _KBDR_T; // @[DataPath.scala 232:10]
    end
    if (reset) begin // @[DataPath.scala 92:21]
      KBSR <= 16'h0; // @[DataPath.scala 92:21]
    end else if (iomap_io_w_kbsr) begin // @[DataPath.scala 287:17]
      KBSR <= MDR; // @[DataPath.scala 287:24]
    end else if (_T) begin // @[DataPath.scala 231:24]
      KBSR <= 16'h8000; // @[DataPath.scala 233:10]
    end
    if (reset) begin // @[DataPath.scala 93:21]
      DDR <= 16'h0; // @[DataPath.scala 93:21]
    end else if (iomap_io_w_ddr) begin // @[DataPath.scala 289:17]
      DDR <= MDR; // @[DataPath.scala 289:24]
    end
    if (reset) begin // @[DataPath.scala 94:21]
      DSR <= 16'h0; // @[DataPath.scala 94:21]
    end else if (iomap_io_w_dsr) begin // @[DataPath.scala 288:17]
      DSR <= MDR; // @[DataPath.scala 288:24]
    end else begin
      DSR <= _DSR_T; // @[DataPath.scala 245:7]
    end
    if (reset) begin // @[DataPath.scala 96:20]
      BEN <= 1'h0; // @[DataPath.scala 96:20]
    end else if (io_signal_LD_BEN) begin // @[DataPath.scala 274:20]
      BEN <= IR[11] & N | IR[10] & Z | IR[9] & P; // @[DataPath.scala 274:26]
    end
    if (reset) begin // @[DataPath.scala 97:18]
      N <= 1'h0; // @[DataPath.scala 97:18]
    end else if (io_signal_LD_CC) begin // @[DataPath.scala 277:19]
      N <= dstData[15]; // @[DataPath.scala 278:7]
    end
    if (reset) begin // @[DataPath.scala 98:18]
      P <= 1'h0; // @[DataPath.scala 98:18]
    end else if (io_signal_LD_CC) begin // @[DataPath.scala 277:19]
      P <= ~dstData[15] & _Z_T; // @[DataPath.scala 280:7]
    end
    Z <= reset | _GEN_18; // @[DataPath.scala 99:{18,18}]
    if (reset) begin // @[DataPath.scala 162:25]
      savedUSP <= 16'h0; // @[DataPath.scala 162:25]
    end else if (io_signal_LD_SAVEDUSP) begin // @[DataPath.scala 285:25]
      savedUSP <= r1Data; // @[DataPath.scala 285:36]
    end
    if (reset) begin // @[DataPath.scala 161:25]
      savedSSP <= 16'h0; // @[DataPath.scala 161:25]
    end else if (io_signal_LD_SAVEDSSP) begin // @[DataPath.scala 284:25]
      savedSSP <= r1Data; // @[DataPath.scala 284:36]
    end
    io_uartTx_valid_REG <= iomap_io_w_ddr; // @[DataPath.scala 246:29]
    PRE_IR <= IR; // @[DataPath.scala 301:23]
    if (reset) begin // @[DataPath.scala 302:20]
      END <= 1'h0; // @[DataPath.scala 302:20]
    end else begin
      END <= _GEN_25;
    end
  end
// Register and memory initialization
`ifdef RANDOMIZE_GARBAGE_ASSIGN
`define RANDOMIZE
`endif
`ifdef RANDOMIZE_INVALID_ASSIGN
`define RANDOMIZE
`endif
`ifdef RANDOMIZE_REG_INIT
`define RANDOMIZE
`endif
`ifdef RANDOMIZE_MEM_INIT
`define RANDOMIZE
`endif
`ifndef RANDOM
`define RANDOM $random
`endif
`ifdef RANDOMIZE_MEM_INIT
  integer initvar;
`endif
`ifndef SYNTHESIS
`ifdef FIRRTL_BEFORE_INITIAL
`FIRRTL_BEFORE_INITIAL
`endif
initial begin
  `ifdef RANDOMIZE
    `ifdef INIT_RANDOM
      `INIT_RANDOM
    `endif
    `ifndef VERILATOR
      `ifdef RANDOMIZE_DELAY
        #`RANDOMIZE_DELAY begin end
      `else
        #0.002 begin end
      `endif
    `endif
`ifdef RANDOMIZE_REG_INIT
  _RAND_0 = {2{`RANDOM}};
  time_ = _RAND_0[63:0];
  _RAND_1 = {1{`RANDOM}};
  PC = _RAND_1[15:0];
  _RAND_2 = {1{`RANDOM}};
  RESET_PC = _RAND_2[15:0];
  _RAND_3 = {1{`RANDOM}};
  IR = _RAND_3[15:0];
  _RAND_4 = {1{`RANDOM}};
  MAR = _RAND_4[15:0];
  _RAND_5 = {1{`RANDOM}};
  MDR = _RAND_5[15:0];
  _RAND_6 = {1{`RANDOM}};
  KBDR = _RAND_6[15:0];
  _RAND_7 = {1{`RANDOM}};
  KBSR = _RAND_7[15:0];
  _RAND_8 = {1{`RANDOM}};
  DDR = _RAND_8[15:0];
  _RAND_9 = {1{`RANDOM}};
  DSR = _RAND_9[15:0];
  _RAND_10 = {1{`RANDOM}};
  BEN = _RAND_10[0:0];
  _RAND_11 = {1{`RANDOM}};
  N = _RAND_11[0:0];
  _RAND_12 = {1{`RANDOM}};
  P = _RAND_12[0:0];
  _RAND_13 = {1{`RANDOM}};
  Z = _RAND_13[0:0];
  _RAND_14 = {1{`RANDOM}};
  savedUSP = _RAND_14[15:0];
  _RAND_15 = {1{`RANDOM}};
  savedSSP = _RAND_15[15:0];
  _RAND_16 = {1{`RANDOM}};
  io_uartTx_valid_REG = _RAND_16[0:0];
  _RAND_17 = {1{`RANDOM}};
  PRE_IR = _RAND_17[15:0];
  _RAND_18 = {1{`RANDOM}};
  END = _RAND_18[0:0];
`endif // RANDOMIZE_REG_INIT
  `endif // RANDOMIZE
end // initial
`ifdef FIRRTL_AFTER_INITIAL
`FIRRTL_AFTER_INITIAL
`endif
`endif // SYNTHESIS
endmodule
module Memory(
  input         clock,
  input  [15:0] io_raddr,
  output [15:0] io_rdata,
  input  [15:0] io_waddr,
  input  [15:0] io_wdata,
  input         io_wen,
  output        io_R,
  input         io_mio_en
);
`ifdef RANDOMIZE_REG_INIT
  reg [31:0] _RAND_0;
`endif // RANDOMIZE_REG_INIT
  wire  mem_clka; // @[Memory.scala 66:23]
  wire  mem_wea; // @[Memory.scala 66:23]
  wire [15:0] mem_addra; // @[Memory.scala 66:23]
  wire [15:0] mem_dina; // @[Memory.scala 66:23]
  wire  mem_clkb; // @[Memory.scala 66:23]
  wire [15:0] mem_addrb; // @[Memory.scala 66:23]
  wire [15:0] mem_doutb; // @[Memory.scala 66:23]
  reg  io_R_REG; // @[Memory.scala 93:18]
  dual_mem mem ( // @[Memory.scala 66:23]
    .clka(mem_clka),
    .wea(mem_wea),
    .addra(mem_addra),
    .dina(mem_dina),
    .clkb(mem_clkb),
    .addrb(mem_addrb),
    .doutb(mem_doutb)
  );
  assign io_rdata = mem_doutb; // @[Memory.scala 73:21]
  assign io_R = io_R_REG; // @[Memory.scala 93:8]
  assign mem_clka = clock; // @[Memory.scala 67:21]
  assign mem_wea = io_wen; // @[Memory.scala 68:21]
  assign mem_addra = io_waddr; // @[Memory.scala 69:21]
  assign mem_dina = io_wdata; // @[Memory.scala 70:21]
  assign mem_clkb = clock; // @[Memory.scala 71:21]
  assign mem_addrb = io_raddr; // @[Memory.scala 72:21]
  always @(posedge clock) begin
    io_R_REG <= io_mio_en; // @[Memory.scala 93:18]
  end
// Register and memory initialization
`ifdef RANDOMIZE_GARBAGE_ASSIGN
`define RANDOMIZE
`endif
`ifdef RANDOMIZE_INVALID_ASSIGN
`define RANDOMIZE
`endif
`ifdef RANDOMIZE_REG_INIT
`define RANDOMIZE
`endif
`ifdef RANDOMIZE_MEM_INIT
`define RANDOMIZE
`endif
`ifndef RANDOM
`define RANDOM $random
`endif
`ifdef RANDOMIZE_MEM_INIT
  integer initvar;
`endif
`ifndef SYNTHESIS
`ifdef FIRRTL_BEFORE_INITIAL
`FIRRTL_BEFORE_INITIAL
`endif
initial begin
  `ifdef RANDOMIZE
    `ifdef INIT_RANDOM
      `INIT_RANDOM
    `endif
    `ifndef VERILATOR
      `ifdef RANDOMIZE_DELAY
        #`RANDOMIZE_DELAY begin end
      `else
        #0.002 begin end
      `endif
    `endif
`ifdef RANDOMIZE_REG_INIT
  _RAND_0 = {1{`RANDOM}};
  io_R_REG = _RAND_0[0:0];
`endif // RANDOMIZE_REG_INIT
  `endif // RANDOMIZE
end // initial
`ifdef FIRRTL_AFTER_INITIAL
`FIRRTL_AFTER_INITIAL
`endif
`endif // SYNTHESIS
endmodule
module UartRX(
  input        clock,
  input        reset,
  input        io_rxd,
  input        io_channel_ready,
  output       io_channel_valid,
  output [7:0] io_channel_bits
);
`ifdef RANDOMIZE_REG_INIT
  reg [31:0] _RAND_0;
  reg [31:0] _RAND_1;
  reg [31:0] _RAND_2;
  reg [31:0] _RAND_3;
  reg [31:0] _RAND_4;
  reg [31:0] _RAND_5;
`endif // RANDOMIZE_REG_INIT
  wire [8:0] BIT_CNT = 9'h1b2 - 9'h1; // @[Uart.scala 95:40]
  reg  rxReg_REG; // @[Uart.scala 99:30]
  reg  rxReg; // @[Uart.scala 99:22]
  reg [7:0] shiftReg; // @[Uart.scala 101:25]
  reg [19:0] cntReg; // @[Uart.scala 102:23]
  reg [3:0] bitsReg; // @[Uart.scala 103:24]
  reg  valReg; // @[Uart.scala 104:23]
  wire [19:0] _cntReg_T_1 = cntReg - 20'h1; // @[Uart.scala 107:22]
  wire [7:0] _shiftReg_T_1 = {rxReg,shiftReg[7:1]}; // @[Cat.scala 31:58]
  wire [3:0] _bitsReg_T_1 = bitsReg - 4'h1; // @[Uart.scala 111:24]
  wire  _GEN_0 = bitsReg == 4'h1 | valReg; // @[Uart.scala 113:27 114:14 104:23]
  assign io_channel_valid = valReg; // @[Uart.scala 126:20]
  assign io_channel_bits = shiftReg; // @[Uart.scala 125:19]
  always @(posedge clock) begin
    rxReg_REG <= reset | io_rxd; // @[Uart.scala 99:{30,30,30}]
    rxReg <= reset | rxReg_REG; // @[Uart.scala 99:{22,22,22}]
    if (reset) begin // @[Uart.scala 101:25]
      shiftReg <= 8'h0; // @[Uart.scala 101:25]
    end else if (!(cntReg != 20'h0)) begin // @[Uart.scala 106:24]
      if (bitsReg != 4'h0) begin // @[Uart.scala 108:31]
        shiftReg <= _shiftReg_T_1; // @[Uart.scala 110:14]
      end
    end
    if (reset) begin // @[Uart.scala 102:23]
      cntReg <= 20'h0; // @[Uart.scala 102:23]
    end else if (cntReg != 20'h0) begin // @[Uart.scala 106:24]
      cntReg <= _cntReg_T_1; // @[Uart.scala 107:12]
    end else if (bitsReg != 4'h0) begin // @[Uart.scala 108:31]
      cntReg <= {{11'd0}, BIT_CNT}; // @[Uart.scala 109:12]
    end else if (~rxReg) begin // @[Uart.scala 116:29]
      cntReg <= 20'h28b; // @[Uart.scala 117:12]
    end
    if (reset) begin // @[Uart.scala 103:24]
      bitsReg <= 4'h0; // @[Uart.scala 103:24]
    end else if (!(cntReg != 20'h0)) begin // @[Uart.scala 106:24]
      if (bitsReg != 4'h0) begin // @[Uart.scala 108:31]
        bitsReg <= _bitsReg_T_1; // @[Uart.scala 111:13]
      end else if (~rxReg) begin // @[Uart.scala 116:29]
        bitsReg <= 4'h8; // @[Uart.scala 118:13]
      end
    end
    if (reset) begin // @[Uart.scala 104:23]
      valReg <= 1'h0; // @[Uart.scala 104:23]
    end else if (valReg & io_channel_ready) begin // @[Uart.scala 121:36]
      valReg <= 1'h0; // @[Uart.scala 122:12]
    end else if (!(cntReg != 20'h0)) begin // @[Uart.scala 106:24]
      if (bitsReg != 4'h0) begin // @[Uart.scala 108:31]
        valReg <= _GEN_0;
      end
    end
  end
// Register and memory initialization
`ifdef RANDOMIZE_GARBAGE_ASSIGN
`define RANDOMIZE
`endif
`ifdef RANDOMIZE_INVALID_ASSIGN
`define RANDOMIZE
`endif
`ifdef RANDOMIZE_REG_INIT
`define RANDOMIZE
`endif
`ifdef RANDOMIZE_MEM_INIT
`define RANDOMIZE
`endif
`ifndef RANDOM
`define RANDOM $random
`endif
`ifdef RANDOMIZE_MEM_INIT
  integer initvar;
`endif
`ifndef SYNTHESIS
`ifdef FIRRTL_BEFORE_INITIAL
`FIRRTL_BEFORE_INITIAL
`endif
initial begin
  `ifdef RANDOMIZE
    `ifdef INIT_RANDOM
      `INIT_RANDOM
    `endif
    `ifndef VERILATOR
      `ifdef RANDOMIZE_DELAY
        #`RANDOMIZE_DELAY begin end
      `else
        #0.002 begin end
      `endif
    `endif
`ifdef RANDOMIZE_REG_INIT
  _RAND_0 = {1{`RANDOM}};
  rxReg_REG = _RAND_0[0:0];
  _RAND_1 = {1{`RANDOM}};
  rxReg = _RAND_1[0:0];
  _RAND_2 = {1{`RANDOM}};
  shiftReg = _RAND_2[7:0];
  _RAND_3 = {1{`RANDOM}};
  cntReg = _RAND_3[19:0];
  _RAND_4 = {1{`RANDOM}};
  bitsReg = _RAND_4[3:0];
  _RAND_5 = {1{`RANDOM}};
  valReg = _RAND_5[0:0];
`endif // RANDOMIZE_REG_INIT
  `endif // RANDOMIZE
end // initial
`ifdef FIRRTL_AFTER_INITIAL
`FIRRTL_AFTER_INITIAL
`endif
`endif // SYNTHESIS
endmodule
module UartTX(
  input        clock,
  input        reset,
  output       io_txd,
  output       io_channel_ready,
  input        io_channel_valid,
  input  [7:0] io_channel_bits
);
`ifdef RANDOMIZE_REG_INIT
  reg [31:0] _RAND_0;
  reg [31:0] _RAND_1;
  reg [31:0] _RAND_2;
`endif // RANDOMIZE_REG_INIT
  wire [8:0] BIT_CNT = 9'h1b2 - 9'h1; // @[Uart.scala 51:40]
  reg [10:0] shiftReg; // @[Uart.scala 53:25]
  reg [19:0] cntReg; // @[Uart.scala 54:23]
  reg [3:0] bitsReg; // @[Uart.scala 55:24]
  wire  _io_channel_ready_T = cntReg == 20'h0; // @[Uart.scala 57:31]
  wire [9:0] shift = shiftReg[10:1]; // @[Uart.scala 64:28]
  wire [10:0] _shiftReg_T_1 = {1'h1,shift}; // @[Cat.scala 31:58]
  wire [3:0] _bitsReg_T_1 = bitsReg - 4'h1; // @[Uart.scala 66:26]
  wire [10:0] _shiftReg_T_3 = {2'h3,io_channel_bits,1'h0}; // @[Cat.scala 31:58]
  wire [19:0] _cntReg_T_1 = cntReg - 20'h1; // @[Uart.scala 77:22]
  assign io_txd = shiftReg[0]; // @[Uart.scala 58:21]
  assign io_channel_ready = cntReg == 20'h0 & bitsReg == 4'h0; // @[Uart.scala 57:40]
  always @(posedge clock) begin
    if (reset) begin // @[Uart.scala 53:25]
      shiftReg <= 11'h7ff; // @[Uart.scala 53:25]
    end else if (_io_channel_ready_T) begin // @[Uart.scala 60:24]
      if (bitsReg != 4'h0) begin // @[Uart.scala 63:27]
        shiftReg <= _shiftReg_T_1; // @[Uart.scala 65:16]
      end else if (io_channel_valid) begin // @[Uart.scala 68:30]
        shiftReg <= _shiftReg_T_3; // @[Uart.scala 69:18]
      end else begin
        shiftReg <= 11'h7ff; // @[Uart.scala 72:18]
      end
    end
    if (reset) begin // @[Uart.scala 54:23]
      cntReg <= 20'h0; // @[Uart.scala 54:23]
    end else if (_io_channel_ready_T) begin // @[Uart.scala 60:24]
      cntReg <= {{11'd0}, BIT_CNT}; // @[Uart.scala 62:12]
    end else begin
      cntReg <= _cntReg_T_1; // @[Uart.scala 77:12]
    end
    if (reset) begin // @[Uart.scala 55:24]
      bitsReg <= 4'h0; // @[Uart.scala 55:24]
    end else if (_io_channel_ready_T) begin // @[Uart.scala 60:24]
      if (bitsReg != 4'h0) begin // @[Uart.scala 63:27]
        bitsReg <= _bitsReg_T_1; // @[Uart.scala 66:15]
      end else if (io_channel_valid) begin // @[Uart.scala 68:30]
        bitsReg <= 4'hb; // @[Uart.scala 70:17]
      end
    end
  end
// Register and memory initialization
`ifdef RANDOMIZE_GARBAGE_ASSIGN
`define RANDOMIZE
`endif
`ifdef RANDOMIZE_INVALID_ASSIGN
`define RANDOMIZE
`endif
`ifdef RANDOMIZE_REG_INIT
`define RANDOMIZE
`endif
`ifdef RANDOMIZE_MEM_INIT
`define RANDOMIZE
`endif
`ifndef RANDOM
`define RANDOM $random
`endif
`ifdef RANDOMIZE_MEM_INIT
  integer initvar;
`endif
`ifndef SYNTHESIS
`ifdef FIRRTL_BEFORE_INITIAL
`FIRRTL_BEFORE_INITIAL
`endif
initial begin
  `ifdef RANDOMIZE
    `ifdef INIT_RANDOM
      `INIT_RANDOM
    `endif
    `ifndef VERILATOR
      `ifdef RANDOMIZE_DELAY
        #`RANDOMIZE_DELAY begin end
      `else
        #0.002 begin end
      `endif
    `endif
`ifdef RANDOMIZE_REG_INIT
  _RAND_0 = {1{`RANDOM}};
  shiftReg = _RAND_0[10:0];
  _RAND_1 = {1{`RANDOM}};
  cntReg = _RAND_1[19:0];
  _RAND_2 = {1{`RANDOM}};
  bitsReg = _RAND_2[3:0];
`endif // RANDOMIZE_REG_INIT
  `endif // RANDOMIZE
end // initial
`ifdef FIRRTL_AFTER_INITIAL
`FIRRTL_AFTER_INITIAL
`endif
`endif // SYNTHESIS
endmodule
module Buffer(
  input        clock,
  input        reset,
  output       io_in_ready,
  input        io_in_valid,
  input  [7:0] io_in_bits,
  input        io_out_ready,
  output       io_out_valid,
  output [7:0] io_out_bits
);
`ifdef RANDOMIZE_REG_INIT
  reg [31:0] _RAND_0;
  reg [31:0] _RAND_1;
`endif // RANDOMIZE_REG_INIT
  reg  stateReg; // @[Uart.scala 139:25]
  reg [7:0] dataReg; // @[Uart.scala 140:24]
  wire  _io_in_ready_T = ~stateReg; // @[Uart.scala 142:27]
  wire  _GEN_1 = io_in_valid | stateReg; // @[Uart.scala 146:23 148:16 139:25]
  assign io_in_ready = ~stateReg; // @[Uart.scala 142:27]
  assign io_out_valid = stateReg; // @[Uart.scala 143:28]
  assign io_out_bits = dataReg; // @[Uart.scala 155:15]
  always @(posedge clock) begin
    if (reset) begin // @[Uart.scala 139:25]
      stateReg <= 1'h0; // @[Uart.scala 139:25]
    end else if (_io_in_ready_T) begin // @[Uart.scala 145:28]
      stateReg <= _GEN_1;
    end else if (io_out_ready) begin // @[Uart.scala 151:24]
      stateReg <= 1'h0; // @[Uart.scala 152:16]
    end
    if (reset) begin // @[Uart.scala 140:24]
      dataReg <= 8'h0; // @[Uart.scala 140:24]
    end else if (_io_in_ready_T) begin // @[Uart.scala 145:28]
      if (io_in_valid) begin // @[Uart.scala 146:23]
        dataReg <= io_in_bits; // @[Uart.scala 147:15]
      end
    end
  end
// Register and memory initialization
`ifdef RANDOMIZE_GARBAGE_ASSIGN
`define RANDOMIZE
`endif
`ifdef RANDOMIZE_INVALID_ASSIGN
`define RANDOMIZE
`endif
`ifdef RANDOMIZE_REG_INIT
`define RANDOMIZE
`endif
`ifdef RANDOMIZE_MEM_INIT
`define RANDOMIZE
`endif
`ifndef RANDOM
`define RANDOM $random
`endif
`ifdef RANDOMIZE_MEM_INIT
  integer initvar;
`endif
`ifndef SYNTHESIS
`ifdef FIRRTL_BEFORE_INITIAL
`FIRRTL_BEFORE_INITIAL
`endif
initial begin
  `ifdef RANDOMIZE
    `ifdef INIT_RANDOM
      `INIT_RANDOM
    `endif
    `ifndef VERILATOR
      `ifdef RANDOMIZE_DELAY
        #`RANDOMIZE_DELAY begin end
      `else
        #0.002 begin end
      `endif
    `endif
`ifdef RANDOMIZE_REG_INIT
  _RAND_0 = {1{`RANDOM}};
  stateReg = _RAND_0[0:0];
  _RAND_1 = {1{`RANDOM}};
  dataReg = _RAND_1[7:0];
`endif // RANDOMIZE_REG_INIT
  `endif // RANDOMIZE
end // initial
`ifdef FIRRTL_AFTER_INITIAL
`FIRRTL_AFTER_INITIAL
`endif
`endif // SYNTHESIS
endmodule
module BufferedUartTX(
  input        clock,
  input        reset,
  output       io_txd,
  output       io_channel_ready,
  input        io_channel_valid,
  input  [7:0] io_channel_bits
);
  wire  tx_clock; // @[Uart.scala 166:18]
  wire  tx_reset; // @[Uart.scala 166:18]
  wire  tx_io_txd; // @[Uart.scala 166:18]
  wire  tx_io_channel_ready; // @[Uart.scala 166:18]
  wire  tx_io_channel_valid; // @[Uart.scala 166:18]
  wire [7:0] tx_io_channel_bits; // @[Uart.scala 166:18]
  wire  buf__clock; // @[Uart.scala 167:19]
  wire  buf__reset; // @[Uart.scala 167:19]
  wire  buf__io_in_ready; // @[Uart.scala 167:19]
  wire  buf__io_in_valid; // @[Uart.scala 167:19]
  wire [7:0] buf__io_in_bits; // @[Uart.scala 167:19]
  wire  buf__io_out_ready; // @[Uart.scala 167:19]
  wire  buf__io_out_valid; // @[Uart.scala 167:19]
  wire [7:0] buf__io_out_bits; // @[Uart.scala 167:19]
  UartTX tx ( // @[Uart.scala 166:18]
    .clock(tx_clock),
    .reset(tx_reset),
    .io_txd(tx_io_txd),
    .io_channel_ready(tx_io_channel_ready),
    .io_channel_valid(tx_io_channel_valid),
    .io_channel_bits(tx_io_channel_bits)
  );
  Buffer buf_ ( // @[Uart.scala 167:19]
    .clock(buf__clock),
    .reset(buf__reset),
    .io_in_ready(buf__io_in_ready),
    .io_in_valid(buf__io_in_valid),
    .io_in_bits(buf__io_in_bits),
    .io_out_ready(buf__io_out_ready),
    .io_out_valid(buf__io_out_valid),
    .io_out_bits(buf__io_out_bits)
  );
  assign io_txd = tx_io_txd; // @[Uart.scala 171:10]
  assign io_channel_ready = buf__io_in_ready; // @[Uart.scala 169:13]
  assign tx_clock = clock;
  assign tx_reset = reset;
  assign tx_io_channel_valid = buf__io_out_valid; // @[Uart.scala 170:17]
  assign tx_io_channel_bits = buf__io_out_bits; // @[Uart.scala 170:17]
  assign buf__clock = clock;
  assign buf__reset = reset;
  assign buf__io_in_valid = io_channel_valid; // @[Uart.scala 169:13]
  assign buf__io_in_bits = io_channel_bits; // @[Uart.scala 169:13]
  assign buf__io_out_ready = tx_io_channel_ready; // @[Uart.scala 170:17]
endmodule
module Top(
  input   clock,
  input   reset,
  input   io_uart_rxd,
  output  io_uart_txd
);
  wire  boot_clock; // @[Top.scala 18:20]
  wire  boot_reset; // @[Top.scala 18:20]
  wire  boot_io_uartRx_ready; // @[Top.scala 18:20]
  wire  boot_io_uartRx_valid; // @[Top.scala 18:20]
  wire [7:0] boot_io_uartRx_bits; // @[Top.scala 18:20]
  wire  boot_io_work; // @[Top.scala 18:20]
  wire  boot_io_initPC_valid; // @[Top.scala 18:20]
  wire [15:0] boot_io_initPC_bits; // @[Top.scala 18:20]
  wire [15:0] boot_io_initMem_raddr; // @[Top.scala 18:20]
  wire [15:0] boot_io_initMem_rdata; // @[Top.scala 18:20]
  wire [15:0] boot_io_initMem_waddr; // @[Top.scala 18:20]
  wire [15:0] boot_io_initMem_wdata; // @[Top.scala 18:20]
  wire  boot_io_initMem_wen; // @[Top.scala 18:20]
  wire  boot_io_initMem_R; // @[Top.scala 18:20]
  wire  boot_io_initMem_mio_en; // @[Top.scala 18:20]
  wire  controller_clock; // @[Top.scala 19:26]
  wire  controller_reset; // @[Top.scala 19:26]
  wire [9:0] controller_io_in_sig; // @[Top.scala 19:26]
  wire  controller_io_in_int; // @[Top.scala 19:26]
  wire  controller_io_in_r; // @[Top.scala 19:26]
  wire [4:0] controller_io_in_ir; // @[Top.scala 19:26]
  wire  controller_io_in_ben; // @[Top.scala 19:26]
  wire  controller_io_in_psr; // @[Top.scala 19:26]
  wire  controller_io_out_LD_MAR; // @[Top.scala 19:26]
  wire  controller_io_out_LD_MDR; // @[Top.scala 19:26]
  wire  controller_io_out_LD_IR; // @[Top.scala 19:26]
  wire  controller_io_out_LD_BEN; // @[Top.scala 19:26]
  wire  controller_io_out_LD_REG; // @[Top.scala 19:26]
  wire  controller_io_out_LD_CC; // @[Top.scala 19:26]
  wire  controller_io_out_LD_PC; // @[Top.scala 19:26]
  wire  controller_io_out_LD_PRIV; // @[Top.scala 19:26]
  wire  controller_io_out_LD_SAVEDSSP; // @[Top.scala 19:26]
  wire  controller_io_out_LD_SAVEDUSP; // @[Top.scala 19:26]
  wire  controller_io_out_LD_VECTOR; // @[Top.scala 19:26]
  wire  controller_io_out_GATE_PC; // @[Top.scala 19:26]
  wire  controller_io_out_GATE_MDR; // @[Top.scala 19:26]
  wire  controller_io_out_GATE_ALU; // @[Top.scala 19:26]
  wire  controller_io_out_GATE_MARMUX; // @[Top.scala 19:26]
  wire  controller_io_out_GATE_VECTOR; // @[Top.scala 19:26]
  wire  controller_io_out_GATE_PC1; // @[Top.scala 19:26]
  wire  controller_io_out_GATE_PSR; // @[Top.scala 19:26]
  wire  controller_io_out_GATE_SP; // @[Top.scala 19:26]
  wire [1:0] controller_io_out_PC_MUX; // @[Top.scala 19:26]
  wire [1:0] controller_io_out_DR_MUX; // @[Top.scala 19:26]
  wire [1:0] controller_io_out_SR1_MUX; // @[Top.scala 19:26]
  wire  controller_io_out_ADDR1_MUX; // @[Top.scala 19:26]
  wire [1:0] controller_io_out_ADDR2_MUX; // @[Top.scala 19:26]
  wire [1:0] controller_io_out_SP_MUX; // @[Top.scala 19:26]
  wire  controller_io_out_MAR_MUX; // @[Top.scala 19:26]
  wire [1:0] controller_io_out_VECTOR_MUX; // @[Top.scala 19:26]
  wire  controller_io_out_PSR_MUX; // @[Top.scala 19:26]
  wire [1:0] controller_io_out_ALUK; // @[Top.scala 19:26]
  wire  controller_io_out_MIO_EN; // @[Top.scala 19:26]
  wire  controller_io_out_R_W; // @[Top.scala 19:26]
  wire  controller_io_out_SET_PRIV; // @[Top.scala 19:26]
  wire [5:0] controller_io_state; // @[Top.scala 19:26]
  wire  controller_io_work; // @[Top.scala 19:26]
  wire  controller_io_end; // @[Top.scala 19:26]
  wire  dataPath_clock; // @[Top.scala 20:24]
  wire  dataPath_reset; // @[Top.scala 20:24]
  wire  dataPath_io_signal_LD_MAR; // @[Top.scala 20:24]
  wire  dataPath_io_signal_LD_MDR; // @[Top.scala 20:24]
  wire  dataPath_io_signal_LD_IR; // @[Top.scala 20:24]
  wire  dataPath_io_signal_LD_BEN; // @[Top.scala 20:24]
  wire  dataPath_io_signal_LD_REG; // @[Top.scala 20:24]
  wire  dataPath_io_signal_LD_CC; // @[Top.scala 20:24]
  wire  dataPath_io_signal_LD_PC; // @[Top.scala 20:24]
  wire  dataPath_io_signal_LD_PRIV; // @[Top.scala 20:24]
  wire  dataPath_io_signal_LD_SAVEDSSP; // @[Top.scala 20:24]
  wire  dataPath_io_signal_LD_SAVEDUSP; // @[Top.scala 20:24]
  wire  dataPath_io_signal_LD_VECTOR; // @[Top.scala 20:24]
  wire  dataPath_io_signal_GATE_PC; // @[Top.scala 20:24]
  wire  dataPath_io_signal_GATE_MDR; // @[Top.scala 20:24]
  wire  dataPath_io_signal_GATE_ALU; // @[Top.scala 20:24]
  wire  dataPath_io_signal_GATE_MARMUX; // @[Top.scala 20:24]
  wire  dataPath_io_signal_GATE_VECTOR; // @[Top.scala 20:24]
  wire  dataPath_io_signal_GATE_PC1; // @[Top.scala 20:24]
  wire  dataPath_io_signal_GATE_PSR; // @[Top.scala 20:24]
  wire  dataPath_io_signal_GATE_SP; // @[Top.scala 20:24]
  wire [1:0] dataPath_io_signal_PC_MUX; // @[Top.scala 20:24]
  wire [1:0] dataPath_io_signal_DR_MUX; // @[Top.scala 20:24]
  wire [1:0] dataPath_io_signal_SR1_MUX; // @[Top.scala 20:24]
  wire  dataPath_io_signal_ADDR1_MUX; // @[Top.scala 20:24]
  wire [1:0] dataPath_io_signal_ADDR2_MUX; // @[Top.scala 20:24]
  wire [1:0] dataPath_io_signal_SP_MUX; // @[Top.scala 20:24]
  wire  dataPath_io_signal_MAR_MUX; // @[Top.scala 20:24]
  wire [1:0] dataPath_io_signal_VECTOR_MUX; // @[Top.scala 20:24]
  wire  dataPath_io_signal_PSR_MUX; // @[Top.scala 20:24]
  wire [1:0] dataPath_io_signal_ALUK; // @[Top.scala 20:24]
  wire  dataPath_io_signal_MIO_EN; // @[Top.scala 20:24]
  wire  dataPath_io_signal_R_W; // @[Top.scala 20:24]
  wire  dataPath_io_signal_SET_PRIV; // @[Top.scala 20:24]
  wire [15:0] dataPath_io_mem_raddr; // @[Top.scala 20:24]
  wire [15:0] dataPath_io_mem_rdata; // @[Top.scala 20:24]
  wire [15:0] dataPath_io_mem_waddr; // @[Top.scala 20:24]
  wire [15:0] dataPath_io_mem_wdata; // @[Top.scala 20:24]
  wire  dataPath_io_mem_wen; // @[Top.scala 20:24]
  wire  dataPath_io_mem_R; // @[Top.scala 20:24]
  wire  dataPath_io_mem_mio_en; // @[Top.scala 20:24]
  wire [9:0] dataPath_io_out_sig; // @[Top.scala 20:24]
  wire  dataPath_io_out_int; // @[Top.scala 20:24]
  wire  dataPath_io_out_r; // @[Top.scala 20:24]
  wire [4:0] dataPath_io_out_ir; // @[Top.scala 20:24]
  wire  dataPath_io_out_ben; // @[Top.scala 20:24]
  wire  dataPath_io_out_psr; // @[Top.scala 20:24]
  wire  dataPath_io_initPC_valid; // @[Top.scala 20:24]
  wire [15:0] dataPath_io_initPC_bits; // @[Top.scala 20:24]
  wire  dataPath_io_uartRx_ready; // @[Top.scala 20:24]
  wire  dataPath_io_uartRx_valid; // @[Top.scala 20:24]
  wire [7:0] dataPath_io_uartRx_bits; // @[Top.scala 20:24]
  wire  dataPath_io_uartTx_ready; // @[Top.scala 20:24]
  wire  dataPath_io_uartTx_valid; // @[Top.scala 20:24]
  wire [7:0] dataPath_io_uartTx_bits; // @[Top.scala 20:24]
  wire  dataPath_io_end; // @[Top.scala 20:24]
  wire  memory_clock; // @[Top.scala 21:22]
  wire [15:0] memory_io_raddr; // @[Top.scala 21:22]
  wire [15:0] memory_io_rdata; // @[Top.scala 21:22]
  wire [15:0] memory_io_waddr; // @[Top.scala 21:22]
  wire [15:0] memory_io_wdata; // @[Top.scala 21:22]
  wire  memory_io_wen; // @[Top.scala 21:22]
  wire  memory_io_R; // @[Top.scala 21:22]
  wire  memory_io_mio_en; // @[Top.scala 21:22]
  wire  uartRx_clock; // @[Top.scala 24:24]
  wire  uartRx_reset; // @[Top.scala 24:24]
  wire  uartRx_io_rxd; // @[Top.scala 24:24]
  wire  uartRx_io_channel_ready; // @[Top.scala 24:24]
  wire  uartRx_io_channel_valid; // @[Top.scala 24:24]
  wire [7:0] uartRx_io_channel_bits; // @[Top.scala 24:24]
  wire  uartTx_clock; // @[Top.scala 25:24]
  wire  uartTx_reset; // @[Top.scala 25:24]
  wire  uartTx_io_txd; // @[Top.scala 25:24]
  wire  uartTx_io_channel_ready; // @[Top.scala 25:24]
  wire  uartTx_io_channel_valid; // @[Top.scala 25:24]
  wire [7:0] uartTx_io_channel_bits; // @[Top.scala 25:24]
  Boot boot ( // @[Top.scala 18:20]
    .clock(boot_clock),
    .reset(boot_reset),
    .io_uartRx_ready(boot_io_uartRx_ready),
    .io_uartRx_valid(boot_io_uartRx_valid),
    .io_uartRx_bits(boot_io_uartRx_bits),
    .io_work(boot_io_work),
    .io_initPC_valid(boot_io_initPC_valid),
    .io_initPC_bits(boot_io_initPC_bits),
    .io_initMem_raddr(boot_io_initMem_raddr),
    .io_initMem_rdata(boot_io_initMem_rdata),
    .io_initMem_waddr(boot_io_initMem_waddr),
    .io_initMem_wdata(boot_io_initMem_wdata),
    .io_initMem_wen(boot_io_initMem_wen),
    .io_initMem_R(boot_io_initMem_R),
    .io_initMem_mio_en(boot_io_initMem_mio_en)
  );
  Controller controller ( // @[Top.scala 19:26]
    .clock(controller_clock),
    .reset(controller_reset),
    .io_in_sig(controller_io_in_sig),
    .io_in_int(controller_io_in_int),
    .io_in_r(controller_io_in_r),
    .io_in_ir(controller_io_in_ir),
    .io_in_ben(controller_io_in_ben),
    .io_in_psr(controller_io_in_psr),
    .io_out_LD_MAR(controller_io_out_LD_MAR),
    .io_out_LD_MDR(controller_io_out_LD_MDR),
    .io_out_LD_IR(controller_io_out_LD_IR),
    .io_out_LD_BEN(controller_io_out_LD_BEN),
    .io_out_LD_REG(controller_io_out_LD_REG),
    .io_out_LD_CC(controller_io_out_LD_CC),
    .io_out_LD_PC(controller_io_out_LD_PC),
    .io_out_LD_PRIV(controller_io_out_LD_PRIV),
    .io_out_LD_SAVEDSSP(controller_io_out_LD_SAVEDSSP),
    .io_out_LD_SAVEDUSP(controller_io_out_LD_SAVEDUSP),
    .io_out_LD_VECTOR(controller_io_out_LD_VECTOR),
    .io_out_GATE_PC(controller_io_out_GATE_PC),
    .io_out_GATE_MDR(controller_io_out_GATE_MDR),
    .io_out_GATE_ALU(controller_io_out_GATE_ALU),
    .io_out_GATE_MARMUX(controller_io_out_GATE_MARMUX),
    .io_out_GATE_VECTOR(controller_io_out_GATE_VECTOR),
    .io_out_GATE_PC1(controller_io_out_GATE_PC1),
    .io_out_GATE_PSR(controller_io_out_GATE_PSR),
    .io_out_GATE_SP(controller_io_out_GATE_SP),
    .io_out_PC_MUX(controller_io_out_PC_MUX),
    .io_out_DR_MUX(controller_io_out_DR_MUX),
    .io_out_SR1_MUX(controller_io_out_SR1_MUX),
    .io_out_ADDR1_MUX(controller_io_out_ADDR1_MUX),
    .io_out_ADDR2_MUX(controller_io_out_ADDR2_MUX),
    .io_out_SP_MUX(controller_io_out_SP_MUX),
    .io_out_MAR_MUX(controller_io_out_MAR_MUX),
    .io_out_VECTOR_MUX(controller_io_out_VECTOR_MUX),
    .io_out_PSR_MUX(controller_io_out_PSR_MUX),
    .io_out_ALUK(controller_io_out_ALUK),
    .io_out_MIO_EN(controller_io_out_MIO_EN),
    .io_out_R_W(controller_io_out_R_W),
    .io_out_SET_PRIV(controller_io_out_SET_PRIV),
    .io_state(controller_io_state),
    .io_work(controller_io_work),
    .io_end(controller_io_end)
  );
  DataPath dataPath ( // @[Top.scala 20:24]
    .clock(dataPath_clock),
    .reset(dataPath_reset),
    .io_signal_LD_MAR(dataPath_io_signal_LD_MAR),
    .io_signal_LD_MDR(dataPath_io_signal_LD_MDR),
    .io_signal_LD_IR(dataPath_io_signal_LD_IR),
    .io_signal_LD_BEN(dataPath_io_signal_LD_BEN),
    .io_signal_LD_REG(dataPath_io_signal_LD_REG),
    .io_signal_LD_CC(dataPath_io_signal_LD_CC),
    .io_signal_LD_PC(dataPath_io_signal_LD_PC),
    .io_signal_LD_PRIV(dataPath_io_signal_LD_PRIV),
    .io_signal_LD_SAVEDSSP(dataPath_io_signal_LD_SAVEDSSP),
    .io_signal_LD_SAVEDUSP(dataPath_io_signal_LD_SAVEDUSP),
    .io_signal_LD_VECTOR(dataPath_io_signal_LD_VECTOR),
    .io_signal_GATE_PC(dataPath_io_signal_GATE_PC),
    .io_signal_GATE_MDR(dataPath_io_signal_GATE_MDR),
    .io_signal_GATE_ALU(dataPath_io_signal_GATE_ALU),
    .io_signal_GATE_MARMUX(dataPath_io_signal_GATE_MARMUX),
    .io_signal_GATE_VECTOR(dataPath_io_signal_GATE_VECTOR),
    .io_signal_GATE_PC1(dataPath_io_signal_GATE_PC1),
    .io_signal_GATE_PSR(dataPath_io_signal_GATE_PSR),
    .io_signal_GATE_SP(dataPath_io_signal_GATE_SP),
    .io_signal_PC_MUX(dataPath_io_signal_PC_MUX),
    .io_signal_DR_MUX(dataPath_io_signal_DR_MUX),
    .io_signal_SR1_MUX(dataPath_io_signal_SR1_MUX),
    .io_signal_ADDR1_MUX(dataPath_io_signal_ADDR1_MUX),
    .io_signal_ADDR2_MUX(dataPath_io_signal_ADDR2_MUX),
    .io_signal_SP_MUX(dataPath_io_signal_SP_MUX),
    .io_signal_MAR_MUX(dataPath_io_signal_MAR_MUX),
    .io_signal_VECTOR_MUX(dataPath_io_signal_VECTOR_MUX),
    .io_signal_PSR_MUX(dataPath_io_signal_PSR_MUX),
    .io_signal_ALUK(dataPath_io_signal_ALUK),
    .io_signal_MIO_EN(dataPath_io_signal_MIO_EN),
    .io_signal_R_W(dataPath_io_signal_R_W),
    .io_signal_SET_PRIV(dataPath_io_signal_SET_PRIV),
    .io_mem_raddr(dataPath_io_mem_raddr),
    .io_mem_rdata(dataPath_io_mem_rdata),
    .io_mem_waddr(dataPath_io_mem_waddr),
    .io_mem_wdata(dataPath_io_mem_wdata),
    .io_mem_wen(dataPath_io_mem_wen),
    .io_mem_R(dataPath_io_mem_R),
    .io_mem_mio_en(dataPath_io_mem_mio_en),
    .io_out_sig(dataPath_io_out_sig),
    .io_out_int(dataPath_io_out_int),
    .io_out_r(dataPath_io_out_r),
    .io_out_ir(dataPath_io_out_ir),
    .io_out_ben(dataPath_io_out_ben),
    .io_out_psr(dataPath_io_out_psr),
    .io_initPC_valid(dataPath_io_initPC_valid),
    .io_initPC_bits(dataPath_io_initPC_bits),
    .io_uartRx_ready(dataPath_io_uartRx_ready),
    .io_uartRx_valid(dataPath_io_uartRx_valid),
    .io_uartRx_bits(dataPath_io_uartRx_bits),
    .io_uartTx_ready(dataPath_io_uartTx_ready),
    .io_uartTx_valid(dataPath_io_uartTx_valid),
    .io_uartTx_bits(dataPath_io_uartTx_bits),
    .io_end(dataPath_io_end)
  );
  Memory memory ( // @[Top.scala 21:22]
    .clock(memory_clock),
    .io_raddr(memory_io_raddr),
    .io_rdata(memory_io_rdata),
    .io_waddr(memory_io_waddr),
    .io_wdata(memory_io_wdata),
    .io_wen(memory_io_wen),
    .io_R(memory_io_R),
    .io_mio_en(memory_io_mio_en)
  );
  UartRX uartRx ( // @[Top.scala 24:24]
    .clock(uartRx_clock),
    .reset(uartRx_reset),
    .io_rxd(uartRx_io_rxd),
    .io_channel_ready(uartRx_io_channel_ready),
    .io_channel_valid(uartRx_io_channel_valid),
    .io_channel_bits(uartRx_io_channel_bits)
  );
  BufferedUartTX uartTx ( // @[Top.scala 25:24]
    .clock(uartTx_clock),
    .reset(uartTx_reset),
    .io_txd(uartTx_io_txd),
    .io_channel_ready(uartTx_io_channel_ready),
    .io_channel_valid(uartTx_io_channel_valid),
    .io_channel_bits(uartTx_io_channel_bits)
  );
  assign io_uart_txd = uartTx_io_txd; // @[Top.scala 28:19]
  assign boot_clock = clock;
  assign boot_reset = reset;
  assign boot_io_uartRx_valid = boot_io_work ? 1'h0 : uartRx_io_channel_valid; // @[Top.scala 30:24 33:28 37:22]
  assign boot_io_uartRx_bits = uartRx_io_channel_bits; // @[Top.scala 30:24 37:22]
  assign boot_io_initMem_rdata = 16'h0;
  assign boot_io_initMem_R = 1'h0;
  assign controller_clock = clock;
  assign controller_reset = reset;
  assign controller_io_in_sig = dataPath_io_out_sig; // @[Top.scala 72:20]
  assign controller_io_in_int = dataPath_io_out_int; // @[Top.scala 72:20]
  assign controller_io_in_r = dataPath_io_out_r; // @[Top.scala 72:20]
  assign controller_io_in_ir = dataPath_io_out_ir; // @[Top.scala 72:20]
  assign controller_io_in_ben = dataPath_io_out_ben; // @[Top.scala 72:20]
  assign controller_io_in_psr = dataPath_io_out_psr; // @[Top.scala 72:20]
  assign controller_io_work = boot_io_work; // @[Top.scala 73:22]
  assign controller_io_end = dataPath_io_end; // @[Top.scala 41:23]
  assign dataPath_clock = clock;
  assign dataPath_reset = reset;
  assign dataPath_io_signal_LD_MAR = controller_io_out_LD_MAR; // @[Top.scala 75:22]
  assign dataPath_io_signal_LD_MDR = controller_io_out_LD_MDR; // @[Top.scala 75:22]
  assign dataPath_io_signal_LD_IR = controller_io_out_LD_IR; // @[Top.scala 75:22]
  assign dataPath_io_signal_LD_BEN = controller_io_out_LD_BEN; // @[Top.scala 75:22]
  assign dataPath_io_signal_LD_REG = controller_io_out_LD_REG; // @[Top.scala 75:22]
  assign dataPath_io_signal_LD_CC = controller_io_out_LD_CC; // @[Top.scala 75:22]
  assign dataPath_io_signal_LD_PC = controller_io_out_LD_PC; // @[Top.scala 75:22]
  assign dataPath_io_signal_LD_PRIV = controller_io_out_LD_PRIV; // @[Top.scala 75:22]
  assign dataPath_io_signal_LD_SAVEDSSP = controller_io_out_LD_SAVEDSSP; // @[Top.scala 75:22]
  assign dataPath_io_signal_LD_SAVEDUSP = controller_io_out_LD_SAVEDUSP; // @[Top.scala 75:22]
  assign dataPath_io_signal_LD_VECTOR = controller_io_out_LD_VECTOR; // @[Top.scala 75:22]
  assign dataPath_io_signal_GATE_PC = controller_io_out_GATE_PC; // @[Top.scala 75:22]
  assign dataPath_io_signal_GATE_MDR = controller_io_out_GATE_MDR; // @[Top.scala 75:22]
  assign dataPath_io_signal_GATE_ALU = controller_io_out_GATE_ALU; // @[Top.scala 75:22]
  assign dataPath_io_signal_GATE_MARMUX = controller_io_out_GATE_MARMUX; // @[Top.scala 75:22]
  assign dataPath_io_signal_GATE_VECTOR = controller_io_out_GATE_VECTOR; // @[Top.scala 75:22]
  assign dataPath_io_signal_GATE_PC1 = controller_io_out_GATE_PC1; // @[Top.scala 75:22]
  assign dataPath_io_signal_GATE_PSR = controller_io_out_GATE_PSR; // @[Top.scala 75:22]
  assign dataPath_io_signal_GATE_SP = controller_io_out_GATE_SP; // @[Top.scala 75:22]
  assign dataPath_io_signal_PC_MUX = controller_io_out_PC_MUX; // @[Top.scala 75:22]
  assign dataPath_io_signal_DR_MUX = controller_io_out_DR_MUX; // @[Top.scala 75:22]
  assign dataPath_io_signal_SR1_MUX = controller_io_out_SR1_MUX; // @[Top.scala 75:22]
  assign dataPath_io_signal_ADDR1_MUX = controller_io_out_ADDR1_MUX; // @[Top.scala 75:22]
  assign dataPath_io_signal_ADDR2_MUX = controller_io_out_ADDR2_MUX; // @[Top.scala 75:22]
  assign dataPath_io_signal_SP_MUX = controller_io_out_SP_MUX; // @[Top.scala 75:22]
  assign dataPath_io_signal_MAR_MUX = controller_io_out_MAR_MUX; // @[Top.scala 75:22]
  assign dataPath_io_signal_VECTOR_MUX = controller_io_out_VECTOR_MUX; // @[Top.scala 75:22]
  assign dataPath_io_signal_PSR_MUX = controller_io_out_PSR_MUX; // @[Top.scala 75:22]
  assign dataPath_io_signal_ALUK = controller_io_out_ALUK; // @[Top.scala 75:22]
  assign dataPath_io_signal_MIO_EN = controller_io_out_MIO_EN; // @[Top.scala 75:22]
  assign dataPath_io_signal_R_W = controller_io_out_R_W; // @[Top.scala 75:22]
  assign dataPath_io_signal_SET_PRIV = controller_io_out_SET_PRIV; // @[Top.scala 75:22]
  assign dataPath_io_mem_rdata = memory_io_rdata; // @[Top.scala 78:13]
  assign dataPath_io_mem_R = memory_io_R; // @[Top.scala 78:13]
  assign dataPath_io_initPC_valid = boot_io_initPC_valid; // @[Top.scala 76:22]
  assign dataPath_io_initPC_bits = boot_io_initPC_bits; // @[Top.scala 76:22]
  assign dataPath_io_uartRx_valid = boot_io_work & uartRx_io_channel_valid; // @[Top.scala 30:24 31:26 36:32]
  assign dataPath_io_uartRx_bits = uartRx_io_channel_bits; // @[Top.scala 30:24 31:26]
  assign dataPath_io_uartTx_ready = uartTx_io_channel_ready; // @[Top.scala 40:23]
  assign memory_clock = clock;
  assign memory_io_raddr = dataPath_io_mem_raddr; // @[Top.scala 78:13]
  assign memory_io_waddr = boot_io_work ? dataPath_io_mem_waddr : boot_io_initMem_waddr; // @[Top.scala 79:25]
  assign memory_io_wdata = boot_io_work ? dataPath_io_mem_wdata : boot_io_initMem_wdata; // @[Top.scala 80:25]
  assign memory_io_wen = boot_io_work ? dataPath_io_mem_wen : boot_io_initMem_wen; // @[Top.scala 81:23]
  assign memory_io_mio_en = dataPath_io_mem_mio_en; // @[Top.scala 78:13]
  assign uartRx_clock = clock;
  assign uartRx_reset = reset;
  assign uartRx_io_rxd = io_uart_rxd; // @[Top.scala 27:19]
  assign uartRx_io_channel_ready = boot_io_work ? dataPath_io_uartRx_ready : boot_io_uartRx_ready; // @[Top.scala 30:24 31:26 37:22]
  assign uartTx_clock = clock;
  assign uartTx_reset = reset;
  assign uartTx_io_channel_valid = dataPath_io_uartTx_valid; // @[Top.scala 40:23]
  assign uartTx_io_channel_bits = dataPath_io_uartTx_bits; // @[Top.scala 40:23]
endmodule
