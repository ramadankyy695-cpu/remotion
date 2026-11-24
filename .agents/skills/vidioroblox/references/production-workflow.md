# Production reference: 2D character in a 3D world

## Recommended visual architecture
The target is a hybrid scene:
- 3D world: actual perspective camera, 3D meshes, depth, lights, shadows, and camera movement.
- 2D actor: transparent flat artwork or a layered 2D puppet mounted on a plane in the 3D world.
- Composite: render the 3D scene and 2D actor together through the same camera, then place the result in the Remotion timeline.

A character can be 2D while still moving through 3D space. Use billboard mode for dialogue/front-facing scenes and controlled yaw for side views. For walking toward/away from camera, use multiple sprite angles or a small set of 2D directional poses. Do not use a single front-facing PNG for every direction.

## Suggested shot rhythm for 60 seconds
1. 0–3s: strong visual hook, close or unusual camera angle.
2. 3–12s: establish character and location.
3. 12–25s: first action or conflict; change camera distance.
4. 25–40s: escalation; introduce prop or second location.
5. 40–53s: reveal or emotional reaction; close-up.
6. 53–60s: payoff and concise ending.

Adjust to the supplied VO. This is a rhythm guide, not a fixed timing template.

## Asset reuse
Keep these canonical files when applicable:
- `public/characters/main/character-spec.md`
- `public/characters/main/character-assets.json`
- `public/characters/main/sprites/`
- `public/environments/`
- `public/audio/`
- `src/scenes/`
- `src/components/`

Reuse an existing asset before generating a new one. Avoid duplicate copies with names like final-final-2.

## Character asset manifest example
Use a JSON manifest like:
```json
{
  "characterId": "main",
  "style": "2D blocky Roblox-inspired cartoon",
  "canvas": {"width": 1024, "height": 1024, "transparent": true},
  "animations": {
    "idle": {"file": "idle.png", "frames": 1, "fps": 1},
    "walk": {"file": "walk.png", "frames": 8, "fps": 10},
    "talk": {"file": "talk.png", "frames": 4, "fps": 8},
    "run": {"file": "run.png", "frames": 8, "fps": 12},
    "react": {"file": "react.png", "frames": 3, "fps": 6}
  }
}
```

## Shot manifest example
```json
[
  {
    "id": "shot-01",
    "durationSec": 4,
    "location": "3D apartment hallway",
    "action": "character enters frame and looks toward camera",
    "camera": "low-angle tracking medium shot",
    "characterState": "walk",
    "props": ["door", "wall lamp"],
    "vo": {"startSec": 0, "endSec": 4}
  }
]
```

## Mobile performance
- Prefer low-poly meshes, instancing for repeated objects, compressed textures, and modest shadow maps.
- Avoid huge 4K textures and unnecessarily detailed GLB assets.
- Keep the number of lights and transparent layers controlled.
- Preview a short shot before building the full minute.
- If the runtime is a phone browser, be honest about memory and rendering constraints.


## Story-first beat sheet
Before building shots, map each narration beat to:
- Story function (hook, setup, conflict, escalation, reveal, payoff)
- Character emotion and motivation
- Visible action or visual metaphor
- Location and props
- Camera movement
- Safe audio cue

Keep the beat sheet short and faithful to the actual story. Avoid decorative shots that do not add meaning.

## Camera move vocabulary
Use 3D camera transforms, not only 2D scaling of the final video:
- `push-in`: camera moves toward subject
- `pull-back`: camera moves away
- `pan-left` / `pan-right`: camera turns horizontally
- `truck-left` / `truck-right`: camera translates sideways
- `tilt-up` / `tilt-down`: camera turns vertically
- `orbit`: camera moves around subject
- `locked`: static camera, only when a deliberate pause improves the beat

Each shot should choose one primary move; combine a secondary move only when it improves clarity.

## Audio license manifest
Create `audio-licenses.md` and record:
| Asset | Source | License | Commercial use | Attribution | Verified |
|---|---|---|---|---|---|
| footsteps.wav | procedural/original | original | yes | none | date |
Never label an asset safe without evidence. Exclude unverified assets.
