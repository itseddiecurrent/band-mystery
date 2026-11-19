#!/bin/sh
set -eu
cd "$(dirname "$0")/.."

for source in assets/*.png; do
  filename=${source##*/}
  case "$filename" in
    洛克.png|tony.png|小莉.png|arthur.png|蛋仔.png|蛋仔-便装.png|小柔.png|willy.png|kat_doctor.png)
      continue
      ;;
  esac

  # Keep images with transparency in PNG; JPEG cannot preserve their alpha channel.
  if sips -g hasAlpha "$source" 2>/dev/null | awk '/hasAlpha/ { if ($2 == "yes") found=1 } END { exit !found }'; then
    continue
  fi

  sips -s format jpeg -s formatOptions 86 -o "assets/${filename%.png}.jpg" "$source" >/dev/null
done
