---
name: vidioroblox
description: Invoke with /vidioroblox. Use when the user asks to create Roblox-inspired 2D characters inside a real 3D world, build animated vertical shorts, create a reusable character rig or sprite sheet, or render a Remotion MP4 with cinematic 3D environments. It prioritizes low-token, reusable assets and voice-over-first production.
---

# Roblox 2D Character in 3D World

## Mission
Create short animated videos in which the **character is visibly 2D** (flat illustrated/cel-shaded or sprite-based, Roblox/blocky design) while the **environment is genuinely 3D** (depth, perspective, lighting, shadows, camera movement, parallax, and 3D props). Do not substitute a slideshow, a still image with zoom, or a fully 3D character unless explicitly requested.

## Default production profile
- Canvas: 1080x1920, 9:16, 30 fps.
- Runtime: 45–60 seconds unless the user specifies otherwise.
- Visual language: Roblox-inspired block proportions, readable silhouettes, expressive face, clean colorful materials, cinematic 3D world.
- Character: 2D plane/sprite or layered 2D rig placed in 3D space. Keep its face and body artwork consistent between shots.
- Environment: real 3D scene using the existing project stack where possible.
- Audio: Indonesian male narration by default only when requested or when a supplied VO exists; narration is the master timeline. Add SFX and music only when available/licensed and appropriate.
- Delivery: rendered MP4 plus editable project/source files when the environment supports them.

## Hard rules
1. Inspect the current project before changing it. Reuse its framework, dependencies, components, assets, and render commands. Do not recreate a working project.
2. Never claim a video was rendered, tested, or exported unless the output file exists and was checked.
3. Never silently replace real animation with static frames, slideshow transitions, or camera zooms.
4. Never generate a new character design for every shot. Create one canonical character sheet and reuse it.
5. Never rewrite the whole project for a small change. Patch only affected files.
6. Do not install packages, download large models, or run destructive commands without explaining the need first. Prefer already-installed packages and local assets.
7. If a requested visual effect cannot be achieved in the current runtime, state the limitation and offer the closest honest fallback.
8. Respect copyright: use original designs and user-provided/licensed assets. “Roblox-inspired” means blocky game-like proportions, not copying Roblox logos, branded assets, or a specific creator's character.

## Token-saving protocol
Follow this protocol on every task:
- Start with a compact project audit: list only relevant files, package scripts, installed render tools, and existing assets. Avoid dumping entire files or huge directory trees.
- Read only the files needed for the current change. Use targeted searches and short excerpts.
- Maintain `project-state.md` with: framework/version, composition entry point, render command, asset paths, canonical character description, and current blockers. Update only when facts change.
- Maintain one `character/character-spec.md` and one `character/character-assets.json`. Do not restate the full design in every scene.
- Store reusable scene components, materials, camera presets, lighting presets, and animation helpers. Reference them by name.
- Use a shot manifest (`shots.json`) as the source of truth. Each shot stores only its unique differences: duration, location, action, camera, props, and audio range.
- Prefer deterministic code animation (keyframes, transforms, sprite frames) over repeatedly prompting for new images.
- Generate only missing assets. Before creating an asset, check whether a usable equivalent already exists.
- For changes, return a concise diff summary and the exact test/render command. Do not print full source files unless asked.
- Keep narration text, timing, shot plan, and code separate. Never resend a long narration when only adjusting visuals.
- If context becomes large, summarize stable decisions in `project-state.md` and continue from that file.


## Rights-safe audio policy (mandatory)
The default is **no copyright-risk audio**.
- Use only audio that is demonstrably public domain, CC0, or explicitly licensed for the user's intended commercial use (including monetized YouTube/TikTok/Instagram videos).
- Prefer original sound effects created procedurally in code, user-recorded sounds, or audio the user supplies with usage rights.
- Do not take sounds/music from random YouTube videos, TikTok, movies, games, Spotify, or unverified “no copyright” channels.
- Do not assume that “royalty-free”, “free download”, or “no copyright” means commercial use is allowed. Verify the license and attribution requirements before use.
- Keep a small `audio-licenses.md` manifest recording each file, source, license, commercial-use permission, attribution text, and verification date.
- If license cannot be verified, do not include that asset. Use an original procedural SFX, silence, or a clearly marked placeholder instead.
- For music, default to no background music unless a verified safe track is available. Narration and original/procedural SFX are enough.
- Do not imitate a recognizable copyrighted soundtrack or recreate a specific game's signature sounds.

## Cinematic camera language (mandatory)
The scene must not feel like a static slideshow. Use purposeful camera animation in 3D space:
- Zoom in / zoom out: animate camera focal length or dolly distance; prefer dolly for natural perspective changes. Use focal-length zoom only when stylistically intended.
- Pan left / pan right: animate camera target or camera position smoothly.
- Tracking slide left / slide right: move the camera laterally while keeping the subject framed.
- Push-in / pull-back: move camera toward/away from the character for emotional emphasis.
- Orbit: use a restrained arc around the subject when the scene supports it.
- Tilt up / tilt down: reveal scale, height, or a character reaction.
- Rack focus / depth emphasis: only if the renderer supports it; do not fake it with a blurry overlay.
- Combine moves sparingly; every move must support the story beat and preserve readable framing.
- Use easing (ease-in/ease-out), avoid abrupt robotic motion, and avoid motion sickness.
- Keep captions and important action inside mobile-safe margins.
- Every shot plan must state its camera move (or explicitly state “locked camera” with a reason).

## Deep story comprehension and adaptation
Before animating, understand the story rather than merely splitting text into equal chunks.
1. Read the complete story/VO once for its central premise, emotional arc, character motivation, conflict, stakes, turning point, reveal, and ending.
2. Identify what the viewer should feel or understand at each beat. Do not invent plot facts that are not in the script.
3. Build a compact beat sheet: `time/VO phrase`, `story beat`, `emotion`, `visual metaphor/action`, `location/prop`, `camera move`, `sound cue`.
4. Translate abstract ideas into visible actions and symbolic props while preserving the script's meaning. Example: “merasa tertinggal” can become a character watching others move ahead on a 3D street while the camera tracks sideways; do not add unrelated events.
5. Protect the hook and payoff. The opening 1–3 seconds must show a clear visual question, conflict, or surprising image. The ending must visually support the actual twist/payoff.
6. Ensure visual continuity: character goals, prop positions, location geography, time of day, and screen direction should remain consistent between connected shots.
7. Only after the beat sheet is approved or internally coherent should the skill create the shot manifest and animate.
8. If the story is ambiguous, choose a conservative interpretation and state the assumption briefly instead of asking multiple questions.

## Token and context budget
- Use a two-pass approach: (A) story analysis + beat sheet, (B) implementation. Do not mix long brainstorming with code generation.
- Keep story analysis concise: normally 5–10 beats for a 60-second video.
- Before coding, produce a compact implementation plan with files to create/change and assets to reuse.
- Set a practical token budget for the task. Spend tokens on story logic, reusable components, and debugging—not repeated explanations.
- Never paste the entire skill, entire repository, or long source files into the conversation. Read targeted files and summarize.
- Use stable IDs for characters, locations, props, and shots so changes can be targeted.
- Store approved story beats and visual decisions in `story-bible.md`; store project facts in `project-state.md`.
- If the user changes one scene, regenerate only that scene and its dependent assets. Do not redo the whole video.
- If output is too large, create/update files directly and report only a short summary, changed-file list, and test result.
- Ask at most one essential clarification. Otherwise use defaults and continue.


## One-command repeatable production mode
The user should be able to start each new video by supplying only:
1. One narration audio file (MP3/WAV/M4A if supported by the runtime).
2. The matching narration script as plain text.

Treat these two inputs as the complete creative brief unless a critical contradiction exists. Do not ask the user to repeat the visual style, aspect ratio, character design, camera language, audio policy, or render settings; use this skill's defaults and the existing project state.

Recognize the trigger phrase `BUAT VIDEO BARU` as an instruction to run this workflow:
1. Locate and inspect the newly supplied VO and script.
2. Check whether the script matches the audio. If they differ, report the mismatch and use the actual VO as the timing master; do not silently rewrite the spoken words.
3. Read the full script for meaning, emotional arc, hook, conflict, reveal, and payoff.
4. Measure the exact audio duration.
5. Align the narration to phrases/sentences. Prefer local word-level alignment if an already-installed offline aligner is available. Do not download large models or depend on blocked model hosts without permission.
6. Produce a compact beat sheet and scene timing plan.
7. Create/update only the necessary shots and render.
8. Validate the final video and report the exact output path only if verified.

## VO is the master timeline
- The supplied voice-over is the source of truth for total runtime and timing. The video must not finish before or continue long after the VO.
- Determine duration from the actual audio file, not an estimated script reading time.
- Prefer word-level timestamps when a reliable local aligner is already available. Otherwise use sentence/phrase boundaries, pauses, and manual semantic alignment. Clearly label estimated timings as estimates.
- If Whisper or another speech recognizer is installed and works offline, it may help transcribe/check alignment. Do not assume it is installed, do not download a model automatically, and do not let a blocked model download stall production.
- Use silence/pause detection as supporting evidence only; pauses do not necessarily indicate scene cuts.
- Each scene's start/end must be linked to a specific VO phrase or story beat in the shot manifest.
- Scene changes must follow changes in meaning, action, emotion, location, or reveal—not a fixed interval and not every sentence automatically.
- A sentence may span multiple shots if its meaning/action evolves. Several short sentences may share one shot if they describe one continuous action.
- Preserve every spoken word. Do not speed up, trim, or rewrite the VO to fit the animation unless the user explicitly requests it.
- Keep visual action synchronized with the words: gestures, reactions, prop reveals, and camera moves should land on the relevant phrase or emphasis.
- If exact alignment cannot be obtained, use phrase-level alignment and disclose that precision is approximate.

## Reusable project setup
On the first successful setup, create a persistent `production-config.md` with:
- chosen framework and render command
- 9:16 / 1080x1920 / 30fps defaults
- canonical character and environment references
- camera movement presets
- subtitle style
- safe-audio rules
- reusable asset locations
On later videos, read this short config and reuse it. Do not repeat setup or redesign the character unless asked.

## Minimal user input contract
The expected new-video input is:
- `VO:` attached audio file
- `NASKAH:` pasted text
Optional: `CATATAN:` one short special instruction.
If the user supplies only the VO or only the script, ask for the missing essential input. If both are present, proceed without a long questionnaire.

## Required workflow

### Phase 1 — Audit and plan
1. Identify whether the user is in Claude.ai, Claude Code, or another environment.
2. Inspect the project and identify whether it is Remotion, Three.js/React Three Fiber, plain React, or another stack.
3. Detect the supplied VO and script. In repeatable production mode, use the actual audio as the timing master, check script/audio consistency, and align scene boundaries to narration phrases.
4. Check available assets: GLB/GLTF models, PNG/WebP transparent sprites, SVGs, audio, fonts, and SFX.
5. Analyze the story deeply using the beat-sheet procedure above; save concise decisions in `story-bible.md`. Determine actual VO duration and phrase-level timing before finalizing scene boundaries.
6. Create a short production plan and a shot manifest before coding. Every shot must include an intentional camera move and story purpose. Ask a question only if an essential choice is missing; otherwise use defaults.

### Phase 2 — Character design and 2D rig
Create one canonical 2D Roblox-inspired character:
- Blocky head, torso, arms, and legs; bold readable outline; simple expressive eyes and mouth.
- Use a layered 2D rig where possible: head, torso, upper/lower arms, upper/lower legs, hands, facial features.
- If using a sprite sheet, define exact frame dimensions, frame order, and animation names in JSON.
- Keep proportions, outfit, colors, face, and outline consistent across all shots.
- Use transparent PNG/WebP or SVG layers. Avoid white backgrounds.
- Provide at least idle, walk, run, talk, look, and reaction states when the story needs them.
- For 2D-in-3D placement, use a plane/sprite in 3D space. Prefer a camera-facing billboard for dialogue shots; use a fixed-facing plane or controlled yaw for side-view movement. Do not let the character rotate randomly or reveal a flat image edge-on.
- Add contact shadow/soft blob shadow and correct ground alignment so the character belongs in the 3D world.

### Phase 3 — Build the 3D world
- Use actual 3D geometry or existing GLB/GLTF assets for floors, buildings, rooms, streets, trees, furniture, and props.
- Establish world scale, ground plane, camera, key/fill/rim lighting, and atmospheric depth.
- Use camera movement with intention: establishing wide shot, medium dialogue shot, close-up reaction, tracking shot, or over-the-shoulder.
- Add depth cues: foreground objects, background layers, perspective, parallax, occlusion, shadows, and lighting changes.
- Keep the 3D environment visually coherent between cuts. Reuse scene modules and materials.
- Avoid expensive photorealism if the device/runtime cannot handle it. Prefer optimized low-poly geometry and baked/simple lighting.

### Phase 4 — Animation and shot design
- Break the story into shots, normally 4–8 shots for a 45–60 second short.
- Each shot must have a visible character action and/or meaningful camera/environment movement.
- Use keyframed transforms, skeletal/layered 2D rig motion, sprite animation, or controlled procedural movement.
- Add secondary motion: head turns, arm gestures, body bounce, blinking, cloth/accessory movement when practical.
- Use cuts, match cuts, camera moves, and transitions; do not rely on one static camera for the whole video.
- Keep important action in the center-safe area for 9:16 mobile viewing.
- Avoid rapid motion that makes captions unreadable.

### Phase 5 — Voice-over, captions, sound
- When VO exists, inspect its duration and use it as the master timeline.
- Align each shot to the narration's meaning, not merely equal time slices.
- If exact word timestamps are unavailable, use sentence/phrase timing and mark estimates honestly.
- Add subtitles as editable timed text, with short readable phrases and safe margins.
- Add SFX for meaningful actions (footsteps, door, impact, whoosh, pop) and low-volume music only when assets exist.
- Never invent or claim a generated audio file exists. If audio generation is unavailable, provide the script and a clearly labeled audio placeholder.

### Phase 6 — Render and quality check
- Confirm composition dimensions, fps, duration, asset paths, and audio mix.
- Render a low-resolution or short preview first if supported.
- Check for: missing textures, broken transparency, sprite edge-on, foot sliding, floating character, clipping, flicker, unreadable captions, audio clipping, black frames, and inconsistent character design.
- Render final MP4 only after preview checks or clearly state that preview validation was unavailable.
- Confirm the exact output path and file size before reporting completion.
- If render fails, diagnose the actual error and make the smallest targeted fix. Do not repeatedly reinstall dependencies.

## Stack guidance
Prefer the existing project stack. For a Remotion project:
- Use Remotion for timeline, sequencing, captions, audio, and final MP4 rendering.
- Use Three.js / React Three Fiber for the 3D world if already installed and supported.
- Place the 2D character as transparent SVG/PNG layers or a sprite plane inside the 3D scene.
- Keep the Remotion composition responsible for timing and shot changes.
- If rendering on Android/Termux is unsupported by the installed renderer, do not pretend it works. Use an available supported browser/render environment or provide the project and exact next step.
For a new project, first confirm the runtime can render video. Do not assume browser preview equals MP4 export.

## Output contract
At the end, report:
1. What was created.
2. Exact visual technique used for 2D character + 3D world.
3. Files changed/created.
4. Audio safety: list audio sources and license status from `audio-licenses.md`; flag any unverified item and exclude it.
5. Render status: success, failed, or not run.
6. Exact MP4 path only if verified.
7. One concise next action.

## User interaction defaults
- Communicate in casual Indonesian unless the user switches language.
- Do not ask for details already provided in the current project or `project-state.md`.
- When the user says “buat video”, proceed with sensible defaults rather than asking a long questionnaire.
- If the user says “VO dulu”, create only the narration/audio stage first; do not start animating until asked.
- If the user supplies an audio file, do not rewrite the narration unless asked.
- When user asks to save tokens, do not explain every implementation detail; execute the workflow and summarize briefly.
