module Memory(
  input         clock,
  input  [15:0] io_raddr,
  output [15:0] io_rdata,
  input  [15:0] io_waddr,
  input  [15:0] io_wdata,
  input         io_wen,
  output        io_R
);
  wire  dual_mem_clka; // @[Memory.scala 65:23]
  wire  dual_mem_wea; // @[Memory.scala 65:23]
  wire [15:0] dual_mem_addra; // @[Memory.scala 65:23]
  wire [15:0] dual_mem_dina; // @[Memory.scala 65:23]
  wire  dual_mem_clkb; // @[Memory.scala 65:23]
  wire [15:0] dual_mem_addrb; // @[Memory.scala 65:23]
  wire [15:0] dual_mem_doutb; // @[Memory.scala 65:23]
  dual_mem dual_mem ( // @[Memory.scala 65:23]
    .clka(dual_mem_clka),
    .wea(dual_mem_wea),
    .addra(dual_mem_addra),
    .dina(dual_mem_dina),
    .clkb(dual_mem_clkb),
    .addrb(dual_mem_addrb),
    .doutb(dual_mem_doutb)
  );
  assign io_rdata = dual_mem_doutb; // @[Memory.scala 72:21]
  assign io_R = 1'h1; // @[Memory.scala 92:8]
  assign dual_mem_clka = clock; // @[Memory.scala 66:21]
  assign dual_mem_wea = io_wen; // @[Memory.scala 67:21]
  assign dual_mem_addra = io_waddr; // @[Memory.scala 68:21]
  assign dual_mem_dina = io_wdata; // @[Memory.scala 69:21]
  assign dual_mem_clkb = clock; // @[Memory.scala 70:21]
  assign dual_mem_addrb = io_raddr; // @[Memory.scala 71:21]
endmodule