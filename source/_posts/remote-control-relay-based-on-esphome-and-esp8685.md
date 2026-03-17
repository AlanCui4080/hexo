---
title: Remote Control Relay Based on ESPHome and ESP8685
tags: []
categories:
  - HomeAssistant
  - Embedded
date: 2026-03-03 19:51:16
---

Driven by the lazy to turn off the lights when in bed, an attempt was made to upgrade the existing lighting fixtures to be intelligent. Choose ESP8685-WROOM-3 (i.e., ESP32-C3), the smallest vertically mounted ESP32 module, was selected. The power supply section uses an LS05-13B05R3 flyback module. 

<!-- more -->

[Schematic](https://asset.alancui.cc/legacy-uploads/2026/03/b7ce3d0a-f06b-45f7-965c-541617357c09.pdf)

The final power consumption is 0.8W when off and 1.9W when on. It is worth noting that, to ensure interoperability with traditional switches, the relays are configured to be in the default on state. This results in the system activating the relays approximately 400ms after power-on, but still exhibits a significant delay. Furthermore, the overall capacitance is too large, and the power-off hold time is too long, causing the fast-switch to fail to reset and turn on the lights properly when the module is in a remote off state. Therefore, in future versions, it is necessary to reduce the output capacitance and also ensure that the relay control logic is in the on state by default to minimize power-on delay. (Bluetooth relay is also enabled in the configuration file because the installation location of the ceiling light is indeed suitable for collecting Bluetooth sensor messages.) The circuit meets EN55032 CLASS B and IEC/EN61000-4-2 Contact ±6KV / Air ±8KV ESD, IEC/EN61000-4-5 line to line ±2KV.

![](https://asset.alancui.cc/legacy-uploads/2026/03/IMG20260303151711.jpg)

Here's the configuration yaml of ESPHome:
```yaml
substitutions:
  name: "alan-esphome-relay-v1"
  friendly_name: "AlanESPHomeRelayv1"

esphome:
  name: "${name}"
  friendly_name: "${friendly_name}"
  name_add_mac_suffix: true

switch:
  - platform: gpio
    pin: GPIO3
    name: "AC Relay Switch"
    restore_mode: ALWAYS_ON

esp32:
  variant: esp32c3
  flash_size: 4MB    
  framework:
    type: esp-idf
    

# Enable logging
logger:
  level: DEBUG
  hardware_uart: "UART0"

# Enable Home Assistant API
api:
  port: 6053
  batch_delay: 50ms  # Reduce latency for real-time applications
  listen_backlog: 2  # Allow 2 pending connections in queue
  max_connections: 6  # Allow up to 6 simultaneous connections
  max_send_queue: 10  # Maximum queued messages per connection before disconnect
  encryption:
    key: ""
  reboot_timeout: 30min
    
ota:
  - platform: esphome

wifi:
  ssid: ""
  password: ""

  ap:
    ssid: "alan_esphome_relay_v1_bkup"

captive_portal:

web_server:
  port: 80

sensor:
  - platform: wifi_signal
    name: "WiFi Signal Strength"
    update_interval: 10s

esp32_ble_tracker:

bluetooth_proxy:
  active: true
```
