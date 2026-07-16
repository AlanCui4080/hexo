---
title: Raise a selfhosted translation LLM as systemd daemon
tags: []
categories:
  - LLM
date: 2026-03-03 19:51:16
---

Firstly, spawn a regular llama-server.

```ini
[Unit]
Description=LLM server, gemma-4-E2B-it-GGUF at 12288
After=network.target
StopWhenUnneeded=true

[Service]
Type=simple
User=llama
ExecStart=/usr/bin/llama-server \
    --model /mnt/data/llmodel/lmstudio-community/gemma-4-E2B-it-GGUF/gemma-4-E2B-it-Q8_0.gguf \
    --reasoning off --host 127.0.0.1 --port 12288 -ngl 999
```

Then we need a wrap for it, a combination of .socket and .service provides the capability to automaticly shutdown llama-server when idle.

```ini
[Unit]
Requires=llm-gemma4-e2b.service
After=llm-gemma4-e2b.service

[Service]
Type=notify
TimeoutStartSec=30s
ExecStart=/usr/lib/systemd/systemd-socket-proxyd --exit-idle-time=10m 127.0.0.1:12288
```

```ini
[Socket]
ListenStream=12287

[Install]
WantedBy=sockets.target
```
