"""Procedural, original audio for "SahabatHarta" (no samples, no third-party sources).

Writes public/audio/{music,ambience,sfx}.wav (48 kHz mono 16-bit).
Run:  python3 scripts/make_audio.py
All cue times are in seconds and follow src/timeline.ts (VO = master timeline).
"""
import os
import wave

import numpy as np

SR = 48000
DUR = 1202 / 30  # composition length
N = int(SR * DUR)
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "audio")
rng = np.random.default_rng(42)


def t_arr(sec):
    return np.arange(int(SR * sec)) / SR


def note(name):
    names = {"C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11}
    pitch, octave = name[:-1], int(name[-1])
    return 440.0 * 2 ** ((names[pitch] + 12 * (octave + 1) - 69) / 12)


def place(buf, sig, at, gain=1.0):
    i = int(at * SR)
    if i >= len(buf):
        return
    j = min(len(buf), i + len(sig))
    buf[i:j] += sig[: j - i] * gain


def env_adsr(n, a, r):
    e = np.ones(n)
    na, nr = int(a * SR), int(r * SR)
    if na:
        e[:na] = np.linspace(0, 1, na)
    if nr:
        e[-nr:] *= np.linspace(1, 0, nr)
    return e


def lowpass(x, cutoff):
    # one-pole lowpass
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc = (1 - a) * x[i] + a * acc
        y[i] = acc
    return y


def lowpass_fast(x, cutoff):
    # FFT brickwall-ish lowpass with soft knee (fast for long buffers)
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / (1 + (f / cutoff) ** 4)
    return np.fft.irfft(X, len(x))


def bandpass_fast(x, lo, hi):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= (1 / (1 + (f / hi) ** 4)) * (1 / (1 + (lo / np.maximum(f, 1)) ** 4))
    return np.fft.irfft(X, len(x))


# ------------------------------------------------------------------ instruments
def pad(freqs, sec, a=0.8, r=1.0, bright=0.25, vib=0.0):
    t = t_arr(sec)
    s = np.zeros_like(t)
    for f in freqs:
        for det in (-0.6, 0.6):
            ph = 2 * np.pi * (f + det) * t + vib * np.sin(2 * np.pi * 5 * t)
            s += np.sin(ph) + bright * np.sin(2 * ph) + bright * 0.4 * np.sin(3 * ph)
    s /= max(1, len(freqs) * 2)
    return s * env_adsr(len(t), a, r)


def pluck(f, sec=1.2, decay=3.5):
    t = t_arr(sec)
    s = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t) * np.exp(-t * 6)
    return s * np.exp(-t * decay) * env_adsr(len(t), 0.004, 0.05)


def piano(f, sec=2.6):
    t = t_arr(sec)
    s = np.zeros_like(t)
    for h, amp, dec in ((1, 1.0, 1.4), (2, 0.45, 2.4), (3, 0.22, 3.4), (4, 0.12, 4.5), (5, 0.06, 6.0)):
        s += amp * np.sin(2 * np.pi * f * h * t * (1 + 0.0004 * h)) * np.exp(-t * dec)
    return s * env_adsr(len(t), 0.006, 0.3) * 0.6


def bell(f, sec=1.5):
    t = t_arr(sec)
    s = np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 5) + 0.25 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 8)
    return s * np.exp(-t * 3) * env_adsr(len(t), 0.002, 0.1)


def thump(f0=60, sec=0.5, drop=0.5):
    t = t_arr(sec)
    f = f0 * (1 + drop * np.exp(-t * 30))
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 9)


def noise(sec):
    return rng.standard_normal(int(SR * sec))


def whoosh(sec=0.6, lo=300, hi=3000):
    n = noise(sec)
    t = t_arr(sec)
    sig = bandpass_fast(n, lo, hi)
    e = np.sin(np.pi * np.clip(t / sec, 0, 1)) ** 2
    return sig / (np.abs(sig).max() + 1e-9) * e


def step(soft=1.0, sec=0.12):
    n = noise(sec)
    t = t_arr(sec)
    s = lowpass(n, 900) * np.exp(-t * 45) * 3 + thump(90, sec, 0.3) * 0.5
    return s * soft


def jingle(sec=0.5, count=6):
    out = np.zeros(int(SR * sec))
    for k in range(count):
        f = rng.uniform(2400, 5200)
        tt = t_arr(0.25)
        s = (np.sin(2 * np.pi * f * tt) + 0.6 * np.sin(2 * np.pi * f * 1.51 * tt)) * np.exp(-tt * 22)
        place(out, s, rng.uniform(0, sec - 0.25), 0.35)
    return out


# ------------------------------------------------------------------ music bed
music = np.zeros(N)
# A: friendship (0 - 12 s): Am F C G, warm pad + pluck arpeggio
prog = [("A3", "C4", "E4"), ("F3", "A3", "C4"), ("C3", "E3", "G3"), ("G3", "B3", "D4")]
for i, chord in enumerate(prog):
    at = i * 3.0
    fs = [note(n) for n in chord]
    place(music, pad(fs, 3.6, a=0.6, r=1.2, bright=0.2), at, 0.28)
    place(music, pluck(fs[0] / 2, 2.5, 1.6), at, 0.35)
    arp = [fs[0] * 2, fs[1] * 2, fs[2] * 2, fs[1] * 2]
    for k in range(8):
        place(music, pluck(arp[k % 4], 0.9, 4.5), at + k * 0.375, 0.16)
# treasure shimmer (9.3 - 12)
for k in range(14):
    f = note("A5") * 2 ** ([0, 3, 7, 12, 15, 19, 24][k % 7] / 12)
    place(music, bell(f, 1.4), 9.3 + k * 0.11, 0.08)
place(music, pad([note("A4"), note("C#5"), note("E5")], 3.0, a=0.3, r=1.5, bright=0.1), 9.4, 0.12)

# B: betrayal / chase (12 - 21.2): low drone + dissonance + accelerating pulse
tB = t_arr(9.2)
drone = (np.sin(2 * np.pi * note("D2") * tB) + 0.6 * np.sin(2 * np.pi * note("A2") * tB) + 0.25 * np.sin(2 * np.pi * note("D#3") * tB))
drone *= env_adsr(len(tB), 1.0, 0.05) * (0.6 + 0.4 * np.linspace(0, 1, len(tB)))
place(music, drone, 12.0, 0.22)
place(music, pad([note("A#3"), note("A3"), note("E4")], 9.2, a=2.0, r=0.05, bright=0.35, vib=0.3), 12.0, 0.12)
t_hb = 12.3
while t_hb < 21.0:
    place(music, thump(55, 0.35, 0.8), t_hb, 0.55)
    place(music, thump(50, 0.3, 0.8), t_hb + 0.16, 0.35)
    gap = 0.85 if t_hb < 17.7 else 0.42
    t_hb += gap
riser = bandpass_fast(noise(2.4), 400, 4000) * np.linspace(0, 1, int(SR * 2.4)) ** 2
place(music, riser / np.abs(riser).max(), 18.8, 0.18)

# C: vow (22.3 - 27.7): dark Dm drone swell
place(music, pad([note("D2"), note("F2"), note("A2"), note("D3")], 5.8, a=1.5, r=1.6, bright=0.3), 22.2, 0.3)
place(music, pad([note("C#4"), note("D4")], 3.0, a=1.2, r=1.0, bright=0.1, vib=0.4), 23.5, 0.06)

# D: three days later (27.8 - 35): sad piano
mel = [("A4", "A2"), ("E4", None), ("C5", None), ("B4", None), ("F4", "F2"), ("C5", None), ("A4", None), ("G4", None), ("E4", "C3"), ("G4", None)]
for k, (m, b) in enumerate(mel):
    at = 28.0 + k * 0.72
    place(music, piano(note(m)), at, 0.24)
    if b:
        place(music, piano(note(b), 3.2), at, 0.3)

# E: the message (35 - 40.07): emotional swell
for i, chord in enumerate([("A3", "C4", "E4"), ("F3", "A3", "C4"), ("E3", "G#3", "B3")]):
    at = 35.0 + i * 1.7
    fs = [note(n) for n in chord]
    place(music, pad(fs, 2.4 if i < 2 else 3.4, a=0.5, r=1.2, bright=0.3, vib=0.25), at, 0.3)
    place(music, piano(fs[0] / 2, 3.0), at, 0.3)
for k, m in enumerate(["E5", "C5", "B4", "A4", "G#4", "B4"]):
    place(music, piano(note(m), 2.4), 35.2 + k * 0.78, 0.2)
music *= np.clip((DUR - np.arange(N) / SR) / 1.0, 0, 1)  # final fade

# ------------------------------------------------------------------ ambience
amb = np.zeros(N)
wind = lowpass_fast(noise(DUR), 260)
wind /= np.abs(wind).max()
lfo = 0.7 + 0.3 * np.sin(2 * np.pi * 0.07 * np.arange(N) / SR)
cave_gain = np.clip((27.9 - np.arange(N) / SR) / 0.6, 0, 1)
amb += wind * lfo * cave_gain * 0.6
for at in np.arange(0.8, 27.5, 1.7) + rng.uniform(-0.4, 0.4, len(np.arange(0.8, 27.5, 1.7))):
    tt = t_arr(0.18)
    f = rng.uniform(900, 1500) * (1 + 1.5 * np.exp(-tt * 40))
    d = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 28)
    place(amb, d, at, 0.18)
    place(amb, d, at + 0.21, 0.06)  # cave echo
# room tone + distant crickets (27.7 - end)
room = lowpass_fast(noise(DUR), 180)
room /= np.abs(room).max()
amb += room * (1 - cave_gain) * 0.25
for at in np.arange(28.3, 40.0, 0.9):
    tt = t_arr(0.12)
    c = np.sin(2 * np.pi * 4300 * tt) * (0.5 + 0.5 * np.sin(2 * np.pi * 60 * tt)) * np.exp(-tt * 20)
    place(amb, c, at, 0.02)

# ------------------------------------------------------------------ sfx
sfx = np.zeros(N)
# walking footsteps (sh01, sh03)
for k in range(6):
    place(sfx, step(0.35), 0.3 + k * 0.5)
    place(sfx, step(0.28), 0.5 + k * 0.5)
for k in range(5):
    place(sfx, step(0.3), 6.7 + k * 0.55)
# fist bump (frame 156)
place(sfx, thump(120, 0.3, 0.6), 5.2, 0.7)
place(sfx, bell(note("E6"), 0.8), 5.22, 0.25)
place(sfx, bell(note("B6"), 0.8), 5.28, 0.18)
# transition whoosh into "Suatu hari"
place(sfx, whoosh(0.7, 200, 2500), 6.2, 0.35)
# chest creak + open + coins (frames 280-300)
tt = t_arr(0.6)
creak = np.sign(np.sin(2 * np.pi * np.cumsum(180 + 120 * np.sin(2 * np.pi * 7 * tt)) / SR)) * 0.3
place(sfx, bandpass_fast(creak, 300, 2500) * env_adsr(len(tt), 0.05, 0.2), 9.3, 0.4)
place(sfx, thump(80, 0.4, 0.4), 9.95, 0.4)
place(sfx, jingle(0.9, 10), 9.9, 0.7)
# gem twinkle
place(sfx, bell(note("E7"), 1.0), 12.15, 0.12)
place(sfx, bell(note("B6"), 1.0), 12.3, 0.1)
# sneaky grab + coins (frame ~410-420)
place(sfx, jingle(0.6, 7), 13.75, 0.5)
# snap zoom: whoosh + hit (frame 438)
place(sfx, whoosh(0.35, 800, 6000), 14.3, 0.5)
place(sfx, thump(45, 1.2, 1.2) * 1.2, 14.6, 0.8)
place(sfx, lowpass_fast(noise(1.2), 300) * np.exp(-t_arr(1.2) * 3), 14.6, 0.35)
# friend running (sh07) + coin rattle
for k in range(7):
    place(sfx, step(0.45), 16.0 + k * 0.29)
    place(sfx, jingle(0.25, 2), 16.05 + k * 0.29, 0.25)
# main running (sh08, sh09)
for k in range(10):
    place(sfx, step(0.5), 17.85 + k * 0.28)
# stone door grinding (20.0 - 21.2) + slam (frame 636)
gr = lowpass_fast(noise(1.3), 400) * (0.6 + 0.4 * np.sin(2 * np.pi * 18 * t_arr(1.3)))
place(sfx, gr / np.abs(gr).max() * env_adsr(int(SR * 1.3), 0.3, 0.05), 19.95, 0.45)
place(sfx, thump(38, 2.0, 1.5) * 1.4, 21.2, 0.95)
place(sfx, lowpass_fast(noise(2.0), 500) * np.exp(-t_arr(2.0) * 2.2), 21.2, 0.5)
# pounding on the door
for at in (21.52, 21.78, 21.9, 22.16, 22.28):
    place(sfx, thump(70, 0.35, 0.3), at, 0.45)
# the vow: low hit on "bersumpah"
place(sfx, thump(40, 1.6, 0.8), 23.55, 0.5)
# phone buzz + notification (frame 918)
for k in range(2):
    tt = t_arr(0.32)
    bz = np.sign(np.sin(2 * np.pi * 150 * tt)) * env_adsr(len(tt), 0.01, 0.05)
    place(sfx, lowpass_fast(bz, 600), 30.6 + k * 0.45, 0.25)
place(sfx, bell(note("G5"), 0.7), 30.62, 0.18)
place(sfx, bell(note("D6"), 0.9), 30.76, 0.16)
# message pops (frame 1050)
place(sfx, bell(note("A5"), 0.7), 35.0, 0.2)
place(sfx, bell(note("E6"), 0.9), 35.1, 0.18)
# heartbeat under the reveal
for at in (37.4, 38.3, 39.2):
    place(sfx, thump(50, 0.35, 0.6), at, 0.4)
    place(sfx, thump(46, 0.3, 0.6), at + 0.18, 0.28)


def write(name, x, peak):
    x = x / (np.abs(x).max() + 1e-9) * peak
    data = (np.clip(x, -1, 1) * 32767).astype(np.int16)
    with wave.open(os.path.join(OUT, name), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())
    print(name, f"{len(x) / SR:.2f}s")


write("music.wav", music, 0.85)
write("ambience.wav", amb, 0.6)
write("sfx.wav", sfx, 0.9)
