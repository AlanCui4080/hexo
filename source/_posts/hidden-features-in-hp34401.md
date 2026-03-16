---
title: Hidden Features in HP34401
tags: []
categories:
  - Test&Measure
date: 2025-05-24 13:40:55
---

Reference discussion: [https://www.eevblog.com/forum/testgear/hp-agilent-34401a-hidden-menu/115/](https://www.eevblog.com/forum/testgear/hp-agilent-34401a-hidden-menu/100/).

<!-- more -->

## Hidden Features

These features have only been verified on 34401A firmware version 07-XX-XX and above. Before upgrading, back up your calibration data to avoid loss of data. The following information is adapted from [EEVblog](https://www.eevblog.com/forum/testgear/hp-agilent-34401a-hidden-menu/)，Writing 0 at the 3rd parameter will disable the corresponding feature.
```
DIAG:POKE 28,0,1191 Enable standard deviation and peak-to-peak measurements
DIAG:POKE 30,0,1191 nable internal temperature and external temperature sensor, and activate related SCPI commands (see 34970A)
DIAG:POKE 31,0,1191 Enable ratio calculation
DIAG:POKE 32,0,1191 Enable custom aperture settings
DIAG:POKE 33,0,1191 Enable state storage and automatic recall on power-up
DIAG:POKE 25,0,1 Enable 10 mA AC current range
DIAG:POKE 27,0,1 Enable 10 kHz AC filter
DIAG:POKE 29,0,1 Display raw measurement values in temperature measurement mode
```

#### SCPI Commands Activated by Instructions above

Note: In THERMistor, The first two use B = 3975, the last uses B = 3695.
```
CALCulate:AVERage:SDEViation?CALCulate:AVERage:PTPeak?
CONF:TEMPerature {TCoupleRTDFRTDTHERmistorDEF},{MINMAXDEF},{MINMAXDEF}
UNIT:TEMPerature {CFK}
SENSe:TEMPerature:TRANsducer:TYPE {TCoupleRTDFRTDTHERmistorDEF}
SENSe:TEMPerature:NPLCycles {0.020.2110100MINimumMAXimum}
SENSe:TEMPerature:TRANsducer:TCouple:TYPE {BEJKNRST}
SENSe:TEMPerature:TRANsducer:TCouple:RJUNction {MINMAX}
SENSe:TEMPerature:TRANsducer:RTD:TYPE {8591}
SENSe:TEMPerature:TRANsducer:RTD:RESistance:REFerence {MINMAX}
SENSe:TEMPerature:TRANsducer:THERMistor:TYPE {2200,5000,10000}
DIAGnostic:TEMPerature?
CALCulate:FUNCtion SCALe
CALCulate:SCALe:GAIN
CALCulate:SCALe:OFFSet
<Measure>:APERture {<Time>MINMAX}
MEMory:STATe:RECall:AUTO {OFF0ON1}
```
#### Verifying Whether the Feature Is Enabled
```
DIAG:PEEK? -10,1,0 Check standard deviation / peak-to-peak
DIAG:PEEK? -10,2,0 Check internal/external temperature sensors
DIAG:PEEK? -10,3,0 Check ratio calculation
DIAG:PEEK? -10,4,0 Check custom aperture
DIAG:PEEK? -10,5,0 Check state storage
```
## Additional PEEK & POKE Commands
```
DIAG:PEEK? -12,0,0 lookup block table in ROM data using index to stored address
DIAG:PEEK? -11,0,0 lookup NVRAM data by block using the index to stored address
DIAG:PEEK? -10,<FUNC>,0 Check whether a hidden feature is enabled
DIAG:PEEK? -9,0,0 No of rows in the block table
DIAG:PEEK? -8,0,0 [unsecured] enable: ``ZERO DCV``
DIAG:PEEK? -7,0,0 Read raw ADC data
DIAG:PEEK? -6,0,0 Read stack dump from last interrupt
DIAG:PEEK? -5,0,0 Check if there are pending interrupts
DIAG:PEEK? -4,0,0 Read power line frequency (1 = 50/400 Hz, 0 = 60Hz)
DIAG:PEEK? -3 ROM ref values for specified block number e.g. ``PEEK -2, 70, 0``
DIAG:PEEK? -2,<ADDR>,0 Read EEPROM high area (calibration) word in a specific format
DIAG:PEEK? -1,<ADDR>,0 Read EEPROM low area (settings) word, returned as decimal
DIAG:PEEK? 0,<ADDR>,0 Read RAM byte
DIAG:PEEK? 1,<ADDR>,0 Read RAM word
DIAG:PEEK? 2,<ADDR>,0 Read RAM double word
DIAG:PEEK? 3<ADDR>,0, Read RAM float
DIAG:PEEK? 25,0,0 Output ``*IDN`` string
```
#### Dangerous Write Operations
```
DIAG:POKE 34,0,0 Reset CPU
DIAG:POKE 23,0,0 Reset calibration counter
DIAG:POKE 0,0,0 增Increment calibration counter
DIAG:POKE -2,<ADDR>,<DATA> Write RAM byte
DIAG:POKE -3,<ADDR>,<DATA> Write RAM word
DIAG:POKE -4,<ADDR>,<DATA> Write RAM float
```
## Retrieving Calibration Data
```
DIAG:PEEK? -2,<RANGE>,0
```
Range indices from lowest to highest:
- DCV 75-79  
- DCI 82-85  
- OHM 87-92  
- OHM4 94-99  
- ACV 104-108

Returned format:
``<coefficient>, <left shift>, <0>, <front panel offset>, <rear panel offset>``
After applying the linear transformation, a second-order and third-order correction term must still be added. 
