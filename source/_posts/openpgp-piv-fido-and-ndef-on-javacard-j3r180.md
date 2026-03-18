---
title: OpenPGP, PIV, FIDO, NDEF on NXP J3R180 JavaCard and usage principles to ensure safety 
tags: []
categories:
  - Cryptography
date: 2026-03-18 16:21:18
---
In fact, in modern cryptographic systems, the most insecure element is humans; therefore, secure usage guidelines are essential.
There's a joke that describes this scenario:

> : What if I lose my key and an attacker knows my PIN?

> : The attacker is you. Do it better next time.

<!-- more -->

### When Personalization

As we says in the "Introduction to JavaCard and Futhermore (NXP J3R180)", during an initialization, it's better to not use a contactless card reader, because the SCP02 protocol is proved to be **vulnerable** since 2018, attackers might be able to decrypt data during the card initlization process. But this is usually not a problem, You rarely write your private information into card in cleartext, almost all the protocols have its own secured message transport protocol.

However, to prevent potential malicious applet implantation and reduce the supply side, the following are some best practices:

- The attackers must be able to probe and modify the entire transaction and must be able to perform precise timing measurements, so simply a contact card reader can invalidate the exploit chain. At the same time, a secure and controlled environment can prevent such attacks. In fact, for contactless card readers, it is also very difficult to detect, modify, and measure timing from a distance.
- The same cleartext must be encrypted and sent multiple times, approximately 100 times to leak one byte of the message, either sent to different cards using different keys, or sent to the same card using different session keys. Therefore, key diversity is necessary for each different card, in the previous article, I used the EMV key derivation. 

Although 3DES has long been superseded and is not very secure, NIST has approved its use for encrypting information until 2030. That's four years away; at least for now, 3DES SCP (SCP02) remains secured. Because smart cards are designed to resist replay/brute-force attacks, post-incident cracking is impossible. Assuming a full-length (128 bits) key derivation source, I believe this is no less safte than your home WiFi's short PSK.

### Install Applets

If you have already securely personalized your cards, the next step is to install the app and initialize them.

For OpenPGP, i suggests [SmartPGP](https://github.com/github-af/SmartPGP), since the J3R180 is a really large card, we can use the RSA4096 version of firmware. But one thing to be mentioned, the SmartPGP requires you to specify serial number by specify application AID when installation

```bash
$ gp --install SmartPGPApplet-rsa_up_to_4096.cap --create d276000124010304A1A0<SERIAL IN 8 HEX CHARS>0000 --key emv:<KEY>
```

After installation, i'd strongly suggest to import RSA4096 key, because the PGP key is not designed for rotation, if you generate the key on card then you lose it, you lose all, and reconstruction of the trust chain is difficult. Also, the smart card is poor at performance, generate RSA4096 on card will take more than 90 secs!

For PIV, i use [PivApplet](https://github.com/arekinath/PivApplet), because it supports yubikey PIV extensions so we can manage this card with yubico-piv-tool. You must install ``REePSAxaD`` version since the yubico-piv-tool use 3DES manage key in default.For windows user, you must replace the driver to yubico proprietary PIV mindriver, Windows always break specifications, in this time, the windows default PIV minidriver is designed for readonly for all cards.

```bash
$ gp --install PivApplet-0.9.0-jc304-REePSAxaD.cap --key emv:<KEY>
```

Before executing each command with yubico-piv-tool, a card reader must be specified, otherwise, an error will occur. For the standard PIV 9e slot policy, this slot is used to prove the presence of a physical card and allows access without any PIN code, so we initialize it with a self-signed certificate.

```bash
$ yubico-piv-tool -r "" -a list-readers
$ yubico-piv-tool -r "SCM"  -a status # My reader is SCM SCR3310
$ yubico-piv-tool -r "SCM"  -a generate -s 9e > pubkey-9e.pem
$ yubico-piv-tool -r "SCM"  -a selfsign-certificate -s 9e -S "/CN=Alan PIV JavaCard Card Local Authority/O=Alan PIV JavaCard/OU=Card Local Authority/" < pubkey-9e.pem > cert-9e.pem
$ yubico-piv-tool -r "SCM"  -a import-certificate -s 9e < cert-9e.pem
$ yubico-piv-tool -r "SCM"  -a status
```

> #### Slot 9a: PIV Authentication
> This certificate and its associated private key is used to authenticate the card and the cardholder. This slot is used for things like system login. The end user PIN is required to perform any private key operations. Once the PIN has been provided successfully, multiple private key operations may be performed without additional cardholder consent.

> #### Slot 9c: Digital Signature
> This certificate and its associated private key is used for digital signatures for the purpose of document signing, or signing files and executables. The end user PIN is required to perform any private key operations. The PIN must be submitted every time immediately before a sign operation, to ensure cardholder participation for every digital signature generated.

> #### Slot 9d: Key Management
> This certificate and its associated private key is used for encryption for the purpose of confidentiality. This slot is used for things like encrypting e-mails or files. The end user PIN is required to perform any private key operations. Once the PIN has been provided successfully, multiple private key operations may be performed without additional cardholder consent.

> #### Slot 9e: Card Authentication
> This certificate and its associated private key is used to support additional physical access applications, such as providing physical access to buildings via PIV-enabled door locks. The end user PIN is NOT required to perform private key operations for this slot.

PIV actually has an additional 20 slots for storing expired certificates, but because PIV is so popular, almost all systems have a PKCS#11 implementation of PIV, and we can also use PIV as a HSM for self-built PKI.

For FIDO2, i'd like to use [FIDO2Applet](https://github.com/BryanJacobs/FIDO2Applet?tab=readme-ov-file). 

```bash
$ gp --install FIDO.cap --key emv:<KEY>
```
For the default installation, no external attestation certificate is present on the card, and adding an external attestation certificate is not allowed. Therefore, U2F (CTAP1) is almost unusable. Fortunately, most passkeys have now switched to using CTAP2.

Finally, i installed an little [NDEF](https://github.com/non-bin/coolNDEFthing) applet just for fun.

### Warning for security model

Since JavaCards do not have any external I/O, there is also no reliable method for measuring time passed. Implementations of user presence detection almost always "assume the user is always present". **Therefore, once you unlock the card, almost all the applets allow the device to silent authentication and encryption/decryption without any PIN input and user confirmation**.

For OpenPGP, card is fully unlocked and even allow unrestricted signing, the GnuPG scdaemon will not even turn the card power supply off (has no timeout)! The PIV, instead, allows only authentication and encryption/decryption, the signature requires user PIN input each time. However, please note that the PIV key policy depends on the certificate slot rather than the specific operation. For FIDO2, CTAP2 credentials have different security levels. Most passkeys use the highest level and require the user to enter a PIN each time to complete two-factor authentication (the physical key as the first factor, the PIn as the second factor). However, lower security levels only require the user to exist and the card can only represent one factor. As what I mentioned above, the card assumes the user persists after the initial decryption, and therefore silently signs low-security credentials. For the current FIDO implementation, the installation parameters can be modified to require a key to be provided for each operation. For all Applets: PGP, PIV, or FIDO, always set a strong PIN and change the PUK and Admin PIN/KEY (if applicable), otherwise, you're just running around naked.

So,

## Always stay with your card. Remove the smart card from reader when you leave even in controlled environments.

Tips, Windows requires the smart card to be removed and reinserted at each CTAP authentication. Good job, windows.
