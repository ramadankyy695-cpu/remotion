# VO synchronization guide

## Timing priority
1. Actual audio duration.
2. Reliable word-level alignment if already available locally.
3. Sentence/phrase boundaries plus pause detection.
4. Estimated timing only as a last resort, clearly labeled.

## How to decide a scene change
Do not cut automatically at every sentence. Change scene when the story meaning or visual action changes: new location, new action, new emotional beat, new information, conflict escalation, reveal, or payoff.

A long sentence can contain multiple shots. Multiple short sentences can share one continuous shot.

## Shot manifest requirements
Every shot must record:
- audio start and end time
- exact narration phrase covered
- story beat / emotional purpose
- character action and expression
- 3D location and props
- primary camera movement
- sound cue (only verified safe/original audio)

## Alignment fallback
If no aligner is available, inspect the audio duration and pauses using tools already installed. Manually map phrases to approximate time ranges. Do not automatically download Whisper models or rely on Hugging Face availability. Report timing as phrase-level approximate alignment, not exact word sync.
