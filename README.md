# Sussa Shorts

Daily short videos for the Sussa YouTube channels and the TikTok hand-off, made by GitHub Actions (`.github/workflows/daily-shorts.yml`).

- `growth/studio/` — the studio pipeline: script (Gemini on Vertex, real-sky facts), voice (Gemini TTS), word timings (faster-whisper), footage from the Veo library (release `studio-lib`), HTML motion layer rendered frame by frame.
- `growth/daily.mjs` — picks the day's two formats per channel language, builds, uploads, records posted slots (`growth/studio/done.json`).
- `src/lib/sky.ts`, `src/lib/horo-i18n.ts`, `src/data/` and `public/` are copies from the asksussa.com site (same ephemeris and texts as the app). Copy them again when the site changes them.

Secrets live in the repository settings, never in files.
