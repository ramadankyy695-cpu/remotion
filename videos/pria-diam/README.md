# Pria Diam — animasi 3D cinematic storytelling (Remotion + React Three Fiber)

Video vertikal 1080×1920, 30 fps, 52,5 detik. VO di `public/vo.wav` adalah master timeline
(sampel PCM identik dengan file asli; hanya header WAV yang di-remux).

## Struktur
- `src/Video.tsx` — komposisi utama `PriaDiam`: scene dalam `<Sequence>`, transisi, grading, subtitle, audio.
- `src/scenes/*` — scene modular (Bedroom, Flashback, Street, Social, Window).
- `src/three/*` — karakter 3D prosedural ber-rig (`Character.tsx`, `pose.ts`), lingkungan (`env.tsx`), stage + DOF (`Stage.tsx`).
- `src/captions.ts` — timestamp per kata hasil transkripsi VO (faster-whisper small).
- `scripts/make_audio.py` — sintesis musik latar + SFX/ambience (tanpa sampel eksternal), ducking terhadap VO.

## Perintah
```bash
npm install
python3 scripts/make_audio.py public/vo.wav public   # membuat public/music.wav + public/sfx.wav
npx remotion studio                                   # preview
npx remotion render PriaDiam out/pria-diam.mp4        # render (config di remotion.config.ts)
```
`remotion.config.ts` memakai Chromium headless bawaan environment dan WebGL software (`swangle`).
