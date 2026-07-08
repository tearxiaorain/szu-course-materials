        .text # Define beginning of text section                                                                                                                           
        .global _start # Define entry _start
_start:
        lui x6, 1 # x6 = 0x00001000
        lui x7, 2 # x7 = 0x00002000
        # comb x5, x6, x7 
exit:
        csrw mtohost, 1
        j exit
        .end # End of file