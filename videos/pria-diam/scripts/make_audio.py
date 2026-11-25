"""Synthesizes the music bed and the SFX/ambience track for the video.

Everything is generated procedurally (no external samples) and timed to the
VO word timestamps. Usage: python3 make_audio.py <vo.wav> <out_dir>
"""
import sys
import numpy as np
from scipy import signal
from scipy.io import wavfile

SR = 48000
DUR = 52.5
N = int(SR * DUR)
rng = np.random.default_rng(1234)

vo_path, out_dir = sys.argv[1], sys.argv[2]


def t_axis(n):
    return np.arange(n) / SR


def lp(x, f, order=2):
    sos = signal.butter(order, f, 'low', fs=SR, output='sos')
    return signal.sosfilt(sos, x, axis=0)


def hp(x, f, order=2):
    sos = signal.butter(order, f, 'high', fs=SR, output='sos')
    return signal.sosfilt(sos, x, axis=0)


def bp(x, lo, hi, order=2):
    sos = signal.butter(order, [lo, hi], 'band', fs=SR, output='sos')
    return signal.sosfilt(sos, x, axis=0)


def env_ar(n, a, r):
    """attack/release envelope in seconds, n samples"""
    t = t_axis(n)
    e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) / max(r, 1e-4))
    return e


def place(buf, x, t0, gain=1.0, pan=0.0):
    i = int(t0 * SR)
    if i >= len(buf):
        return
    if x.ndim == 1:
        l = np.cos((pan + 1) * np.pi / 4)
        r = np.sin((pan + 1) * np.pi / 4)
        x = np.stack([x * l, x * r], axis=1) * np.sqrt(2)
    j = min(len(buf), i + len(x))
    if i < 0:
        x = x[-i:]
        i = 0
        j = min(len(buf), len(x))
    buf[i:j] += x[: j - i] * gain


def fade_curve(t, keys):
    """piecewise-linear gain over absolute time keys [(t, g), ...]"""
    ts = [k[0] for k in keys]
    gs = [k[1] for k in keys]
    return np.interp(t, ts, gs)


def reverb(x, seconds=2.6, mix=0.35, damp=3000, seed=0):
    r = np.random.default_rng(seed)
    n = int(SR * seconds)
    tt = t_axis(n)
    ir = np.zeros((n, 2))
    for ch in range(2):
        noise = r.standard_normal(n)
        noise = lp(noise, damp)
        ir[:, ch] = noise * np.exp(-tt * 6.9 / seconds)
    ir[: int(0.012 * SR)] = 0
    ir /= np.sqrt(np.sum(ir ** 2, axis=0, keepdims=True))
    wet = np.stack([signal.fftconvolve(x[:, ch], ir[:, ch])[: len(x)] for ch in range(2)], axis=1)
    return x * (1 - mix) + wet * mix * 1.6


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


# ---------------------------------------------------------------- MUSIC
def piano(freq, dur=3.5, vel=0.5):
    n = int(SR * dur)
    t = t_axis(n)
    out = np.zeros(n)
    B = 0.0004
    for k in range(1, 10):
        fk = freq * k * np.sqrt(1 + B * k * k)
        if fk > SR / 2.2:
            break
        amp = (1 / k ** 1.35) * (0.6 + 0.4 * vel ** (0.5 * k))
        decay = 0.9 + 0.55 * k + freq / 900
        out += amp * np.sin(2 * np.pi * fk * t + rng.uniform(0, 6.28)) * np.exp(-t * decay)
    # second slow decay stage (sustain of piano)
    out *= 0.65 + 0.35 * np.exp(-t * 2.5)
    att = np.minimum(1, t / 0.004)
    hammer = lp(rng.standard_normal(n), 2500) * np.exp(-t * 60) * 0.05
    rel = np.minimum(1, np.maximum(0, (dur - t) / 0.25))
    return (out * att + hammer) * rel * vel


def pad(freqs, dur, attack=1.8, release=2.0, bright=1400):
    n = int(SR * dur)
    t = t_axis(n)
    out = np.zeros((n, 2))
    for f in freqs:
        for ch, det in enumerate([-0.0035, 0.0035]):
            for d2 in [0, 0.0018]:
                ff = f * (1 + det + d2)
                ph = rng.uniform(0, 1)
                saw = 2 * ((ff * t + ph) % 1) - 1
                out[:, ch] += saw
    out = lp(out, bright, order=2)
    out = lp(out, bright * 1.4, order=1)
    e = np.minimum(1, t / attack) * np.minimum(1, np.maximum(0, (dur - t) / release))
    vib = 1 + 0.08 * np.sin(2 * np.pi * 0.23 * t)
    return out * (e * vib)[:, None] / (len(freqs) * 3)


music = np.zeros((N, 2))

# chords (midi notes) per 4-second bar; D minor -> Bb -> F -> C
CH = {
    'Dm': [50, 57, 62, 65, 69],
    'Bb': [46, 53, 58, 62, 65],
    'F': [41, 48, 53, 57, 60],
    'C': [48, 55, 60, 64, 67],
    'Gm': [43, 50, 55, 58, 62],
    'Am': [45, 52, 57, 60, 64],
}
bars = [
    (0.0, 'Dm'), (4.0, 'Bb'), (8.0, 'F'), (12.0, 'C'),
    (14.33, 'Gm'), (17.0, 'Dm'),  # flashback
    (19.7, 'Bb'), (23.0, 'F'), (26.0, 'C'), (28.5, 'Dm'),  # street
    (30.0, 'F'), (32.0, 'C'),  # friends / work
    (34.4, 'Dm'),  # padahal (thin)
    (38.3, 'Bb'), (41.0, 'Gm'),  # someone asks
    (43.4, 'Am'),  # ga apa-apa
    (44.7, 'Bb'), (47.0, 'F'), (49.0, 'C'), (50.6, 'F'),  # warm ending
]
bar_end = [b[0] for b in bars[1:]] + [DUR]

# intensity curve of the arrangement (0..1)
def intensity(t):
    return fade_curve(t, [(0, 0.35), (6.5, 0.5), (14.0, 0.62), (14.33, 0.45), (19.6, 0.55), (23.5, 0.72), (29.8, 0.8),
                          (30.0, 0.7), (34.3, 0.7), (34.8, 0.22), (38.0, 0.3), (38.3, 0.45), (44.6, 0.55), (47.0, 0.85),
                          (50.5, 1.0), (52.5, 0.9)])

for (t0, name), t1 in zip(bars, bar_end):
    notes = CH[name]
    dur = t1 - t0
    k = intensity(t0)
    # pad (strings) — very soft in the "padahal" section
    padg = 0.0 if 34.6 <= t0 < 38.2 else (0.10 + 0.2 * k)
    if t0 >= 44.6:
        padg *= 1.35
    if padg > 0:
        p = pad([midi(m) for m in notes[1:4]], dur + 2.0, attack=1.6 if t0 > 0 else 3.5, release=2.2, bright=900 + 900 * k)
        place(music, p, t0, padg)
    # sub / bass
    if t0 < 34.6 or t0 >= 38.2:
        f = midi(notes[0] - 12)
        nb = int(SR * (dur + 1.5))
        tb = t_axis(nb)
        bass = np.sin(2 * np.pi * f * tb) * np.minimum(1, tb / 0.8) * np.minimum(1, np.maximum(0, (dur + 1.5 - tb) / 1.5))
        place(music, bass, t0, 0.08 + 0.08 * k)
    # piano arpeggio
    step = 0.5 if k < 0.6 else 0.375
    pattern = [0, 2, 3, 4, 3, 2, 1, 2]
    i = 0
    tt = t0
    while tt < t1 - 0.05:
        if 34.6 <= tt < 38.2:
            # sparse single notes in the lonely section
            if abs((tt - 34.6) % 1.5) < 0.01:
                place(music, piano(midi(notes[3] + 12), 3.0, 0.35), tt, 0.5, pan=0.2)
            tt += 0.5
            continue
        idx = pattern[i % len(pattern)]
        m = notes[idx] + (12 if idx >= 3 and k > 0.75 else 0)
        vel = 0.35 + 0.25 * k + (0.1 if i % 4 == 0 else 0)
        if 14.33 <= tt < 19.7:
            m += 12  # music-box memory
            vel *= 0.75
        place(music, piano(midi(m), 3.2, vel), tt, 0.55, pan=(idx - 2) * 0.18)
        if i % 8 == 0:
            place(music, piano(midi(notes[0]), 4.0, vel * 0.9), tt, 0.45, pan=-0.1)
        tt += step
        i += 1

# final resolving chord
for m in CH['F'] + [72]:
    place(music, piano(midi(m), 4.5, 0.55), 50.6, 0.4, pan=(m - 55) / 30)

music = reverb(music, seconds=3.2, mix=0.42, damp=4200, seed=3)
music = lp(music, 9000)

# ---------------------------------------------------------------- VO (for ducking + level reference)
vsr, vo = wavfile.read(vo_path)
vo = vo.astype(np.float32) / 32768.0
if vo.ndim > 1:
    vo = vo.mean(axis=1)
vo48 = signal.resample_poly(vo, SR, vsr)
vo_full = np.zeros(N)
vo_full[: min(N, len(vo48))] = vo48[:N]
vo_env = np.sqrt(lp(vo_full ** 2, 3.0, order=2).clip(0))
vo_rms = np.sqrt(np.mean(vo48 ** 2))
speech = (vo_env > vo_rms * 0.35).astype(float)
speech = lp(lp(speech, 2.0), 2.0)  # smooth ~ 250ms
duck = 1 - 0.45 * np.clip(speech, 0, 1)

music *= duck[:, None]
music *= np.clip(fade_curve(t_axis(N), [(0, 0.0), (0.6, 1.0), (51.4, 1.0), (52.5, 0.0)]), 0, 1)[:, None]

# ---------------------------------------------------------------- SFX / AMBIENCE
sfx = np.zeros((N, 2))
T = t_axis(N)


def noise(n, color='white', ch=2):
    x = rng.standard_normal((n, ch))
    if color == 'brown':
        x = np.cumsum(x, axis=0)
        x = hp(x, 20)
        x /= np.max(np.abs(x)) + 1e-9
    elif color == 'pink':
        x = lp(x, 1200, 1) + 0.3 * x
    return x


# rain: indoor muffled for bedroom, brighter at window scenes
def rain_layer(t0, t1, bright, density=1.0, seed=0):
    n = int((t1 - t0) * SR)
    base = noise(n) * 0.25
    base = bp(base, 250, bright)
    # random drops
    drops = np.zeros((n, 2))
    r = np.random.default_rng(seed)
    count = int((t1 - t0) * 70 * density)
    for _ in range(count):
        i = r.integers(0, n - 2000)
        d = r.standard_normal(600) * np.exp(-np.arange(600) / 70)
        d = bp(d, 1500, min(9000, bright * 2.5))
        drops[i:i + 600, r.integers(0, 2)] += d * r.uniform(0.05, 0.35)
    return base + drops


rain_gain = fade_curve(T, [(0, 0), (0.4, 1), (13.9, 1), (14.33, 0), (38.0, 0), (38.3, 1), (47.0, 1), (50.5, 0.0)])
r1 = rain_layer(0, 14.6, 1100, 1.0, 1)
place(sfx, r1, 0, 0.22)
r2 = rain_layer(38.0, 52.5, 3200, 1.4, 2)
place(sfx, r2, 38.0, 0.3)
sfx *= rain_gain[:, None]

# distant thunder rumble
th = lp(noise(int(5.5 * SR), 'brown'), 160) * env_ar(int(5.5 * SR), 1.2, 1.6)[:, None]
place(sfx, th, 0.6, 0.3)
place(sfx, th[::-1] * 0.6, 38.4, 0.35)

# phone notification
def ding(f1, f2, dur=0.5):
    n = int(dur * SR)
    t = t_axis(n)
    a = np.sin(2 * np.pi * f1 * t) * np.exp(-t * 14)
    b = np.sin(2 * np.pi * f2 * t) * np.exp(-np.maximum(0, t - 0.09) * 10) * (t > 0.09)
    return (a + b) * 0.5


place(sfx, ding(1318.5, 1760), 5.0, 0.12, pan=0.1)

# sigh / breath at 4.1s and 36.2s, 45.4s
def breath(dur=1.3, f=(350, 1600)):
    n = int(dur * SR)
    t = t_axis(n)
    x = bp(rng.standard_normal(n), *f)
    e = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 2
    return x * e


place(sfx, breath(1.4), 4.05, 0.16)
place(sfx, breath(1.6, (300, 1300)), 36.0, 0.13)
place(sfx, breath(1.2, (300, 1300)), 45.5, 0.11)

# phone typing taps / deleting ticks
MSG_LEN = 37
def tap(f=3200, length=0.025, g=1.0):
    n = int(length * SR)
    x = rng.standard_normal(n) * np.exp(-np.arange(n) / (n / 6))
    return bp(x, f * 0.6, min(f * 1.6, 15000)) * g


for i in range(MSG_LEN):
    place(sfx, tap(3000), 6.9 + 2.4 * i / MSG_LEN + rng.uniform(-0.01, 0.01), 0.08, pan=0.05)
for i in range(MSG_LEN):
    place(sfx, tap(2300, 0.02), 12.2 + 1.4 * i / MSG_LEN, 0.07, pan=0.05)
place(sfx, tap(1800, 0.04), 13.95, 0.15)  # lock click

# flashback: whoosh swell in, clock ticking, muffled room tone
def whoosh(dur=1.0, lo=200, hi=4000, rev=False):
    n = int(dur * SR)
    t = t_axis(n)
    x = noise(n)
    # sweeping bandpass emulated by crossfading two filters
    a = bp(x, lo, lo * 4)
    b = bp(x, hi / 4, hi)
    k = (t / dur)[:, None]
    y = a * (1 - k) + b * k
    e = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 2
    y = y * e[:, None]
    return y[::-1] if rev else y


place(sfx, whoosh(1.1, 300, 6000), 13.6, 0.22)
place(sfx, reverb(whoosh(0.9, 200, 3000, True), 2.0, 0.5), 19.2, 0.3)
place(sfx, whoosh(0.5, 400, 7000), 29.7, 0.18)
place(sfx, lp(whoosh(1.2, 80, 900), 1200), 37.6, 0.25)
place(sfx, whoosh(0.9, 200, 2500), 46.4, 0.18)

for k in range(6):
    tk = 14.5 + k * 0.95
    n = int(0.03 * SR)
    c = bp(rng.standard_normal(n) * np.exp(-np.arange(n) / 200), 2500, 6000)
    place(sfx, c, tk, 0.09)
room = lp(noise(int(5.6 * SR), 'pink'), 600) * 0.05
place(sfx, room * fade_curve(t_axis(len(room)), [(0, 0), (0.4, 1), (5.0, 1), (5.6, 0)])[:, None], 14.3, 1.0)

# street: traffic rumble + crowd babble + footsteps + distant horn
st0, st1 = 19.6, 30.15
ns = int((st1 - st0) * SR)
ts = t_axis(ns)
traffic = lp(noise(ns, 'brown'), 300) * 0.5 + bp(noise(ns), 300, 1200) * 0.05
babble = np.zeros((ns, 2))
for v in range(10):
    f0 = rng.uniform(140, 260)
    car = bp(rng.standard_normal(ns), f0 * 2, f0 * 9)
    syl = (0.5 + 0.5 * np.sin(2 * np.pi * rng.uniform(3, 6) * ts + rng.uniform(0, 6))) ** 2
    phrase = (lp(rng.standard_normal(ns), 0.7) > -0.02).astype(float)
    phrase = lp(phrase, 4)
    v_sig = car * syl * phrase
    p = rng.uniform(-0.8, 0.8)
    babble[:, 0] += v_sig * np.cos((p + 1) * np.pi / 4)
    babble[:, 1] += v_sig * np.sin((p + 1) * np.pi / 4)
babble = reverb(babble, 1.2, 0.4, seed=5)
street_gain = fade_curve(ts + st0, [(19.6, 0), (20.4, 0.15), (23.4, 1), (29.6, 1), (30.15, 0)])
street = (traffic * 0.5 + babble * 0.16) * street_gain[:, None]
# memory echo at start: heavy reverb on the child steps
place(sfx, street, st0, 0.9)

# footsteps (match walk cycle used in Scene4)
def step_sound(g=1.0, bright=2500):
    n = int(0.12 * SR)
    t = t_axis(n)
    thump = np.sin(2 * np.pi * 85 * t) * np.exp(-t * 45)
    scuff = bp(rng.standard_normal(n), 400, bright) * np.exp(-t * 35)
    return (thump * 0.6 + scuff * 0.8) * g


prev = None
for i in range(int((30.1 - 19.6) * 200)):
    abs_t = 19.6 + i / 200
    grow = np.clip((abs_t - 19.9) / (22.6 - 19.9), 0, 1)
    grow = grow * grow * (3 - 2 * grow)
    freq = 5.6 - grow * 0.9
    ph = (abs_t - 19.6) * freq
    s = np.sin(ph)
    if prev is not None and np.sign(s) != np.sign(prev) and s != 0:
        g = 0.1 + 0.06 * grow
        st = step_sound(g, 1800 + 1500 * grow)
        if abs_t < 22.0:
            st = reverb(np.stack([st, st], 1), 1.8, 0.55, seed=int(abs_t * 10))[:, 0]
        place(sfx, st, abs_t, 1.0, pan=0.1 if np.sign(s) > 0 else -0.1)
    prev = s

# passing crowd steps (random)
for i in range(70):
    tt = rng.uniform(22.5, 29.8)
    place(sfx, step_sound(0.05, 2000), tt, 1.0, pan=rng.uniform(-0.8, 0.8))

# distant car horn
nh = int(0.45 * SR)
th_ = t_axis(nh)
horn = (signal.sawtooth(2 * np.pi * 392 * th_) + signal.sawtooth(2 * np.pi * 466 * th_)) * env_ar(nh, 0.02, 0.3)
place(sfx, reverb(np.stack([lp(horn, 1500)] * 2, 1), 1.5, 0.6, seed=9), 26.8, 0.05)

# cafe ambience (murmur + clinks + light laughter)
def cafe_bed(t0, t1, seed):
    n = int((t1 - t0) * SR)
    t = t_axis(n)
    r = np.random.default_rng(seed)
    out = np.zeros((n, 2))
    for v in range(7):
        f0 = r.uniform(110, 240)
        car = bp(r.standard_normal(n), f0 * 2, f0 * 8)
        syl = (0.5 + 0.5 * np.sin(2 * np.pi * r.uniform(3.5, 6) * t + r.uniform(0, 6))) ** 2
        p = r.uniform(-0.7, 0.7)
        out[:, 0] += car * syl * np.cos((p + 1) * np.pi / 4)
        out[:, 1] += car * syl * np.sin((p + 1) * np.pi / 4)
    out = reverb(out, 1.4, 0.45, seed=seed)
    return out * 0.12 + lp(noise(n, 'pink'), 900) * 0.02


def laugh(f0=200, dur=1.2, seed=0):
    """group-ish laughter: voiced 'ha' syllables (glottal pulses through vowel formants)"""
    r = np.random.default_rng(seed)
    n = int(dur * SR)
    t = t_axis(n)
    f = f0 * (1 + 0.15 * np.exp(-t * 2)) * (1 + 0.02 * np.sin(2 * np.pi * 5 * t))
    phase = np.cumsum(f) / SR
    pulses = (np.mod(phase, 1) < 0.08).astype(float)
    voiced = bp(pulses, 650, 1300) + 0.6 * bp(pulses, 1000, 1500) + 0.3 * bp(pulses, 2300, 3000)
    rate = r.uniform(4.2, 5.2)
    syl = np.clip(np.sin(2 * np.pi * rate * t), 0, 1) ** 1.5
    breathy = bp(r.standard_normal(n), 800, 3500) * 0.35
    e = np.minimum(1, t / 0.05) * np.exp(-t * 1.2)
    return (voiced + breathy * syl) * syl * e


cb = cafe_bed(29.95, 31.75, 11)
cb *= fade_curve(t_axis(len(cb)), [(0, 0), (0.15, 1), (1.65, 1), (1.8, 0)])[:, None]
place(sfx, cb, 29.95, 1.0)
cb2 = cafe_bed(32.85, 38.4, 12)
cb2 *= fade_curve(t_axis(len(cb2)) + 32.85, [(32.85, 0), (33.0, 1), (34.4, 1), (35.6, 0.0), (38.4, 0)])[:, None]
place(sfx, cb2, 32.85, 1.0)
for i, (f0, tt, pan) in enumerate([(210, 30.05, -0.4), (165, 30.15, 0.35), (240, 30.3, 0.1), (190, 32.9, -0.3), (230, 33.0, 0.4), (175, 33.15, 0.0)]):
    lg = laugh(f0, 1.25, i)
    place(sfx, reverb(np.stack([lg, lg], 1), 1.0, 0.35, seed=i), tt, 0.045, pan=pan)


def clink(f=2400):
    n = int(0.5 * SR)
    t = t_axis(n)
    return (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 2.76 * t)) * np.exp(-t * 18)


place(sfx, clink(2600), 30.75, 0.05, pan=0.2)
place(sfx, clink(3100), 33.4, 0.04, pan=-0.3)

# office: keyboard + AC hum
o0, o1 = 31.67, 32.9
no = int((o1 - o0) * SR)
hum = (np.sin(2 * np.pi * 60 * t_axis(no)) * 0.2 + lp(rng.standard_normal(no), 500) * 0.6) * 0.06
hum *= fade_curve(t_axis(no), [(0, 0), (0.05, 1), (no / SR - 0.05, 1), (no / SR, 0)])
place(sfx, hum, o0, 1.0)
kt = o0 + 0.03
while kt < o1 - 0.05:
    place(sfx, tap(2600, 0.03, 1.0) + tap(900, 0.03, 0.6), kt, 0.08, pan=rng.uniform(-0.15, 0.15))
    kt += rng.uniform(0.06, 0.16)

# heartbeat during "padahal ... sendirian"
def heartbeat():
    n = int(0.9 * SR)
    t = t_axis(n)
    lub = np.sin(2 * np.pi * 52 * t) * np.exp(-t * 22)
    dub = np.sin(2 * np.pi * 46 * np.maximum(0, t - 0.28)) * np.exp(-np.maximum(0, t - 0.28) * 26) * (t > 0.28)
    return lp(lub + 0.7 * dub, 180)


for k in range(4):
    place(sfx, heartbeat(), 35.5 + k * 0.92, 0.55 * (0.6 + 0.4 * min(1, k / 2)))

# window scene: Dimas footsteps on wood, hand on shoulder (cloth rustle)
for k in range(5):
    place(sfx, step_sound(0.12, 1500), 38.65 + k * 0.38, 1.0, pan=0.5 - k * 0.1)
rust = bp(rng.standard_normal(int(0.35 * SR)), 700, 4000) * env_ar(int(0.35 * SR), 0.05, 0.12)
place(sfx, rust, 40.35, 0.1, pan=0.2)
place(sfx, rust, 41.2, 0.06, pan=0.1)
# sitting on the sofa (soft thump + rustle) at the cut
place(sfx, lp(step_sound(0.2, 800), 400), 46.95, 1.0)
place(sfx, rust, 47.0, 0.08)

# dawn birds
def chirp(seed):
    r = np.random.default_rng(seed)
    out = []
    for _ in range(r.integers(2, 5)):
        d = r.uniform(0.05, 0.12)
        n = int(d * SR)
        t = t_axis(n)
        f = r.uniform(3200, 5200) + r.uniform(-1500, 1500) * t / d
        ph = 2 * np.pi * np.cumsum(f) / SR
        out.append(np.sin(ph) * np.sin(np.pi * t / d) ** 2)
        out.append(np.zeros(int(r.uniform(0.04, 0.1) * SR)))
    return np.concatenate(out)


for k in range(12):
    tt = 48.8 + k * 0.33 + rng.uniform(0, 0.25)
    if tt < 52.0:
        place(sfx, chirp(k), tt, 0.035 * min(1, (tt - 48.6) / 1.5), pan=rng.uniform(-0.6, 0.6))

sfx = lp(sfx, 14000)
sfx *= fade_curve(T, [(0, 0), (0.2, 1), (51.6, 1), (52.5, 0)])[:, None]

# ---------------------------------------------------------------- levels
def rms(x):
    return float(np.sqrt(np.mean(x ** 2)))


# Music RMS target ~ -15 dB under VO, sfx ~ -16 dB under VO (sections differ)
m_rms = rms(music[int(1 * SR): int(50 * SR)])
music *= (vo_rms * 10 ** (-13.5 / 20)) / (m_rms + 1e-9)
s_rms = rms(sfx[int(1 * SR): int(50 * SR)])
sfx *= (vo_rms * 10 ** (-22.0 / 20)) / (s_rms + 1e-9)
# soft-limit transients (taps, steps, whooshes) so no effect pokes out above the VO
lim = vo_rms * 10 ** (-4.0 / 20) * 2.0
sfx = lim * np.tanh(sfx / lim)

for name, x in [('music', music), ('sfx', sfx)]:
    peak = np.max(np.abs(x))
    if peak > 0.5:
        x *= 0.5 / peak
    wavfile.write(f'{out_dir}/{name}.wav', SR, (x * 32767).astype(np.int16))
    print(name, 'rms', 20 * np.log10(rms(x) + 1e-9), 'peak', 20 * np.log10(np.max(np.abs(x)) + 1e-9))
print('vo rms', 20 * np.log10(vo_rms))
