---
title: Using the EmoePulse Avalanche Fast-Edge Generator to Generate True Random Numbers
tags: []
categories:
  - Cryptography
date: 2025-11-30 09:34:41
---
In today's world, cryptography has become the foundation of most digital infrastructure. The randomness in private key generation is a crucial prerequisite for modern cryptographic systems. Recently, I was gifted an [EmoePulse](https://rd.emoe.xyz/projects/EmoePulse/emoepulse.html) transistor avalanche fast-edge generator by friend. Although this generator is designed primarily for rise-time testing or TDR (Time Domain Reflectometry) measurements, the intrinsic noise from such transistors can also be effectively used to generate cryptographically secure true random numbers. The following describes how we can build a true random number generator with no post-processing based on this device.

<!-- more -->

![](https://alancui.cc/wp-content/uploads/2025/11/IMG_20251109_093408-1.jpg)

After connecting the generator to an oscilloscope, turn it on and acquire 100 million data points at a sampling rate of 500 MSa/s, saving them as a .mat file in MATLAB. The following script performs three main steps
- Extracting pulse event time intervals
- Applying low-pass filtering
- Directly taking the parity (even/odd) of these intervals as the output.

```matlab
Fs = 2e9;
Ts = 1 / Fs;

idx = find(C1_data > 10);
intervals = diff(idx) * Ts;

cutoff = 500e3; 
Wn = cutoff / (fs_evt/2);
N = 200;
b = fir1(N, Wn, 'low');

intervals_lp = filtfilt(b, 1, intervals);

window = max(floor(length(intervals_lp)/4), 32);
noverlap = floor(window/2);
nfft = max(256, 2^nextpow2(length(intervals_lp)));
[PSD, f] = pwelch(intervals_lp, window, noverlap, nfft, fs_evt);
figure;
plot(f/1e6, 10*log10(PSD));
xlabel('Frequency (MHz)');
ylabel('PSD (dB/Hz)');
title('PSD of Pulse Intervals (Low-passed @ 500 kHz)');
grid on;

data = intervals_lp(:); 
N = length(data);
scale = 1e9;
bits_raw = bitand(int64(round(data*scale)),1);
```

Results: In the 100Mpts dataset, we observed 794,624 avalanche events. The statistical minimum entropy was calculated as 0.990649, equivalent to a data rate of approximately 1.6 Mbps, and it passed all the NIST SP800-90 test suites in a brief manner.

However, due to the fact that more than 1 million bits are required for accurate entropy estimation — which would involve collecting about 100 GiB of data via an oscilloscope — this approach is not practical for real-world applications. Therefore, it's necessary to consider designing a dedicated PCB board specifically for the collection and transmission of the entropy source.

![](https://alancui.cc/wp-content/uploads/2025/11/photo_2025-11-28_04-12-11.jpg)
