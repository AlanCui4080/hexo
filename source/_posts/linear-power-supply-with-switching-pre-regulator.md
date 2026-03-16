---
title: Linear Power Supply with Switching Pre-Regulator
tags: []
categories:
  - PowerSupply
date: 2025-08-11 19:03:18
---

The OPA2189 is used as the main control operational amplifier, and the LM339 is used as the OVP/OCP/OTP protection comparator. Diodes are used to combine the CV/CC loop. Simulated crossover frequencies are 190kHz/100kHz. The output stage uses four parallel TIP41C transistors in conjunction with an 8050 as a Darlington output stage to reduce amplifier's current load.

<!-- more -->

[Schematic](https://alancui.cc/wp-content/uploads/2025/08/AlanDigiLinearv1.pdf)

The 12V 50% current step test shows that the CV loop's dominant pole frequency is approximately 27kHz with good phase margin, and the instantaneous undershoot is 1.1%. The 5A 50% voltage step test shows a 60% instantaneous current overshoot and loop is unstable, with a dominant pole frequency of 91kHz and an amplitude of 32%.

![](https://alancui.cc/wp-content/uploads/2025/08/alan-digilinev1-cv50percent-step.png)

![](https://alancui.cc/wp-content/uploads/2025/08/alan-digilinev1-cc50percent-step.png)

After changing the CC loop compensation, the dominant pole frequency is 3kHz, the loop is stable, but the response is poor. Note: The first peak is caused by capacitor discharge, and the first undershoot is caused by OCP recovery.

![](https://alancui.cc/wp-content/uploads/2025/08/alan-digilinev1-cc50percent-step2.png)
