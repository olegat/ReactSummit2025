#!/usr/bin/env bash
set -e  # exit on any error

for texfile in *.tex; do
  # Skip if no tex files match
  [ -e "$texfile" ] || continue

  # Get the base name (remove .tex)
  base="${texfile%.tex}"

  echo "Processing $texfile → $base.svg / $base.png"

  # Generate SVG if it doesn't exist
  if [ ! -f "$base.svg" ]; then
    ./tex2svg.js < "$texfile" > "$base.svg"
  fi

  # Generate PNG if it doesn't exist
  if [ ! -f "$base.png" ]; then
    magick -background none "$base.svg" "$base.png"
  fi
done
