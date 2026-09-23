#!/usr/bin/env bash
# Pobiera kadr z OpenArt do dev/grafiki/zrodla/<nazwa>.png i robi podgląd JPG 700 px w scratchpadzie.
set -euo pipefail
url="$1"; name="$2"; prev="${3:-/tmp}"
dir="$(cd "$(dirname "$0")" && pwd)/zrodla"
mkdir -p "$dir"
curl -sS -o "$dir/$name.png" "$url"
python3 -c "from PIL import Image; Image.open('$dir/$name.png').convert('RGB').resize((700,700)).save('$prev/$name.jpg', quality=85)"
echo "$dir/$name.png"
