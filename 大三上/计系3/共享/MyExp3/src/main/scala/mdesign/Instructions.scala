package mydesign

import chisel3._
import chisel3.util._
import chisel3.util.BitPat

object Instructions {
	// add_op
    val add_on  = 1.U(1.W)
	val add_off = 0.U(1.W)
	// sub_op
    val sub_on  = 1.U(1.W)
	val sub_off = 0.U(1.W)
	// lw_op
    val lw_on   = 1.U(1.W)
	val lw_off  = 0.U(1.W)
	// sw_op
    val sw_on   = 1.U(1.W)
	val sw_off  = 0.U(1.W)
	// nop
    val nop_on  = 1.U(1.W)
	val nop_off = 0.U(1.W)

	def ADD = BitPat("b000000???????????????00000100000")
	def SUB = BitPat("b000000???????????????00000100010")
	def LW  = BitPat("b100011??????????????????????????")
	def SW  = BitPat("b101011??????????????????????????")
	
	val default = List(add_off, sub_off, lw_off, sw_off, nop_on)

	val map = Array(
        //          add_op   sub_op   lw_op   sw_op   nop
		ADD -> List(add_on,  sub_off, lw_off, sw_off, nop_off),
		SUB -> List(add_off, sub_on,  lw_off, sw_off, nop_off),
		LW  -> List(add_off, sub_off, lw_on,  sw_off, nop_off),
		SW  -> List(add_off, sub_off, lw_off, sw_on,  nop_off)
	)
}
