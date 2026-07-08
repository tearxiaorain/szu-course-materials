        .text # Define beginning of text section                                                                                                                           
        .global _start # Define entry _start
_start:
        lui x6, 0xF0001 # x6 = 0xF0001000
        lui x7, 0x00F02 # x7 = 0x00F02000
        # odd x5, x6, x7 
exit:
        csrw mtohost, 1
        j exit
        .end # End of file