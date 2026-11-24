# Project state

- Runtime/platform: Claude Code cloud container (Linux), headless Chromium + swangle (software WebGL)
- Framework: Remotion 4.0.547, @remotion/three, @react-three/fiber 9.8.2, three 0.187.0, React 19.2
- Composition entry point: `src/index.ts` -> `SahabatHarta` (src/SahabatHarta.tsx)
- Render command: `npx remotion render src/index.ts SahabatHarta out/sahabat-harta.mp4 --codec=h264 --crf=18`
- Output directory: `out/` (git-ignored)
- 3D renderer: three.js via ThreeCanvas, flat (no tone mapping), fog per shot
- Existing reusable assets: Character2D rig, Cave/Bedroom/Chest/Gem/Phone/Particles modules, procedural audio script
- Canonical characters: main = blue shirt / navy pants / brown hair; friend = red hoodie / dark pants / black spiky hair
- Current video: "Sahabat & Harta" (VO 40.04 s, 14 shots)
- Current blockers: no offline word aligner installed -> captions/shots use phrase-level timing from pause detection
- Last verified render: see out/sahabat-harta.mp4 (verified with ffprobe after render)
