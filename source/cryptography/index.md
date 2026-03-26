---
title: Public Key and Certificate
date: 2026-03-16 20:23:43
---
# Public Key and Certificate

This page contains all the cryptographic documents I'm using.

## PGP

I do NEVER upload my key to public key server, so you shouldn't also.

**Keyring (9A1A 067C 0066 CCFF)**

```
pub   rsa4096 2022-04-19 [SC] [expires: 2027-03-09]
      2EC3C10C4296288F07D6564E9A1A067C0066CCFF
uid           [ultimate] AlanCui4080 <me@alancui.cc>
sub   rsa4096 2022-04-19 [E]
      50BCE264C636FB06E21E29B9DAFB5050FB4FF071
sub   rsa4096 2022-04-20 [A]
      9884BAA4F11B89DD898BCE501CED6AB779579774
sub   rsa4096 2022-04-20 [S]
      94489F27279E1CDE42A6B40F45240EDAAA095AE6
```

```bash
curl -sSL https://key.alancui.cc/alanpgp.asc | gpg --import
```


**Derived SSH key (0x79579774)**

> SHA256:B+pus/Iwmtpxp0eFWHzQHNxZl9fZRTk1KY4efCJ5pDo

```
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDez9RSWfSMrz725VThz8CcPp1Ary6AUoiec4fH2ohZ5doqMwegLd89JthyEjN+aMplPNRmWl0wrPk06Hgg4wh7CGy0QbzZUcMyWtYU+HDUXSef33zNcaW9VHSUJZx9TyGg1Hi420IxODhw1zYC/5SUhKxVPKAqlZfFFFA9n9OL2Ma+uzt2axpsCqejVqUHSgIFFtB7cTKl1sY5P5ijmx7ctaTu28/al0XPSIoigLbTMm/vhcKeFhVhrXF1GqoLsIO2yaOqwZx6k95Fx18H84MWlmU0gDo+WHneU9HTJwLOT03QPBeE/uNe5pHhi2IHRYWjb3ZlO7HGlnBv8kCMyp2ZIb9tKsHlSKTqm6endPorXhilgbAg13+kxHqovQloHsRN2YEja9TgVCcS7ENb10K+DFcXfS8u3Pk1rHWxMVGBJqQDKMuTUuiIwfRHo9TBlhUpHiL7J9d7B0NgYnApxbhGQmAmnnD1ZMijPTbAvtnMnenx3K2+nDwt4zxLhxtmuEY1nhkAxrQwR+C8dCpkbR13b5SNSazJk1wiRpI5h9K/yUcc5/vmObBpyqi5mvIJu9rcoN7AlTSNR6sie6N/UEa390dPmk4WNQUuAJ4apcnnmFEF6beWFlYLzJlyvmjSWxvExpZrbAtYJnP6VaObKASp+PPgpfMtzXhqvjg4DVT2ow== openpgp:0x79579774
```

```bash
curl -sSL https://key.alancui.cc/alanssh.asc >> ~/.ssh/authorized_keys
```

## PKI
**Alan Trust Root Authority**

Issuance Policy: Any subject that is controlled by me, if you trust me, then trust this root.

Certificate Policy: OCSP Not Provided, CRL Available

```
Issuer:
    OU=Root Authority
    O=Alan Trust
    CN=Alan Trust Root CA
  Name Hash(sha1): acbe1d6af9d96066cda8ce517a6140bfebb786dc
  Name Hash(md5): 43442ade5e6cb860818ff4c1b24fb812
Subject:
    OU=Root Authority
    O=Alan Trust
    CN=Alan Trust Root CA
  Name Hash(sha1): acbe1d6af9d96066cda8ce517a6140bfebb786dc
  Name Hash(md5): 43442ade5e6cb860818ff4c1b24fb812
Cert Serial Number: 1ea4ed7ac9289b4dc1eb8a2eaea2146760f0dde8
```

```bash
curl -sSL https://pki.alancui.cc/root-ca.crt >> /usr/local/share/ca-certificates/root-ca-alantrust.crt
```

## Android APK Signing 

**Abstract**
```
Certificate [1]: 
Owner: C=CN, CN=Alan Cui
Issuer: C=CN, CN=Alan Cui
Serial Number: 1
Effective Date: Sun Feb 08 16:37:43 CST 2026, Expiry Date: Wed Feb 06 16:37:43 CST 2036
Certificate Signature Algorithm Name: SHA256withRSA
Principal Public Key Algorithm: 2048-bit RSA Key
Version: 1
```

**Fingerprint (SHA256)**
```
80:B4:94:4F:FB:C4:D8:55:17:78:FA:B8:A9:AB:2B:9B:38:00:94:7F:FA:50:BD:F4:77:CD:4F:C6:B6:14:01:0F
```

```bash
apksigner verify --print-certs <path/to/theapk.apk>
```

## Deprecated Certificate

**The revocation of PGP key 5B195E96EEA7CB44F5F9AAD8 6265 D474 BE2A 263E**

Since the PGP key has lost any copy other than its smart card, it is foreseeable that when the smart card is eventually lost or corrupted,
I will lose all access to the certificate. The key has not been used for a long time and expired in 2023, therefore, I will replace the certificate and revoke the old certificate currently used for signing.

Following key has been revoked immediately, The reason for ot is _RFC 5280 (4) superseded_.

```
pub rsa4096 2022-09-28 [SC] [revoked: 2026-03-09]
5B195E96EEA7CB44F5F9AAD86265D474BE2A263E
uid [ revoked] AlanCui4080 [me@alancui.cc]
```

```bash
curl -sSL https://key.alancui.cc/5B195E96EEA7CB44F5F9AAD86265D474BE2A263E.rev | gpg --import
```
