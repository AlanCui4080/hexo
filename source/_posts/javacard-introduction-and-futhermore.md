---
title: Introduction to JavaCard and Futhermore (NXP J3R180)
tags: []
categories:
  - Cryptography
date: 2026-03-16 20:23:43
---

Simply Saying, JavaCard is a kind of SmartCard with JavaCard VM, which can run any JavaCard applet.The opening of Java Card specification makes JavaCard really easy to program instead of old-style Proprietary CPU Card that requires signing up for NDK. In that case, due to the cost of sharing their confidential documents, technical support and production, most of the Manufacturers will not even make a contract with you a little company!So that the JavaCard is the only way we can customize and program SmartCard as safe as CC EAL6+ at low cost.

<!-- more -->

### Get a JavaCard

Actually, you can get JCOP4.5 P71 easily from AliExpress or Taobao, a typical J3R180 costs only about $3-$4 while the minimal order quantity is one. You can choose uninitlized (unprepersonalized), unfused or fused card(prepersonalized), even more, you can choose a already secured card(personalized).
Furthermore, a PC/SC compatiable card reader is necessary, it may be better to have USB CCID interface, a SCR3210 is good enough with costing only $4-$5. It is not recommended to use contactless card readers for card opening and program downloading. Insufficient power supply to the programming EEPROM and Flash memory can damage the card. Since most cards use the SCP02 protocol and 3DES keys, contactless card readers may pose potential security risks by may be listening by others. Furthermore, because JavaCard is the implementation for almost all bank cards and SIM cards, security requirements make these cards **highly susceptible to self-locking (bricking) due to improper operation**, therefore, please think carefully before entering any commands.

> Wait, What is prepersonalization, prepersonalization or fusing?

### Configure JavaCard

#### Prepersonalization and Fusing

Every card was unfused and uninitialized at factory, they will be programmed with a TransportKey (TK) by vendor, the TK protects the card from unauthorized access during logistics and transportation. When the card got by card issuer, the issuer unlocks the card with TK, then initialize the card with parameters such as ATR, SCP key to communicate with Issuer Security Domain (ISD) and so on. This process is called initialization or prepersonalized, in exact, it contains multiple Vendor-Specific APDUs, like following command sequence:

Warning: **DON'T** TRY THIS ON YOUR CARD, CONTACT YOUR VENDOR OR DISTROBUTOR FOR INITLIZATION SEQUENCE, OR **IT MAY BRICK YOUR CARD**.
```
APDU:
00 A4 04 00 10 XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX (KEY <TK>)
00 F0 00 00 (FACTORY RESET)
C0 D6 01 23 01 DA (Set T=1 in cold state)
C0 D6 01 46 01 DA (Set T=1 in warm state)
C0 D6 01 22 01 FE (Set T=1 block parameter)
C0 D6 01 24 01 0F (Set IFSC size=16)
C0 D6 01 37 0B 0A 4A 43 4F 50 34 31 56 (ATR Hist="JCOP41V231" in cold state)
C0 D6 01 5A 0B 0A 4A 43 4F 50 34 31 56 (ATR Hist="JCOP41V231" in warm state)
C0 D6 03 05 10 XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX (Set key slot 1 <SCPKmac>)
C0 D6 03 21 10 XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX (Set key slot 2 <SCPKenc>)
C0 D6 03 3D 10 XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX (Set key slot 3 <SCPKdek>)
00 10 00 00 (PROTECT)
00 00 00 00 (FUSE)
```

#### Personalization and GP Initlizate

After fusing, the card starts to work and can really response APDUs. The ISD, as known as Card Manager, is available to us now. Therefore, if you got a card without prepersonalization and fusing, you must get TK from your vendor; a card prepersonalized but unfused allows you to change underlying configurations of card, then a fused card don't. After fused, the card's TK becomes useless, therefore, to a certain extent, the TK does not need to be kept secret. In such a fused state, we can communicate with Card Manager, in most cards, it's GlobalPlatform, there is a utility call [GlobalPlatformPro](https://github.com/martinpaljak/GlobalPlatformPro) to deal with it. such as:
```
$ gp -i
# GlobalPlatformPro v25.10.20
# Running on Windows 10 10.0 amd64, Java 21.0.7 by Oracle Corporation
CPLC: ICFabricator=****
      ICType==****
      OperatingSystemID=4700
      OperatingSystemReleaseDate=0000 (invalid date format)
      OperatingSystemReleaseLevel=0000
      ICFabricationDate=3162 (2023-06-11)
      ICSerialNumber=********
      ICBatchIdentifier=7337
      ICModuleFabricator=0000
      ICModulePackagingDate=0000 (invalid date format)
      ICCManufacturer=0000
      ICEmbeddingDate=0000 (invalid date format)
      ICPrePersonalizer==****
      ICPrePersonalizationEquipmentDate==**** (invalid date format)
      ICPrePersonalizationEquipmentID==******
      ICPersonalizer=0000
      ICPersonalizationDate=0000 (invalid date format)
      ICPersonalizationEquipmentID=00000000

KDD: CF0A0000******************
SSC: C102*****
Card Data:
Tag 6: 1.2.840.114283.1
-> Global Platform card
Tag 60: 1.2.840.114283.2.2.3
-> GP Version: 2.3
Tag 63: 1.2.840.114283.3
-> GP card is uniquely identified by the Issuer Identification Number (IIN) and Card Image Number (CIN)
Tag 6: 1.2.840.114283.4.2.85
-> GP SCP02 (i=55)
Tag 66: 1.3.6.1.4.1.42.2.110.1.3
-> JavaCard v3
Card Capabilities:
Supports SCP02 i=15 i=35 i=55 i=75
Supported DOM privileges: SecurityDomain, DAPVerification, DelegatedManagement, CardReset, MandatedDAPVerification, TrustedPath, TokenVerification, GlobalDelete, GlobalLock, GlobalRegistry, FinalApplication, ReceiptGeneration, CipheredLoadFileDataBlock
Supported APP privileges: CardLock, CardTerminate, CardReset, CVMManagement, FinalApplication, GlobalService
Supported LFDB hash: SHA-256
Supported Token Verification ciphers: RSA1024_SHA1, RSAPSS_SHA256, CMAC_AES128, CMAC_AES192, CMAC_AES256, ECCP256_SHA256
Supported Receipt Generation ciphers: DES_MAC, CMAC_AES128
Supported DAP Verification ciphers: RSA1024_SHA1, RSAPSS_SHA256, CMAC_AES128, CMAC_AES192, CMAC_AES256, ECCP256_SHA256
Version: 255 (0xFF) ID:   1 (0x01) type: DES3         length:  16 (factory key)
Version: 255 (0xFF) ID:   2 (0x02) type: DES3         length:  16 (factory key)
Version: 255 (0xFF) ID:   3 (0x03) type: DES3         length:  16 (factory key)
```
As you can see, the card manager is now responding correctly to our requests. At this point, you need to obtain the SCP key, whether it was written by the prepersonalization process or obtained from the reseller. Then you can perform query for applets installed and the state of the card manager.

Warning: **DON'T** TRY MULTIPLE TIMES OF WRONG KEY ON YOUR CARD, CONTACT YOUR VENDOR OR DISTROBUTOR FOR SCP KEY, OR **IT MAY BRICK YOUR CARD**.
```
$ gp -lv -key-enc ******************************** -key-mac ******************************** -key-dek ********************************
# GlobalPlatformPro v25.10.20
# Running on Windows 10 10.0 amd64, Java 21.0.7 by Oracle Corporation
[INFO] GPSession - Using card master key(s) with version 0 for setting up session with MAC
[INFO] GPSession - Diversified card keys: ENC=******************************** (KCV: ******) MAC=******************************** (KCV: ******)DEK=******************************** (KCV: ******) for SCP02
[INFO] GPSession - Session keys: ENC=******************************** MAC=******************************** RMAC=********************************
ISD: A000000151000000 (OP_READY)
     Parent:   A000000151000000
     From:     A0000001515350
     Privs:    SecurityDomain, CardLock, CardTerminate, CardReset, CVMManagement, TrustedPath, AuthorizedManagement, TokenVerification, GlobalDelete, GlobalLock, GlobalRegistry, FinalApplication, ReceiptGeneration

PKG: A0000001515350 (LOADED) (SSD creation package)
     Parent:   A000000151000000
     Version:  255.255
     Applet:   A000000151535041 (SSD creation applet)

PKG: A0000000620204 (LOADED) (javacardx.biometry1toN)
     Parent:   A000000151000000
     Version:  1.0

PKG: A0000000620202 (LOADED) (javacardx.biometry)
     Parent:   A000000151000000
     Version:  1.3
```
If everything is working correctly (or you bought a fused card), you should get the OP_READY status. You can start personalizing now. If you bought a fused card change the 3DES SCP Key is necessary:

To use diversity-derived keys:
```
$ gp -lock emv:<NEW 128bits KEY HEX> -key-enc <OLD SCP KEY HEX> -key-mac <OLD SCP KEY HEX> -key-dek <OLD SCP KEY HEX>
or
$ gp -lock emv:<NEW 128bits KEY HEX> -key <OLD SCP KEY HEX>
```

To use 3 plaintext keys:
```
$ gp -lock-enc <NEW 128bits KEY HEX> -lock-mac <NEW 128bits KEY HEX> -lock-dek <NEW 128bits KEY HEX> -key-enc <OLD SCP KEY HEX> -key-mac <OLD SCP KEY HEX> -key-dek <OLD SCP KEY HEX>
or
$ gp -lock-enc <NEW 128bits KEY HEX> -lock-mac <NEW 128bits KEY HEX> -lock-dek <NEW 128bits KEY HEX> -key <OLD SCP KEY HEX>
```

After that, you can personlize the card. (In following command, the AAAA is ICPrePersonalizer the BBBB is ICPrePersonalizationEquipmentID, the ICPrePersonalizationEquipmentDate is set to today so remaning the 3rd and 4th bytes zero):
```
$ gp -set-perso AAAA0000BBBBBBBB -today [SCP KEY PARAM (e.g. -key emv:xxxx or -key-enc xxxx -key-mac xxxx -key-dek xxxx)]
```

Caution: Keep your SCP keys safe! If someone obtains your SCP keys, they can implant any applet into your smart card. This weakens card security and could even lead to forged and fraudulent card responses.

If you are certain that you no longer need to change the card manager settings, you can now initialize and secure the card.
```
$ gp -initialize-card <SCP KEY PARAM>
$ gp -secure-card <SCP KEY PARAM>
```
Query ISD again to confirm that:
```
$ gp -lv <SCP KEY PARAM>
# GlobalPlatformPro v25.10.20
# Running on Windows 10 10.0 amd64, Java 21.0.7 by Oracle Corporation

... 

ISD: A000000151000000 (SECURED)
     Parent:   A000000151000000
     From:     A0000001515350
     Privs:    SecurityDomain, CardLock, CardTerminate, CardReset, CVMManagement, TrustedPath, AuthorizedManagement, TokenVerification, GlobalDelete, GlobalLock, GlobalRegistry, FinalApplication, ReceiptGeneration

...

```
#### Install Applets
Congratulations! The card is now fully initialized and ready to download applets. In fact, most applets can be installed into smart cards as long as the card's version requirements are met (and there is sufficient NVMEM remaining) by following command:
```
gp --install <CAPFILE> <SCP KEY PARAM>
```
And remove by:
```
gp --uninstall <CAPFILE> <SCP KEY PARAM>
```
But for SmartPGP, You'd better add ``--create d276000124010304A1A0[SERIAL IN 8 HEX CHARS]0000`` into the paramater list, so that it can have a unique serial number.

Here are some suggested applets:
- OpenPGP: https://github.com/github-af/SmartPGP 
- PIV: https://github.com/arekinath/PivApplet
- FIDO2: https://github.com/BryanJacobs/FIDO2Applet
- NDEF: // https://github.com/non-bin/coolNDEFthing

### What's more
On a JavaCard, all ``static`` objects and objects created with ``new`` reside in the NVM, while only stack frames reside in SRAM. Furthermore, for a JavaCard Applet, execution begins at the start of an APDU and ends upon its return. Therefore, a poorly constructed program can eventually exhaust all NVM and completely halt the card's responsiveness! Reinserting the card will not resolve the issue; the only solution is to uninstall and reinstall the program.

For most NXP JCOP cards, they are some utility APDUs. 

Get Free Memory
```
$ gp --apdu 80CAFF2100  <SCP KEY PARAM>
[ff21]
     [81] 0004      // Number of Installed Applets
     [82] 0000f1cc  // Free EEPROM/Flash in bytes
     [83] 000002da  // Free SRAM in bytes
```

Get Card Details (JCOP3-)
```
$ gp --apdu 00A4040009A000000167413000FF00
```
![](/image/javacard-below-jcop3-identify.png)

Get Card Details (JCOP4+)
```
$ gp --apdu 80CA00FE02DF2800
[fe]
     [df28] ... // Can be parsed by [This document](https://cyber.gouv.fr/uploads/2017/09/anssi_cible2017_43en.pdf)

```
![](/image/javacard-above-jcop4-identify.png)

qwq
![](/image/javacard-introduction-two-j3r180.png)
