#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
mkdir -p assets/portraits
for name in 洛克 tony 小莉 arthur 蛋仔 蛋仔-便装 小柔 willy kat_doctor; do
  cwebp -quiet -q 88 -m 6 -alpha_q 100 -metadata none "assets/$name.png" -o "assets/portraits/$name.webp"
done
