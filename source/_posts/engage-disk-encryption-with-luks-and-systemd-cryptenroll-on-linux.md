---
title: Engage Disk Encryption with LUKS and systemd-cryptenroll on Linux
tags: []
categories:
  - Cryptography
date: 2026-04-08 14:17:40
---

The TPM, Trusted Platform Module, is well-known by the forced requirements of Windows 11 and automatic Device Encryption aka Bitlocker, which makes lots of people lose they data. However, using a TPM is the best way to protect your digital world in modern times. It's basically a smartcard mounted on the system, in major, accept hash to 'extend' (like NEW = HASH(OLD + PROVIDED)) internal SHA PCRs (Platform Configuration Register), and release key when the PCRs are as same as the key registered for. When the system is booting, the ucode in CPU measures the ucode it self, the UEFI firmware, and the Secured Boot state into the TPM, then pass system control to UEFI firmware. The PCRs can be only reset to zero on the platform hardreset.

<!-- more -->

For a full TPM2 Introduction, see https://trustedcomputinggroup.org/resource/a-practical-guide-to-tpm-2-0/.

### "Fun" Facts

The dTPM is vulnerable to bus intrusion, but here is the facts:
- Sniffer on bus will not leak your key, all morden TPM facility supports parameter or bus encryption against bus sniffering attack, the systemd-cryptenroll supports for parameter encryption and SRK certification. MITM can neither get the key due to systemd will do TOFU (trust on first use), but they can modify the firmware and make the secured boot chain failed, unless with BootGuard.
- The attacker can't modify the PCRs, they are pretected by HMAC. But the attackers can replay the entire PCRs history, also for fTPM, unless with BootGuard.
- All attacks above can be prevent by simply setting up an PIN, when you input the PIN, you are on duty of the integrity of the hardware. If a attacker can spy your TPM, they can also install a keyboard logger easily.
- The fTPM has not gained any security certifications, and because it resides inside the CPU and is executed by firmware, its secure storage area relies on UEFI firmware, and on standard CPU silicon. In contrast, dTPM has an independent secure storage area and specialized silicon-level hardware guarantees. 
- Human are vulnerable to Rubber-hose cryptanalysis.

In short words, **if you are not using a PIN**, then you did not enable BootGuard, YOU'RE DONE. If you enabled BootGuard, then you did not use a encrypting PIN pad, YOU'RE DONE. **if you are using a PIN**, then you did not checked the integrity of hardware before input the PIN, YOU'RE DONE. If attackers are got the control of the operating system, even only once, YOU'RE DONE. If attackers are got PIN and the TPM/SmartCard at the sametime, the attacker is yourself, do better next time. 

So, in this article, the security model is basically against someone just take your device off, Not CIA tracking, if they are, why not to put backdoors on your smartcard lol. Just should see only the TPM or smartcard as a password policy enforcement.

### Prepare

The UEFI secured boot is not necessary for Disk Encryption, but without secured boot, it's more complicated to setup to let TPM measure your kernel and initrd against (yes, the measurement will change every time you update the kernel then you have to enroll the key again). I'd suggest to use `sbctl` to deal with secured boot. Besides, the UKI is strong suggested, because it reduces the number to be verified in secured boot, and make the setup progress more smoothly.

### Do Disk Encryption

All you need is `systemd-cryptenroll /dev/sdx --tpm2-device=auto`.

### Bind to PCR

**However, decryption based on default PCR parameters are still not recommended because**:
- The systemd defaults to only binding to PCR7: this assumes that all UEFI firmware is properly signed and that you trust Microsoft. That will expose you to all attacks following.
- Both Microsoft and your OEM often cannot properly guard keys; Microsoft has even signed for Bootkits in the past.

If your distribution does not frequently update its kernel (and your initramfs), you can consider binding to PCR9 (measuring the kernel and initrd) `--tpm2-pcrs=7+9`.

If you do not trust Microsoft or for a custom UEFI PK, I also recommend using PCR0+2 `--tpm2-pcrs=0+2+7[+9]`(measuring the UEFI firmware and OptionROM), because relying only on PCR7 without measuring earlier PCRs might allow malware to persist by installing Bootkits after compromising the computer. If you need to guard against cold boot attacks, it is recommended to bind to PCR1 (measuring boot entries and boot order) `--tpm2-pcrs=0+1+2+7[+9]`, or enable memory encryption. If you use a bootloader that is not freqently update, you can consider measuring PCR4 (measuring UEFI Applications) (not recommended).

It is worth nothing that even if you bind only to PCR9 to measure the initrd, an attacker can still remove the hard drive, backup and replace the root partition to a malicious one. After the TPM auto decryption fails, they enter the password, this will allow the kernel to boot normally into the malicious root partition. At this point, even the execution flow leaves the initrd, there will be no change to the PCRs, which allows the attacker to obtain the original keys from the TPM. To mitigate this, it is recommended to bind to PCR7+9+11 (measuring every boot phase)`--tpm2-pcrs=7+9+11`, or use Unified Kernel Images (UKI) and bind only to PCR7+11`--tpm2-pcrs=7+11` , the value of PCR 11 will change when leaving the initrd makes no one can really get your key at stage 2 (/ volume).

For users of UKI, since the UKI is signed, PCR7 can indirectly measure the the UKI (if key security can be guaranteed), so binding only to PCR7 without 11 avoids updating the TPM every time the kernel rotates. And, **this exposes us to malicious root partition attacks**. Therefore, it is advised to consider binding to all-zeroed PCR15 `--tpm2-pcrs=7+15:sha256=0000...` and executing `tpm2-measure-pcr=yes` in `/etc/crypttab.initramfs`. This ensures that when leaving the initramfs, the PCR15 has a value, thus preventing attackers from decrypting the partition. Furthermore, you can consider setting `fixate-volume-key=xxx`, which will cause the initrd to refuse decryption for partitions whose derived key hash does not match.

`cat /run/log/systemd/tpm2-measure.log` can explain how PCR11 or PCR15=0 can prevent us from malicious root partition attacks

```json
{"pcr":11,"digests":[{"hashAlg":"sha256","digest":"xxx"}],"content_type":"systemd","content":{"string":"enter-initrd","bootId":"xxx","timestamp":4061113,"eventType":"phase"}}
{"pcr":15,"digests":[{"hashAlg":"sha256","digest":"xxx"}],"content_type":"systemd","content":{"string":"cryptsetup:root:5e47a9db-xxxx-xxxx-xxxx-xxxxxxxxxx" "bootId":"xxx","timestamp":12236888,"eventType":"volume-key"}}
{"pcr":11,"digests":[{"hashAlg":"sha256","digest":"xxx"}],"content_type":"systemd","content":{"string":"leave-initrd","bootId":"xxx","timestamp":12310110,"eventType":"phase"}}
...
```

In summary, I have chosen `--tpm2-pcrs=0+2+7+15:sha256=0000` and protected the TPM with a PIN. Not use PCR9/11 is due to the following considerations: I use Arch Linux, which is a rolling distro that updates its kernel very quickly, and i will use UKI, so I will not bind to PCR9 , and PCR11 is not used also because I do not want to configure complex PCR policies (I use sbctl). This requires to use PCR15 to protect against malicious root volume attacks, and my Secure Boot keys are stored on the encrypted root volume, although if root privileges are compromised, all things becomes meaningless. But to prevent Bootkit persistence, at least, as a tamper,I bind to PCR0+2 to protect the firmware.

```bash
systemd-cryptenroll /dev/sdx --tpm2-device=auto --tpm2-pcrs=0+2+7+15:sha256=0000000000000000000000000000000000000000000000000000000000000000
```

Despite following strict PCR measurements and enabling DMA protection, **you should protect the TPM with a PIN, and check the integrity of the hardware before entering the PIN**. This does not mean that the aforementioned PCRs are meaningless; they can warn you about changes to system components, rather than just let TPM acting as a password policy enforcement.

#### PCRs table
```text
PCRx  Canonical Usage,        Typical Usage (on Desktop)
========================================================
PCR0  Firmware code,          CRTM (Core Root of Trust for Measurement, usually ucode), UEFI firmware
PCR1  Firmware config,        Hardware, Boot Order and Boot Entry
PCR2  OptionROM code,         GPU, Network adapter
PCR3  OptionROM config,       Not used (on my platform)
PCR4  BootManager code,       UKI kernel or systemd-boot or grub or Windows Bootloader or shim
PCR5  BootManager config,     GPT partition table, systemd-boot loader.conf
PCR6  OEM event,              Not used (on my platform)
PCR7  Secure Boot State,      PK,KEK,db,dbx,if enable or not

=== For Linux ===
PCR8  grub,                   grub commandline, kernel commandline
PCR9  grub,systemd            kernel and initrd, NvPCR anchor
PCR10 kernel                  IMA (Integrity Measurement Architecture)
PCR11 systemd                 UKI, boot phase
PCR12 systemd                 kernel command line, system credentials, initrd, ucode, devicetree
PCR13 systemd                 initrd
PCR14 shim                    MOK (Machine Owner Key)
PCR15 cryptsetup              volume key (optional), machine id, mountpoint (optional), UUID of /root and /var

=== For Windows ===
PCR8  NTFS                    NTFS Boot Sector (Legacy)
PCR9  NTFS                    NTFS Boot Block (Legacy)
PCR10 BootMgr                 Windows Boot Manager (Legacy)
PCR11 Bitlocker               Bitlocker Access Control  
PCR13 -                       Data events and highly volatile events
PCR14 -                       Boot Module Details
PCR15 -                       Boot Authorities
... 

=== General ===
PCR16 debug                   -

=== DRTM (Dynamic Root of Trust for Measurement) (Intel) ===
PCR17 SINIT                   DRTM, DRTM policy (SINIT ACM, SINIT heap attr, SINIT launch policy)
PCR18 SINIT                   MLE (Measured Launch Environment) (Trustable OS Bootmgr) 
PCR19 SINIT                   Trustable OS Bootmgr config
PCR20 Trustable OS            Trustable OS Kernel and Driver(?)
PCR21 Trustable OS            Trustable OS, SGX
PCR22 Trustable OS            Geography Location (https://www.nccoe.nist.gov/sites/default/files/legacy-files/nistir-7904-draft.pdf)

=== General ===
PCR23 application             -
```