---
title: Integrating ADC - Principle, Prototype, and Improvement
categories:
  - Test&Measure
date: 2025-05-07 16:33:31
---

Since integrating ADCs and their improved versions have been the most widely used ADC type in digital multimeters and voltmeters over the past fifty years, this article documents the process of designing an integrating ADC.

<!-- more -->

Time and frequency are the earliest, most widely used, and most accurate physical quantities measured by humankind. As early as 1820, 150 years before Ampère invented the first galvanometer, Huygens invented the first pendulum clock. Even now, top-of-the-line digital multimeters costing tens of thousands of yuan, such as the HP3458A, have a measurement resolution of only 8 1/2 digits, while frequency meters costing a thousand yuan, such as the HP53132A, can achieve a measurement resolution of 12 3/4 digits. Therefore, converting physical quantities such as voltage and current into time for measurement can greatly reduce system complexity and introduced errors.

In fact, the most accurate voltage references today are based on frequency/voltage conversion: passing microwaves through a weak point sandwiched between two superconductors (separated by an insulating/non-superconducting material), this produces an extremely stable and precise DC voltage due to the inverse Josephson effect.

![](https://alancui.cc/wp-content/uploads/2025/05/NISTvoltChip.jpg)

The image shows a Josephson DC voltage reference chip manufactured by NIST, with 3020 nodes, used to generate a 1V voltage, requiring liquid helium cooling during operation.

To convert voltage to time, we need to construct a voltage function related to time. In the basic circuits, it's clear that the response of the basic four arithmetic units does not include time, and the DC response of the filter is non-linear, leaving only the differentiator and integrator as options. Since we are actually only concerned with the DC signal, a capacitor integrator is chosen to construct the V/T conversion core of the ADC. A capacitor is chosen instead of an inductor because inductorance is difficult to control.

![](https://alancui.cc/wp-content/uploads/2025/05/37e4a347-d86a-4551-99ee-3c7ee1b0148d.png)

Basic form of an integrator [TI.com](https://www.ti.com.cn/cn/lit/an/zhca760b/zhca760b.pdf)

The transfer function of an ideal integrator is: $$V\_{out} = -\\frac{1}{R\_1C\_1}\\int^{T\_1}\_{T\_0}{V\_{in}(t)}dt$$ For DC excitation, we have: $$V\_{out} = -\\frac{V\_{in}}{R\_1C\_1}(T\_1-T\_0)$$

If we set a voltage $V\_{th}$, when When $V_th = V_out$, we have: $$V_in = -V_th\\frac{R_1C_1}{T_1-T_0}$$ And knowing all the parameters on the right-hand side of the equation, we can solve for the value of $V_in$. This is the **single-slope** integrator ADC. The **single-slope** integrator ADC uses a comparator to output a step signal and stop the counter when $V_th = V_out$, thereby calculating the input value. (Another zero-crossing comparator may be needed to start the counter; this is simplified to zero-state start-up.)

![](https://alancui.cc/wp-content/uploads/2025/05/DI112Fig01.gif)

Single-slope integrator ADC architecture [Analog.com](https://www.analog.com/en/resources/technical-articles/adc-architectures.html)

However, this architecture is highly dependent on the absolute values ​​of the two passive components $R_1$ and $C_1$. Manufacturing capacitors and resistors with ultra-high stability is very expensive, resulting in generally low accuracy. Therefore, an improved version was quickly developed: **dual-slope integrator ADC**. A set of switches is added to the original circuit to switch the input between $V_{in}$ and $V_{ref}$ of opposite polarity, and the voltage integration is brought to zero during the $V_{ref}$ on-time. We call the portion of $V_{in}$ that is connected to it the **RunUp**, and the portion of $V_{in}$ that is disconnected from it the **RunDown**.

![](https://alancui.cc/wp-content/uploads/2025/05/DI112Fig02.gif)

Double-slope integral ADC，来源：[Analog.com](https://www.analog.com/en/resources/technical-articles/adc-architectures.html)

Therefore, $$\\frac{V\_{in}}{R\_1C\_1}(T\_1-T\_0)=V\_{peak}=-\\frac{V\_{ref}}{R\_1C\_1}(T\_2-T\_1)$$ Eliminating $R\_1$ and $C\_1$ $$V\_{in}(T\_1-T\_0)=V\_{peak}=-V\_{ref}(T\_2-T\_1)$$ Simplifying, we get $$V\_{in}=-V\_{ref}\\frac{T\_2-T\_1}{T\_1-T\_0}$$

If $V\_{ref}$ is accurate and the entire analog system is ideal, the output resolution of this ADC is $\\frac{T\_2-T\_1}{T\_1-T\_0}$, which is the resolution of $T\_1-T\_0$. Since the frequency accuracy is several orders of magnitude higher than the voltage accuracy, we only need to increase the frequency of the digital counter to significantly improve the resolution. Therefore, this type of ADC is widely used in various simple DC current measuring instruments. With a slight modification, $V_{ref}$ and $V_{in}$ are treated with two ramps using different slopes, resulting in the formula $$V_{in}=-V_{ref}\\frac{T_2-T_1}{T_1-T_0}\\frac{R_{vref}}{R_{vin}}$$

This scales $T_1-T_0$ by a coefficient of $\\frac{R_{vref}}{R_{vin}}$, thereby improving resolution. With advancements in film resistor technology, multiple resistors can be fabricated on the same substrate. Due to highly standardized fabrication processes, the drift of these resistors will be highly consistent. Therefore, this improved method is feasible.

Improved (Dual-Slope) Dual-Ramp Integrator ADC, Source: p.4, April 1989, HP Journal ![](https://alancui.cc/wp-content/uploads/2025/05/QQ20250507-200943.png)


However, dual-ramp integrators have significant drawbacks:

- Real-world integrators are limited by the power supply rails and cannot integrate indefinitely to positive or negative infinity. Furthermore, comparator offset requires us to utilize the full dynamic range of the integrator as much as possible (obviously, the error caused by offset is the ratio of the integrator's full-swing voltage to the offset voltage). Therefore, the integration time of this type of ADC is very fixed and inflexible. For example, the AC power grid in laboratories often causes severe power frequency interference, and the frequencies of global power grids are not entirely the same. This requires our input integration time to be an integer multiple of the power line cycle (abbreviated as NPLC, Number of Power Line Cycle). For a 60Hz power grid, this is 16.67ms, while for a 50Hz power grid, it is 20ms. To prevent the integrator from saturating, we must design the integrator's time constant according to 50Hz. Since the dynamic range of the integrator cannot be fully utilized, this will lead to a loss of accuracy for the instrument under a 60Hz power grid! Furthermore, benchtop multimeters in laboratories often face various operating conditions, and we cannot always expect the instrument to operate at maximum resolution—often 10NPLC or higher, especially since ultra-high precision measurements are not common in laboratories.

- Larger resistance and capacitance values ​​are difficult to manufacture, and their electrical characteristics are worse than smaller models. To achieve an integration time of 20ms, $R_1C_1$ would be 0.02. This value may not seem large, but considering that the largest common option for a C0G capacitor in a 1206 form factor is 100nF, this would require a 200kΩ input resistor. On one hand, high impedance sources within the instrument are undesirable, causing excessive picking up of ambient noise and severely degrading performance. On the other hand, reducing the resistance and increasing the capacitance would result in a very large capacitor to achieve (or even fail to achieve) excellent electrical characteristics, leading to higher leakage current.

While we could fabricate resistors in multiple proportions and execute the two ramps at different slopes to create a **multi-slope dual-slope integrator ADC**, designing a high dynamic range integrator remains very challenging as described above (in fact, excessively large or small slopes will severely affect the linearity of the integrator output stage and produce uneven heating in the resistor array). Integrating resistors that differ by several orders of magnitude and ensuring they do not interfere with each other is also costly.

Therefore, to address manufacturing challenges and achieve a more flexible operating range, we adopted a smaller integrator time constant to obtain a smaller passive component size. During RunUp, a switch is used to toggle between $+V\_{ref}$ 和 $-V\_{ref}$ to prevent the integral voltage from saturating, i.e., (note the residual voltage on the right-hand side of the equation): $$\\frac{V\_{in}t\_{in}}{t\_{total}}+\\frac{+V\_{ref}t\_{posref}}{t\_{total}}+\\frac{-V\_{ref}t\_{negref}}{t\_{total}}=V\_{residual}$$ At this stage, the instrument typically achieves approximately half its resolution.

![](https://alancui.cc/wp-content/uploads/2025/05/QQ20250507-191321.png)

HP3478A Dual-Slope Multi-Ramp RunUp Process [3478A DMM Service Manual](https://www.keysight.com/us/en/assets/9018-05355/service-manuals/9018-05355.pdf?success=true)

Due to the charge injection effect and switching nonlinearity of MOSFETs, we must use a well-designed switching sequence during switching to ensure a constant and symmetrical number of MOSFET switching operations. Symmetrical switching within a switching mode helps eliminate charge injection and reduce offset, while a fixed number of switching operations within a switching mode will generate a fixed nonlinear offset, which can be calibrated later. This will generate a waveform approximating PWM, as shown below:

Switch sequence, Source: p.7, April 1989, HP Journal ![](https://alancui.cc/wp-content/uploads/2025/05/QQ20250507-210741.png)

After the majority of the RunUp time has ended, $V_{residual}$ can be measured during RunDown to obtain the remaining half of the resolution. In the ideal analog phase, $V_{residual}$ depends only on quantization error, comparator delay error, and switching delay error, with the latter two being the majority. Since the time of these errors is relatively fixed, we only need to reduce the slope of RunDown during the zero-crossing phase to reduce the $V_{residual}$ injected by these errors. Similarly, the RunDown process cannot increase resolution by extending the integration time because the $V_{residual}$ caused by these errors is fixed given a constant slope. Regardless, a fixed resolution will always be generated during RunDown; adjustments for different resolutions and integration times are provided by RunUp.

![](https://alancui.cc/wp-content/uploads/2025/05/QQ20250507-192018.png)

HP3478A multi-slope multi-ramp RunDown process [3478A DMM Service Manual](https://www.keysight.com/us/en/assets/9018-05355/service-manuals/9018-05355.pdf?success=true)

Furthermore, since $V_{in}$ is now disconnected, we can create more slopes using fewer resistors and the superposition theorem. The HP3478A generates nine slopes using only three resistors.

![](https://alancui.cc/wp-content/uploads/2025/05/QQ20250507-203828.png)

Simplified ADC diagram of HP3478A [3478A DMM Service Manual](https://www.keysight.com/us/en/assets/9018-05355/service-manuals/9018-05355.pdf?success=true)

Based on this, the prototype of the HP Integrating ADC II was completed. The 3456A, 3457A, 3458A, 3468A, and 3478A all used different variants of the second-generation HP Integrating ADC. We will not go into the specific implementation details of each one. With subsequent advancements in semiconductor technology, the 34401A replaced the RunDown stage with an ADC and continuously executed RunUp, measuring the integrator voltage before and after each cycle, achieving faster, almost uninterrupted sampling. The 34410A further replaced the comparator directly with an ADC and used a newer MOSFET switch to significantly improve RunUp resolution. The newer ADC also improved RunDown accuracy, thereby achieving a sampling speed an order of magnitude higher than the 34401A. As for the newer 3446x series, the author has not yet had access to a physical device, so it will not be discussed.

### Prototype

#### Multislope v1

![](https://alancui.cc/wp-content/uploads/2025/05/qq_pic_merged_1746630083104.jpg)

![](https://alancui.cc/wp-content/uploads/2025/05/photo_2025-02-11_10-14-09.jpg)

[AlanMultiSlopeADCv1](https://alancui.cc/?attachment_id=204)[下载](https://alancui.cc/wp-content/uploads/2025/05/AlanMultiSlopeADCv1.pdf)

The Alan multi-slope ADCv1 is largely modeled after the HP34401A, controlled by an STM32 hardware timer, and uses an ADR4550 and LT5400 resistor network to generate a ±10V reference. The integrator uses an LT5400 resistor network as the input and a 74HC4053 as the switch. When the 4053 switch is not connected, current is diverted to GND to prevent the voltage across the switch from exceeding its withstand voltage. When connected, due to the op-amp's closed-loop design, the inverting input is also connected to GND. The power supply section uses a combination of Mornsun positive and negative isolation modules, multiple filters, and a TPS7A39.

This schematic has several issues. For example, the LM311's input stage slew rate is low, resulting in significant latency. Therefore, a resistor divider is needed to limit the input stage voltage to a lower slew rate; see [TI E2E](https://e2e.ti.com/support/amplifiers-group/amplifiers/f/amplifiers-forum/1471977/lm311-not-matched-low-to-high-and-high-to-low-response-time-high-to-low-is-10-times-longer-than-specification). Secondly, the 1nF+1k RC combination is too small, causing the STM32 interrupt to reach the GPIO pin too slowly, resulting in the integrator saturating (see the diagram above) and becoming completely inoperable. Additionally, the output FLASH ADC transfer circuit is overly complex.

#### Multislope v3

![](https://alancui.cc/wp-content/uploads/2025/05/qq_pic_merged_1746632855644.jpg)

![](https://alancui.cc/wp-content/uploads/2025/05/photo_2025-04-21_17-46-33.jpg)

[AlanMultiSlopeADCv3](https://alancui.cc/?attachment_id=209)

The Alan multi-slope ADCv3 largely mimics the HP34401A, controlled by a MAX10 10M08 FPGA. The core is the same as v1, but the FLASH ADC is removed, and the comparator is replaced with a TLV3202. The power supply uses a self-made SEPIC+CUK+post-LDO. The board design is a modified MAX10 EVAL Arudino-style expansion board. The main issue with this board was an abnormal wiring of the LT5400 series resistor array, which was resolved by jumper wires.

Using conventional bang-bang control, this board successfully achieved 4-bit resolution with a 10NPLC, with a maximum INL of 0.58% without using MOSFETs to mitigate non-ideal switching modes. The converter sends binary data via serial port after each conversion. The following is the result of decoding and calculating the INL using a Python script:

SourceCode: [https://github.com/AlanCui4080/MultiSlopeADCv3](https://github.com/AlanCui4080/MultiSlopeADCv3)

![](https://alancui.cc/wp-content/uploads/2025/05/AF356CBB5E783FC4090605E4244AD511.png)
