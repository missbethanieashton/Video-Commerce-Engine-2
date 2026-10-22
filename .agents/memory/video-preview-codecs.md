---
name: Video preview codecs
description: Chromium preview compatibility when valid MP4 videos render black.
---

The environment's Chromium build can lack H.264/AAC decoding even when an MP4 is valid and ordinary consumer browsers support it.

**Why:** A valid existing H.264/yuv420p video produced `DEMUXER_ERROR_NO_SUPPORTED_STREAMS` and `canPlayType` returned an empty string in the preview browser. This was not a missing-file or routing error.

**How to apply:** Check video errors and codec support before changing the source footage. Use a compatible WebM source alongside the original MP4 fallback and a real poster frame so the initial composition is never blank.
