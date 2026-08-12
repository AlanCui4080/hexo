---
title: Build a CAT for ICOM rigs with CI-V and Soundcard interface
tags: []
categories:
  - HAM
date: 2026-08-11 19:35:37
---

![](https://asset.alancui.cc/icom_civ_cat_and_soundcard.jpg)

I'm recently interesting on FT8 and other digi modes, and willing to make a high quality, fully isolated CAT adapter. So here it is. Using FT232RL and PCM2902 for CI-V and ACC audio interface, and the FE1.1s USB hub to tie them together on a single USB type B socket. The audio is isolated by two 600:600 audio transfomer and the CI-V interface with PTT is isolated by optocoupler, in order to block the protential RFI which may take the USB link down, also SMD ferrite beams are put on every pin at the rig side help blocking the RFI.

<!-- more -->

<embed src="https://asset.alancui.cc/icom_civ_cat_and_soundcard.pdf" type="application/pdf" style="width: 100%; height: 100vh"/>
