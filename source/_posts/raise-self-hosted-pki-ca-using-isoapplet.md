---
title: Raise a self hosted PKI (CA) on JavaCard using IsoApplet and OpenSSL
tags: []
categories:
  - Cryptography
date: 2026-03-22 13:31:11
---
We have handle the fundamentals to JavaCard in last two articles, and completely setup a decentralized cryptography system (OpenPGP). So, in this, we're going to raise up out PKI (CA) system so that we can issue certificates such as TLS and PIV on our JavaCard.

> The security and reliability of asymmetric cryptography depends crucially on the confidentiality of the private key. While the public key can be sent to anyone, it is absolutely important that the private key is not compromised. Smartcards have its own processor, RAM and even operating system. They are hermetically sealed from the rest of the system (i.e. the host computer that might be compromised). Also, the developers and manufacturers of smartcards take a huge effort to ensure that no confidential data can be extracted from the card when it is not intended, even by using costly and time-consuming methods such as electron microscopy.

<!-- more -->

### IsoApplet and OpenSSL

The IsoApplet is the one of few PKCS#15 applets supported by OpenSC, which provides us a standard PKCS#11 interface to use cryptograhpgy functions to the keys on card which is generated on card and not extractable. 

#### What is PKCS#x?
> **PKCS#11** defines an application programming interface (API) for single-user devices that possess cryptographic information (such as encryption keys and certificates) and execute cryptographic functions. Smart cards are typical devices that implement PKCS#11. Note: PKCS#11 defines the cryptographic function interface but does not specify how the device should implement these functions.

> **PKCS#15** defineds the interoperability of cryptographic tokens by defining a common format for cryptographic objects stored on the token. Data stored on a device that implements PKCS#15 is identical to all applications using that device, although the format may differ in the actual internal implementation. The PKCS#15 implementation acts as a translator, converting between the card's internal format and the data formats supported by the application.

In short words, the pkcs11 defines the api that software to use, the pkcs15 defines the api to communicate with card. In general situation, the pkcs11 is implemented by vendor library, in our case, that is OpenSC. Also, the openssl requires an engine, in our case, that is libp11.

So, in first, we have to install that applet:
```bash
gp --install IsoApplet.cap --key emv:<KEY>
```

Then initlize the PKCS#15 filesystem
```bash
pkcs15-init --create-pkcs15
```

We have to also modify the configuration file of openssl to let it recongize the pkcs#11 engine:
Note: the libp11 is not provided with OpenSC installation, you have to manually download and install it.
```conf
[openssl_init]
...
# add this line
engines = engine_section
...
# append to the end
[engine_section] 
pkcs11 = pkcs11_section

[pkcs11_section]
engine_id = pkcs11 
dynamic_path = "C:\\Program Files\\OpenSSL\\lib\\engines-3\\pkcs11.dll"
MODULE_PATH = "C:\\Program Files\\OpenSC Project\\OpenSC\\pkcs11\\opensc-pkcs11.dll"
```

As a quick confirmation,``openssl engine -t`` should report that pkcs#11 engine is available:
```
(rdrand) Intel RDRAND engine
     [ available ]
(dynamic) Dynamic engine loading support
     [ unavailable ]
(pkcs11) pkcs11 engine
     [ available ]
```

### Create our PKI

Firstly, generate the root certificate, that private key of root certificate should remain offline, unless we need to issue more intermediate ca or update crl.
```bash
openssl genpkey -algorithm rsa -pkeyopt rsa_keygen_bits:4096 -out </path/to/key> -aes256
openssl req -new -key </path/to/key> -out </path/to/csr> -subj "/CN=Alan Trust Root CA/O=Alan Trust/OU=Root Authority/"
openssl req -x509 -in </path/to/csr> -key </path/to/key> -out </path/to/cert> -days 3650
```

Then transfer the root certificate to card (not necessary), generate key of TLS intermediate CA, produce CSR of the intermediate CA on card. Finally issue the certificate by root, store the intermediate certificate to card.
```bash
# pkcs15-init --store-certificate </path/to/root-cert> --label Alan Trust Root CA
pkcs15-init --generate-key "rsa/2048" --key-usage "sign" --id "1" --auth-id "FF" --label "Alan Trust TLS CA RSA 2026"
openssl req -engine pkcs11 -keyform ENGINE -new -key "pkcs11:object=Alan Trust TLS CA RSA 2026;type=private" -out tls-ca-rsa-2026.csr -subj "/CN=Alan Trust TLS CA RSA 2026/O=Alan Trust/OU=TLS Authority/"
openssl x509 -req -in tls-ca-rsa-2026.csr -CA root-ca.crt -CAkey root-ca-key.pem -CAcreateserial -out tls-ca-rsa-2026.crt -extfile intermediate-ca.cnf -extensions ca -days 1095
# pkcs15-init --store-certificate tls-ca-rsa-2026.crt --label Alan Trust TLS CA RSA 2026
```

The intermediate certificate is qualified by our intermediate-ca.cnf file, to ensure that the intermediate can not issue more CA; also specify the URI to the Certificate Revocation List(CRL) and AuthorityInfoAccess URI (URL to the root certificate).
```conf
[ ca ]
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid:always,issuer
basicConstraints = critical,CA:true,pathlen:0
keyUsage = critical,digitalSignature,keyCertSign,cRLSign
crlDistributionPoints = URI:http://pki.alancui.cc/root-ca.crl
authorityInfoAccess = caIssuers;URI:http://pki.alancui.cc/root-ca.crt
```

Therefore, we now can issue end entity TLS certificates:
```bash
openssl x509 -req -engine pkcs11 -CAkeyform ENGINE -in cert.csr -CA tls-ca-rsa-2026.crt -CAkey "pkcs11:object=Alan Trust TLS CA RSA 2026;type=private" -CAcreateserial -out tls-ca-rsa-2026.crt -extfile tls-cert.cnf -extensions tls_cert  -days 365
```

Also, with following qualification:
```conf
[ tls_cert ]
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid:always,issuer
basicConstraints = critical,CA:false
keyUsage = critical,digitalSignature,keyEncipherment
extendedKeyUsage = serverAuth,clientAuth
subjectAltName = @alt_names
crlDistributionPoints = URI:http://pki.alancui.cc/tls-ca-rsa-2026.crl
authorityInfoAccess = caIssuers;URI:http://pki.alancui.cc/tls-ca-rsa-2026.crt

[ alt_names ]
# DNS.1 = test.example.com
# DNS.2 = www.test.example.com
```

Now, by installing the **entire** certificate chain to the certificate storage, we now have full funtional PKI chain. 
```
C:\Program Files>certutil -verify C:\Users\AlanC\Downloads\test.crt D:\15_CFPages\pki.alancui.cc\tls-ca-rsa-2026.crt
CertIssuer:
    OU=TLS Authority
    O=Alan Trust
    CN=Alan Trust TLS CA RSA 2026
  Name Hash(sha1): ffbb3aa59dc347fe2de15cb9da6f0fac89d6a5df
  Name Hash(md5): 07362ed1cfa2464422b8ad537d98d3e9
CertSubject:
    O=Internet Widgits Pty Ltd
    S=Some-State
    C=AU
  Name Hash(sha1): d398f76c7ba0bbf79b1cac0620cdf4b42e505195
  Name Hash(md5): 4a963519b4950845a8d76668d4d7dd29
Issuing CA CertIssuer:
    OU=Root Authority
    O=Alan Trust
    CN=Alan Trust Root CA
  Name Hash(sha1): acbe1d6af9d96066cda8ce517a6140bfebb786dc
  Name Hash(md5): 43442ade5e6cb860818ff4c1b24fb812
Issuing CA CertSubject:
    OU=TLS Authority
    O=Alan Trust
    CN=Alan Trust TLS CA RSA 2026
  Name Hash(sha1): ffbb3aa59dc347fe2de15cb9da6f0fac89d6a5df
  Name Hash(md5): 07362ed1cfa2464422b8ad537d98d3e9
Issuing CA is not a root: Subject name does not match Issuer

Issuing CA Subject name matches Cert Issuer
Cert is an End Entity certificate
Certificate signature is valid
Certificate is current
CA Key Id matches Key Id
No Key Authority name
No Key Authority serial number
Certificate has no revocation-check extension

C:\Users\AlanC\Downloads\test.crt verifies as issued by D:\15_CFPages\pki.alancui.cc\tls-ca-rsa-2026.crt -- Revocation check skipped.
CertUtil: -verify command completed successfully.
```

Here is some useful OID:
* 1.3.6.1.5.5.7.3.1 = Server authentication
* 1.3.6.1.5.5.7.3.2 = Client authentication
* 1.3.6.1.5.5.7.3.3 = Code Signing
* 1.3.6.1.5.5.7.3.4 = Email Protection
* 1.3.6.1.5.5.7.3.5 = IPSec End System
* 1.3.6.1.5.5.7.3.6 = IPSec Tunnel
* 1.3.6.1.5.5.7.3.7 = IPSec User
* 1.3.6.1.5.5.7.3.8 = Timestamping
* 1.3.6.1.4.1.311.20.2.2  = Windows Smartcard Logon
* 1.3.6.1.4.1.311.80.1    = Microsoft Document Encryption
* 1.3.6.1.4.1.311.10.3.12 = Microsoft Document Signing
* 1.3.6.1.4.1.311.67.1.1  = Windows BitLocker Encryption
* 1.3.6.1.4.1.311.67.1.2  = Windows BitLocker Recovery
* 1.3.6.1.4.1.44986.2.1.1 = PIV Authentication
* 1.3.6.1.4.1.44986.2.1.0 = PIV Signature
* 1.3.6.1.4.1.44986.2.1.2 = PIV Key Management
* 1.3.6.1.4.1.44986.2.5.0 = PIV Card Authentication

For example, an email S/MIME certification should have following qualification:
```conf
[ tls_cert ]
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid:always,issuer
basicConstraints = critical,CA:false
keyUsage = critical,nonRepudiation,digitalSignature,keyEncipherment
extendedKeyUsage = emailProtection
subjectAltName = email:copy
crlDistributionPoints = URI:http://pki.alancui.cc/smime-ca-rsa-2026.crl
authorityInfoAccess = caIssuers;URI:http://pki.alancui.cc/smime-ca-rsa-2026.crt
```

for a bitlocker+windows logon certification:
```conf
[ tls_cert ]
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid:always,issuer
basicConstraints = critical,CA:false
keyUsage = critical,nonRepudiation,digitalSignature,keyEncipherment
extendedKeyUsage = 1.3.6.1.4.1.311.67.1, 1.3.6.1.4.1.311.20.2.2
subjectAltName = otherName:msUPN;UTF8:$ENV::UPN,email:$ENV::UPN
crlDistributionPoints = URI:http://pki.alancui.cc/ident-ca-rsa-2026.crl
authorityInfoAccess = caIssuers;URI:http://pki.alancui.cc/ident-ca-rsa-2026.crt
```

The AlanTrust PKI architecture is shown in the diagram below. You can also obtain it from pki.alancui.cc. Please note that this TLS certificate will be used on *.alancui.local or *.alancui.internal without any futher domain ownership verification.
```
O=Alan Trust 
	RootCert = /CN=Alan Trust Root CA/O=Alan Trust/OU=Root Authority/ # BACKUPED TO DISK, OFFLINE
          RootCert = /CN=Alan Trust SMIME CA RSA 2026/O=Alan Trust/OU=SMIME Authority/ # GENERATED ON CARD, ONLINE
			Cert =  /CN=AlanCui4080/O=Alan Trust/ subjectAltName=me@alancui.cc
		RootCert = /CN=Alan Trust TLS CA RSA 2026/O=Alan Trust/OU=TLS Authority/ # GENERATED ON CARD, ONLINE
			Cert =  /CN=hass.alancui.local/O=Alan Trust/OU=Alan Local Network/
		RootCert = /CN=Alan Trust Identification CA RSA 2026/O=Alan Trust/OU=Identification Authority/ # GENERATED ON CARD, ONLINE
			Cert =  /CN=AlanCui4080/O=Alan Trust/OU=JavaCard Suzume PIV 9A/
			Cert =  /CN=AlanCui4080/O=Alan Trust/OU=JavaCard Shizuku PIV 9A/

O=Alan PIV JavaCard
	OU= Card Local Authority
		RootCert = /CN=Alan PIV JavaCard Card Local Authority/O=Alan PIV JavaCard/OU=Card Local Authority/ # ON PIV 9E
```
