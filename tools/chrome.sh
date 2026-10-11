#!/bin/bash
# Öffnet ein sichtbares Chrome-Fenster, das die Skripte in diesem Ordner fernsteuern (Port 9333).
cd "$(dirname "$0")"
exec "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --remote-debugging-port=9333 --user-data-dir="$PWD/.chrome-profile" \
  --no-first-run --no-default-browser-check --window-size=1440,960 \
  "${1:-http://localhost:8787/index.html}" >/dev/null 2>&1 &
