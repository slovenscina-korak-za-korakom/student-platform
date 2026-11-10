# Rung-3 HLS packaging worker — runs as a one-shot Fargate task.
#
# MUST be built for linux/amd64: the bundled bin/ffmpeg + bin/ffprobe are
# statically-linked x86-64 ELF binaries, and the Fargate task runs on X86_64.
# On Apple Silicon build with:  docker build --platform linux/amd64 ...
FROM --platform=linux/amd64 node:20-slim

WORKDIR /app

# @aws-sdk/client-s3 is pure JS (platform-independent), so the committed
# node_modules copies in as-is — no install step needed.
COPY package.json ./
COPY node_modules ./node_modules

# App code + the static Linux ffmpeg/ffprobe.
COPY index.mjs ./
COPY bin ./bin

# Point the worker at the bundled binaries.
ENV FFMPEG_PATH=/app/bin/ffmpeg \
    FFPROBE_PATH=/app/bin/ffprobe

# One-shot: process the master named by BUCKET/RAW_KEY, then exit.
ENTRYPOINT ["node", "index.mjs"]
