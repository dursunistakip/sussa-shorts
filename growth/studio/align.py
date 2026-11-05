# align.py <jobs.json> [whisper_dir]      jobs: [{"wav": ..., "words": [...], "out": ...}, ...] (one model load for all)
# Word timings for the script's own words (so captions keep the exact spelling, e.g. "Sussa"): faster-whisper hears the audio,
# the heard words are matched to the script words, unmatched words are spread between their matched neighbours.
import json, re, sys, wave, difflib
import numpy as np
from faster_whisper import WhisperModel

jobs = json.load(open(sys.argv[1], encoding="utf8"))
m = WhisperModel("small", device="cpu", compute_type="int8", download_root=sys.argv[2] if len(sys.argv) > 2 else None)
norm = lambda s: re.sub(r"[^\w]", "", s.lower())

def align(wav, words, out, lang=None):
    w = wave.open(wav); rate = w.getframerate()
    a = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
    total = len(a) / rate
    a = np.interp(np.arange(0, len(a), rate / 16000), np.arange(len(a)), a).astype(np.float32)
    segs, _ = m.transcribe(a, word_timestamps=True, vad_filter=False, language=lang)
    heard = [(x.start, x.end, x.word) for s in segs for x in s.words]
    sm = difflib.SequenceMatcher(None, [norm(x[2]) for x in heard], [norm(x) for x in words], autojunk=False)
    t = [None] * len(words)
    for blk in sm.get_matching_blocks():
        for k in range(blk.size): t[blk.b + k] = [heard[blk.a + k][0], heard[blk.a + k][1]]
    # fill gaps proportionally to word length
    i = 0
    while i < len(words):
        if t[i] is not None: i += 1; continue
        j = i
        while j < len(words) and t[j] is None: j += 1
        lo = t[i - 1][1] if i > 0 else 0.05
        hi = t[j][0] if j < len(words) else total - 0.05
        span = [len(words[k]) + 1 for k in range(i, j)]; tot = sum(span); acc = lo
        for k, n in zip(range(i, j), span):
            d = (hi - lo) * n / tot; t[k] = [acc, acc + d]; acc += d
        i = j
    json.dump({"total": total, "matched": sum(b.size for b in sm.get_matching_blocks()), "times": [[round(x, 3), round(y, 3)] for x, y in t]}, open(out, "w"))

for j in jobs: align(j["wav"], j["words"], j["out"], j.get("lang"))
