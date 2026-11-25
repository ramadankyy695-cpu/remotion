#!/bin/bash
# Renders the video in segments (resumable), then concatenates and muxes audio.
set -e
cd "$(dirname "$0")/.."
mkdir -p out/seg
RANGES=("0-399" "400-799" "800-1199" "1200-1574")
for r in "${RANGES[@]}"; do
  f="out/seg/seg-$r.mp4"
  if [ -s "$f" ]; then echo "skip $r"; continue; fi
  echo "render $r $(date +%T)"
  npx remotion render PriaDiam "$f.tmp.mp4" --frames=$r --muted --timeout=300000 --log=error
  mv "$f.tmp.mp4" "$f"
done
echo "audio $(date +%T)"
npx remotion render PriaDiam out/seg/audio.wav --codec=wav --audio-codec=pcm-16 --log=error
: > out/seg/list.txt
for r in "${RANGES[@]}"; do echo "file 'seg-$r.mp4'" >> out/seg/list.txt; done
ffmpeg -loglevel error -y -f concat -safe 0 -i out/seg/list.txt -i out/seg/audio.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart -shortest out/pria-diam.mp4
echo "DONE $(date +%T)"
