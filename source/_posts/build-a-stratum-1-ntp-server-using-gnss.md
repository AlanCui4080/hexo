---
title: Build a Stratum 1 NTP Server using GNSS PPS Signal and chronyd
tags: []
categories:
  - Time&Frequency
date: 2025-11-24 23:33:21
---

Recently, I bought a Wyse 5070 thin client and planned to turn it into an internal network comprehensive server. One of the goals is to set up a precise internal NTP server. Therefore, I used the existing GNSSDO's PPS signal output through RS-232 DCD input to the thin client and used it as a PPS signal source to tame chronyd. The date and time information can be obtained either via NEMA messages or other NTP servers.

<!-- more -->


Install and configure of software packages:

``$ sudo apt install gpsd chrony pps-tools``

Write ``/etc/systemd/system/ldattach-pps@.service`` to use RS-232 DCD as a PPS source every time the system boots:
```inf
[Unit]
Description=Enable %i as PPS source
Before=network.target

[Service]
ExecStart=/usr/sbin/ldattach PPS /dev/%i
Type=forking

[Install]
WantedBy=multi-user.target
```

``sudo systemctl enable ldattach-pps@ttyS0.service``

Write the gpsd configuration file:
```
START_DAEMON="true"
GPSD_OPTIONS="-n"
DEVICES="/dev/ttyS0"
USBAUTO="true"
GPSD_SOCKET="/var/run/gpsd.sock"
```


Write the chrony configuration file ``/etc/chrony/sources.d/gps.sources``, which can be referenced from [https://chrony-project.org/doc/3.4/chrony.conf.html](https://chrony-project.org/doc/3.4/chrony.conf.html). delay is used to ensure that the server selects PPS as a reference source, poll 1 represents polling the clock source every two seconds, offset is used to compensate for the overall time difference between PPS and RS-232 output, but it's not significant under PPS驯服. width 0.1 explicitly declares the pulse width of the PPS signal, which is said to reduce jitter.
```
refclock SHM 0 refid GPS offset 0.1642 delay 0.2 poll 1
refclock PPS /dev/pps1 refid PPS offset 0.0 poll 1 filter 1024 width 0.1 lock GPS
```


If using an external NTP server as the source of date and time, you can add the following list to /etc/chrony/sources.d/external-server.sources. minpoll 10 ensures that the polling interval is at least 1024 seconds; by default it's 6, which may be too frequent.
```
server ntp.ntsc.ac.cn iburst minpoll 10
server ntp.tencent.com iburst minpoll 10
server ntp.aliyun.com iburst minpoll 10
server ntp1.nim.ac.cn iburst minpoll 10
server ntp.tuna.tsinghua.edu.cn iburst minpoll 10
server ntp.sjtu.edu.cn iburst minpoll 10
server time.ustc.edu.cn iburst minpoll 10
server time.windows.com iburst minpoll 10
```


At this point, you can start chronyd and gpsd and observe the running status.

``$ sudo systemctl restart chronyd sudo systemctl restart gpsd watch -n1 chronyc sources -v``

I made a poor PPS to RS-232 DCD adapter cable by direct connect DCD to PPS output of GPS Receiver. Although it severely deviates from the voltage standard, it works well: (so I didn't finally use ttyS0 as GPS NEMA message transmission link, but instead used Ublox USB CDC-ACM)

