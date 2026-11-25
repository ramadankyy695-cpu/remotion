# Pria yang Selalu Bilang Nanti

A 9:16 (1080x1920, 30 fps) cinematic 3D short made with Remotion + React Three Fiber.
The VO (`public/vo.wav`) is the master timeline.

## Build

```bash
npm install
python3 scripts/audio.py public/sfx public/vo.wav   # synthesizes music, ambiences and foley
python3 scripts/align.py src/words.json             # word timings for subtitles (already committed)
npx remotion render PriaNanti out/pria-yang-selalu-bilang-nanti.mp4 --concurrency=3
```

`remotion.config.ts` points at the Playwright headless Chromium in this environment; change
`setBrowserExecutable` (or remove it) on other machines.

## Structure

- `src/timeline.ts` – shot boundaries in seconds, derived from pauses in the VO.
- `src/Video.tsx` – sequences, crossfades, title, audio mix (VO, ducked music, ambience, foley, footsteps).
- `src/Subtitles.tsx` – word-synced subtitles with selective highlights.
- `src/three/` – procedural character rig (pose system, FK, two-bone arm IK), props, sets, post FX stage.
- `src/scenes/` – one file per story scene (1–9).
- `scripts/` – audio synthesis, VO alignment, review-still rendering.
