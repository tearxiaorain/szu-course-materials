module ALU(
  input  [15:0] io_ina,
  input  [15:0] io_inb,
  input  [1:0]  io_op,
  output [15:0] io_out
);
  wire  _T = 2'h0 == io_op; // @[Conditional.scala 37:30]
  wire [16:0] result = io_ina + io_inb; // @[ALU.scala 22:24]
  wire  _T_4 = 2'h1 == io_op; // @[Conditional.scala 37:30]
  wire [15:0] _T_5 = io_ina & io_inb; // @[ALU.scala 26:33]
  wire  _T_6 = 2'h2 == io_op; // @[Conditional.scala 37:30]
  wire [15:0] _T_7 = ~io_ina; // @[ALU.scala 27:26]
  wire [15:0] _GEN_1 = _T_6 ? _T_7 : io_ina; // @[Conditional.scala 39:67]
  wire [15:0] _GEN_2 = _T_4 ? _T_5 : _GEN_1; // @[Conditional.scala 39:67]
  assign io_out = _T ? result[15:0] : _GEN_2; // @[ALU.scala 23:14 ALU.scala 26:23 ALU.scala 27:23 ALU.scala 28:23]
endmodule