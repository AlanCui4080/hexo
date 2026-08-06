---
title: Stop using Mix43 ferrite toroid, and why so
tags: []
categories:
  - HAM
date: 2026-08-06 08:23:43
---

The mix 43 ferrite is commonly known in HAM usages, for chokes and transformers (balun or unun). However, the choosing on this type of ferrite is actually a compromise made by the days that old HAMs could not get better toroids in a reasonable price.
<!-- more -->

### Choke or Transfomer

Clearly, for a transformer, we want the primary inductance to be as high as possible to not affect the impedance ratio, at the very least, require |Z| > 250. However, too high primary inductance often introduces excessive leakage inductance, resulting in poor high-frequency performance. Therefore, selecting the appropriate permeability is crucial. High permeability reduces the required number of turns but leads to a higher rate of magnetic flux change, increased losses, and greater parasitic capacitance. Conversely, low permeability necessitates more turns but reduces the rate of magnetic flux change and lowers parasitic capacitance. Meanwhile, it's important to keep cooling so requiring less loss.

For a choke, it supposed to be as resistive as possible to completely burn off any current that shouldn't be flowing through it. If it's inductive, it may resonate with the capacitive common-mode impedance, causing the common-mode current to increase instead of decrease. It's safe to get kind of hot, which meaning it's doing its job very well: burning the RFI, unless too close to Curie Point.

According to Amidon and Fairrite, the 43 Material is designed lossy, so can be used on broadband EMI suppression. In order that, it's not working good at any place passing powers like transfomers, but works well while being a choke.

### Table of Common Seen Ferrite Types

Here is a list for common types of ferrite toroids, where the mix 43 is easiest to buy, then 61, 31, and 52. And the price is 61, 52, 43, 31.

As what you can see, the mix 43 is lossy, mix 31 is quite more lossy due to it's low material resistance, which is specially designed for preventing "dimensional resonance limitations associated with conventional MnZn ferrite materials". But as far as I and the G3TXQ tested, the mix 43 is a better choke when working solo with carefully design, and the mix 31 is working wider without any attention and cheaper so we can put multiple toroid chokes in a line. 

Use the mix 43 toroid only for 80m band EFHW and lower, for higher band on EFHW, select mix 52, which may work at 10m as well but is a little lossy. The best choice is to make a OCFD (or EFRW) antenna using 9:1 unun which allow you to use the mix 61 meanwhile can also dive into 80m band. Remember, the mix 61 provides you up to **10x less lossy** than mix 43, and the mix 52 provides you up to **7x less lossy** than mix 43.

For MF operation, i'd suggest mix 43 also, the doubled permeability of mix 31 doesn't worth it for the higher loss. For LF operation, considering the huge inductance, mix 75 is more suggested.


| Mix  | 31 | 43 | 52 | 61 |
| :---: | :---: | :---: | :---: | :---: |
| Initial Permeability | 1500 | 850 | 250 | 125 | 40 |
| Loss Factor (e-6) | 20@0.1MHz | 250@1MHz | 45@1MHz | 40@2.5MHz |
| Xs-to-Rs transition frequency | 3MHz | 10MHz | 25MHz | 50MHz |
| Bands for 49:1 unun (3T-21T) | Never | **160m-40m** | 40m-10m | 20m-6m | 
| Bands for 9:1 unun (8T) | Never | 160m-40m | **160m-10m** | 80m-6m |
| Bands for 1:1 balun (12T) | Never | 630m-40m | 160m-10m | **160m-6m** | 
| Bands for RG-58 Choke | 80m-10m (9T) | 40m-VHF (12T) | UHF | Never | 

![alt text](https://asset.alancui.cc/mix-31-permability-freq.png)
![alt text](https://asset.alancui.cc/mix-43-permability-freq.png)
![alt text](https://asset.alancui.cc/mix-52-permability-freq.png)
![alt text](https://asset.alancui.cc/mix-61-permability-freq.png)

