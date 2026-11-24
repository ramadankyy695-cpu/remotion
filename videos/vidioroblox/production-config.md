# Production config (reuse for every new video)

- Framework: Remotion 4.0.547 + @remotion/three (React Three Fiber 9, three 0.187), standalone npm project in `videos/vidioroblox/`.
- Format: 1080x1920, 9:16, 30 fps, H.264 MP4 + AAC.
- Render: `npx remotion render src/index.ts SahabatHarta out/<name>.mp4 --codec=h264 --crf=18`
  (`remotion.config.ts` sets the swangle software GL + the pre-installed headless Chromium).
- Fast preview stills: `node scripts/stills.mjs <frame> <frame> ...` -> `out/stills/` (half res).
- Timeline: VO = master. Measure with `ffprobe`, phrase timing with `ffmpeg -af silencedetect=noise=-32dB:d=0.1`.
- 2D-in-3D technique: `src/components/Character2D.tsx` = flat layered cel-shaded rig (head/torso/arms/legs as
  canvas-drawn planes with bold outline), yaw-billboarded toward the camera, blob contact shadow, lit by scene lights.
- Characters: `main` (blue) and `friend` (red), see `character/character-spec.md`. Never redesign per shot.
- World modules: `src/world/Cave.tsx` (mine tunnel, crystal chamber, stone door), `src/world/Props.tsx`
  (chest, gem, phone, particles, bedroom). Exactly 4 point lights per shot via `ShotLights`.
- Camera: `camAt()` eased keyframes + `addShake()`; every shot has a deliberate move (truck, push-in, crane, orbit, snap zoom).
- Captions: Inter Black 74px, white with dark outline, key phrase in yellow, bottom-safe area (470px from bottom).
- Audio policy: VO supplied by user; music + SFX are procedurally synthesized in `scripts/make_audio.py`
  (original, no third-party samples). Never add downloaded/unverified audio.
