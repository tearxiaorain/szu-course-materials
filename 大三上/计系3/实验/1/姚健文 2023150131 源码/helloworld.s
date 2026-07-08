.data
CONTROL: .word32 0x10000
DATA:    .word32 0x10008
str:     .asciiz "Hello World!!"

.text
main:
ld r1, CONTROL(R0)     # R1 = CONTROL
ld r2, DATA(R0)        # R2 = DATA

# set DATA = add(str)
daddi r3, r0, str      # R3 = add(str)
sd r3, 0(r2)

# CONTROL = 4 
daddi r4, r0, 4        # R4 = 4 
sd r4, 0(r1)

halt                   # end