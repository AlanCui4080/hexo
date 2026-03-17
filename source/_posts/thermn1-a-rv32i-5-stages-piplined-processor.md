---
title: A RV32I 5-stages Pipelined Processor
tags: []
categories:
  - Verilog
date: 2025-06-06 03:12:20
---

The processor uses a simplified AHB as the interface, and presents itself as a Harvard architecture. The implemented RISC-V subset only includes I, and does not support non-word-wided Load/Store operations. The entire execution flow is divided into five stages: IF/ID/OF/EX/MWB, which stands for: instruction fetch, decode, operand fetch (whether it's an immediate or register), branch instruction predictional bypass, memory register write back. This division is made to ensure that the size occupied by each stage remains as balanced as possible. Due to the non-sequential transmission characteristics of the AHB bus, the instruction fetch will at least occupy one cycle of idle time, hence this processor can process an arithmetic instruction every two cycles and a memory access instruction every four cycles.

<!-- more -->

> Please refer to: [https://github.com/AlanCui4080/ThCattus/blob/master/therm_v1_processor.v](https://github.com/AlanCui4080/ThCattus/blob/master/therm_v1_processor.v)

After synthesis and routing in aggressive performance mode on the Cyclone IV E EP4CE15 device with speed grade C8, LUT4 usage is 3,899, with maximum clock at 76.17Mhz. After synthesis and routing in aggressive performance mode on the MAX 10 10M8 device with speed grade C8, LUT4 usage is 3,928, with maximum clock at 77.59Mhz. (To compare with the latter, since I don't have this FPGA, there's no actual test.) After synthesis and routing in default mode on the Artix 7 XC7A50T device with speed grade -3 platform, LUT6 usage is 1,498, with maximum clock at 113.22Mhz. Compared to the following VexRISCV, there's still a significant performance gap (volume +83%, frequency -52%, overall performance -77%). The difference is likely due to: 
- High LUT usage caused by not implementing register file using BRAM
- Overly complex data multiplexing logic that not only slows down the system clock but also increases resource consumption
- Not implements sequential read of AHB, causing half of the processor cycles to be wasted

> VexRiscv small and productive (RV32I, 0.82 DMIPS/MHz)  ->
>     Artix 7     -> 232 MHz 816 LUT 534 FF 

The following is the ROM initialization assembly, where 0xf0000000 is the TXD register for the serial port peripheral. Since there's no implementation of the serial ready register, busy waiting is used to ensure that writing data succeeds. The value of this busy wait theoretically works up to >2Ghz, so it's safe regardless of how it's transplanted:

```asm
li      x1,0xf0000000
li      x2,0x6c6c6548
li      x3,0x6f77206f
li      x4,0x00646c72

li      x10,0xfffff

sw      x2,0(x1)
loop1:
addi    x10,x10,-1
bnez    x10,loop1
li      x10,0xfffff

sw      x3,0(x1)
loop2:
addi    x10,x10,-1
bnez    x10,loop2
li      x10,0xfffff

sw      x4,0(x1)
loop3:
addi    x10,x10,-1
bnez    x10,loop3
li      x10,0xfffff

jal     x0,0
```

![](https://asset.alancui.cc/legacy-uploads/2025/06/therm_v1_processor_helloworld.png)


#### Improvement R1

This version splits the EX stage into two stages, aiming to significantly reduce the length of combinational logic.

After synthesis and routing in aggressive performance mode on the Cyclone IV E EP4CE15 device with speed grade C8 platform, LUT4 usage is 3,483, with maximum clock at 127.94Mhz (an increase of 68%). After synthesis and routing in default mode on the Artix 7 XC7A50T device with speed grade -3 platform, LUT6 usage is 1,700, with maximum clock at 248.13Mhz (an increase of 119%). Compared to the given VexRISCV, the frequency has already exceeded by 7%, but the overall area usage has increased by 108%, and the instruction execution speed is lower by 43%.
