# Canonical characters (2D, Roblox-inspired blocky, original designs)

Rig: `src/components/Character2D.tsx` (layered flat planes, canvas-drawn in `src/lib/textures.ts`).
Proportions (world units): leg 0.40x0.82, torso 0.82x0.82 (side 0.46), arm 0.38x0.80, head 0.70x0.62 (side 0.64).
Style: rounded blocks, bold #13131d outline (~7%), 2-tone cel shading (right 30% darker), soft top highlight.
Views: `front` (dialogue/reactions) and `side` (walk/run, flip with `facing`). Always yaw-billboarded, never edge-on.

## main (protagonist)
- Skin #f6c995, brown side-swept hair #6a4126.
- Blue t-shirt #2f7fe6 with light-blue chest stripe + V collar; navy pants #24346a; black shoes.

## friend (sahabat)
- Skin #eab37f, black spiky hair #1d1d24.
- Red hoodie #dd3434 with hood rim, white drawstrings, front pocket; charcoal pants #2e2e36; black shoes.

## Expressions (shared face system)
neutral, happy, joy (^^ eyes), amazed, shocked (white sclera), guilty (sweat drop, side glance), angry/determined
(gritted teeth), sad, devastated (tear streaks). Mouth 0/1/2 for talking; auto-blink.
