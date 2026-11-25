# Synthesizes the music score, ambiences and foley used in the video.
# Pure numpy so it runs in a locked-down environment.
import json, sys, wave, os
import numpy as np

SR = 44100
OUT = sys.argv[1]
VO = sys.argv[2]
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(7)


def write(name, x, stereo=False):
    x = np.asarray(x, dtype=np.float64)
    if not stereo:
        x = np.stack([x, x], axis=1)
    peak = np.max(np.abs(x)) + 1e-9
    if peak > 0.98:
        x = x / peak * 0.98
    data = (x * 32767).astype(np.int16)
    with wave.open(os.path.join(OUT, name), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())


def t_(dur):
    return np.arange(int(dur * SR)) / SR


def fft_filter(x, lo=None, hi=None, tilt=0.0):
    n = len(x)
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(n, 1 / SR)
    g = np.ones_like(f)
    if lo:
        g *= 1 / np.sqrt(1 + (lo / np.maximum(f, 1e-3)) ** 4)
    if hi:
        g *= 1 / np.sqrt(1 + (f / hi) ** 4)
    if tilt:
        g *= (np.maximum(f, 20) / 1000) ** tilt
    return np.fft.irfft(X * g, n)


def noise(dur):
    return rng.standard_normal(int(dur * SR))


def env_adsr(n, a, d, s, r, sustain_len):
    A = int(a * SR); D = int(d * SR); R = int(r * SR); S = int(sustain_len * SR)
    e = np.concatenate([np.linspace(0, 1, A, endpoint=False), np.linspace(1, s, D, endpoint=False), np.full(S, s), np.linspace(s, 0, R)])
    if len(e) < n:
        e = np.concatenate([e, np.zeros(n - len(e))])
    return e[:n]


def reverb(x, secs=2.8, wet=0.35, seed=1, pre=0.02):
    r = np.random.default_rng(seed)
    n = int(secs * SR)
    ir = r.standard_normal(n) * np.exp(-np.arange(n) / SR * (6.9 / secs))
    ir = fft_filter(ir, hi=5000)
    ir[: int(pre * SR)] = 0
    ir /= np.sqrt(np.sum(ir ** 2))
    L = len(x) + n
    nfft = 1 << (L - 1).bit_length()
    y = np.fft.irfft(np.fft.rfft(x, nfft) * np.fft.rfft(ir, nfft), nfft)[: len(x)]
    return x * (1 - wet) + y * wet * 2.2


# ---------------------------------------------------------------- piano
def piano_note(freq, dur, vel=0.6):
    n = int((dur + 2.5) * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    B = 0.0004
    for k in range(1, 9):
        fk = freq * k * np.sqrt(1 + B * k * k)
        if fk > 12000:
            break
        amp = vel * (1 / k ** 1.25) * (1.0 if k == 1 else 0.7)
        decay = 0.9 + 0.55 * k + freq / 900
        out += amp * np.sin(2 * np.pi * fk * t + rng.uniform(0, 6.28)) * np.exp(-t * decay * 0.55)
    # soft hammer
    h = noise(0.02) * np.exp(-np.arange(int(0.02 * SR)) / SR * 300) * 0.05 * vel
    out[: len(h)] += fft_filter(h, lo=800, hi=4000)
    # damper release at dur
    rel = np.ones(n)
    di = int(dur * SR)
    rel[di:] = np.exp(-(np.arange(n - di)) / SR * 3.0)
    attack = np.minimum(1, t / 0.004)
    return out * rel * attack


NOTE = {n: i for i, n in enumerate(["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"])}


def hz(name):
    p, o = name[:-1], int(name[-1])
    return 440 * 2 ** ((NOTE[p] + 12 * (o + 1) - 69) / 12)


TOTAL = 75.0
music = np.zeros(int(TOTAL * SR) + SR * 4)


def add(sig, at, gain=1.0):
    i = int(at * SR)
    j = min(len(music), i + len(sig))
    music[i:j] += sig[: j - i] * gain


BEAT = 60 / 64  # tempo 64 bpm

# chords (left hand roots + voicing) in A minor / C major
chords = {
    "Am": (["A2", "E3"], ["C4", "E4", "A4"]),
    "F": (["F2", "C3"], ["A3", "C4", "F4"]),
    "C": (["C3", "G3"], ["E4", "G4", "C5"]),
    "G": (["G2", "D3"], ["B3", "D4", "G4"]),
    "Em": (["E2", "B2"], ["G3", "B3", "E4"]),
    "Dm": (["D3", "A3"], ["F4", "A4", "D5"]),
    "Fmaj7": (["F2", "C3"], ["A3", "E4", "C5"]),
    "Csus": (["C3", "G3"], ["D4", "G4", "C5"]),
}

# section plan: (start time, chord, style)
plan = []
t = 0.4
prog_a = ["Am", "F", "C", "G"]
prog_b = ["Am", "Em", "F", "C"]
prog_c = ["F", "G", "Am", "C"]
prog_d = ["Fmaj7", "G", "C", "C"]
bar = 4 * BEAT
sections = [
    (0.4, prog_a, "sparse"),
    (0.4 + 4 * bar, prog_b, "arp"),
    (0.4 + 8 * bar, prog_a, "arp_pad"),
    (0.4 + 12 * bar, prog_b, "thin"),
    (0.4 + 16 * bar, prog_c, "build"),
    (0.4 + 20 * bar, prog_d, "full"),
]
for (st, prog, style) in sections:
    for i, ch in enumerate(prog):
        plan.append((st + i * bar, ch, style))

pad = np.zeros_like(music)
for (st, ch, style) in plan:
    if st > TOTAL:
        break
    roots, voicing = chords[ch]
    vel = {"sparse": 0.32, "arp": 0.36, "arp_pad": 0.38, "thin": 0.3, "build": 0.42, "full": 0.48}[style]
    # left hand
    add(piano_note(hz(roots[0]), bar * 0.95, vel * 0.9), st)
    if style != "sparse":
        add(piano_note(hz(roots[1]), bar * 0.8, vel * 0.6), st + BEAT * 2)
    # right hand
    if style == "sparse":
        add(piano_note(hz(voicing[2]), BEAT * 2, vel * 0.8), st + BEAT)
        add(piano_note(hz(voicing[1]), BEAT * 2, vel * 0.6), st + BEAT * 2.5)
    elif style == "thin":
        add(piano_note(hz(voicing[0]), BEAT * 1.5, vel * 0.7), st + BEAT)
        add(piano_note(hz(voicing[2]), BEAT * 2, vel * 0.7), st + BEAT * 2.5)
    else:
        pattern = [0, 1, 2, 1, 0, 1, 2, 1] if style != "full" else [0, 1, 2, 1, 2, 1, 0, 2]
        for k, idx in enumerate(pattern):
            v = vel * (0.75 if k % 2 else 0.95)
            add(piano_note(hz(voicing[idx]), BEAT * 0.9, v * 0.7), st + k * BEAT * 0.5 + rng.uniform(-0.008, 0.008))
        if style in ("build", "full"):
            # melody top note
            top = voicing[2]
            add(piano_note(hz(top) * 2, BEAT * 2, vel * 0.35), st + BEAT * 0.02)
    # string pad
    if style in ("arp_pad", "build", "full", "thin"):
        dur = bar + 0.6
        n = int(dur * SR)
        tt = np.arange(n) / SR
        sig = np.zeros(n)
        for nn in [roots[0]] + voicing:
            f0 = hz(nn)
            for det in (-0.12, 0.0, 0.13):
                fd = f0 * 2 ** (det / 12 / 4)
                for k in range(1, 6):
                    sig += np.sin(2 * np.pi * fd * k * tt + rng.uniform(0, 6)) / (k ** 1.6)
        e = env_adsr(n, 0.9, 0.5, 0.8, 0.8, dur - 2.2)
        lvl = {"arp_pad": 0.010, "thin": 0.006, "build": 0.013, "full": 0.017}[style]
        i0 = int(st * SR)
        j0 = min(len(pad), i0 + n)
        pad[i0:j0] += (sig * e * lvl)[: j0 - i0]

pad = fft_filter(pad, lo=120, hi=2600)
mix = music * 0.55 + pad
# final resolving notes at the end (title card)
add_end = np.zeros_like(mix)
for nm, dt in (("C3", 0), ("G3", 0.05), ("E4", 0.1), ("C5", 0.15), ("G5", 0.6)):
    s = piano_note(hz(nm), 3.5, 0.4)
    i = int((71.2 + dt) * SR)
    add_end[i : i + len(s)] += s[: len(add_end) - i]
mix += add_end * 0.55
L = reverb(mix, 3.2, 0.42, seed=3)
R = reverb(mix, 3.2, 0.42, seed=4)
st = np.stack([L, R], axis=1)[: int(TOTAL * SR)]

# duck under VO
with wave.open(VO) as w:
    vsr = w.getframerate()
    vo = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(float) / 32768
hop = vsr // 100
envv = np.array([np.sqrt(np.mean(vo[i : i + hop] ** 2)) for i in range(0, len(vo) - hop, hop)])
speaking = (envv > 0.01).astype(float)
# smooth (attack/release ~0.25s)
k = np.ones(35) / 35
speaking = np.clip(np.convolve(speaking, k, "same") * 1.6, 0, 1)
duck_db = -5.0
gain = 10 ** (duck_db * speaking / 20)
gi = np.interp(np.arange(len(st)) / SR, np.arange(len(gain)) / 100, gain, right=1.0)
st *= gi[:, None]
# fade in / out
fade = np.ones(len(st))
fi = int(1.5 * SR)
fade[:fi] = np.linspace(0, 1, fi)
fo = int(2.5 * SR)
fade[-fo:] = np.linspace(1, 0, fo)
st *= fade[:, None]
st = st / np.max(np.abs(st)) * 0.9
write("music.wav", st, stereo=True)
print("music ok")

# ---------------------------------------------------------------- ambiences


def crickets(dur, density=6, base=4300):
    n = int(dur * SR)
    out = np.zeros(n)
    for c in range(density):
        f = base + rng.uniform(-500, 600)
        rate = rng.uniform(1.2, 2.2)
        phase = rng.uniform(0, 1)
        tt = np.arange(n) / SR
        chirp_env = (np.sin(2 * np.pi * (tt * rate + phase)) > 0.6).astype(float)
        trem = 0.5 + 0.5 * np.sin(2 * np.pi * 38 * tt)
        sm = np.convolve(chirp_env, np.ones(300) / 300, "same")
        out += np.sin(2 * np.pi * f * tt) * sm * trem * rng.uniform(0.2, 0.5)
    return out


def room_tone(dur):
    return fft_filter(noise(dur), lo=40, hi=400) * 0.02 + fft_filter(noise(dur), lo=2000, hi=6000) * 0.002


def ticks(dur, start=0.0):
    n = int(dur * SR)
    out = np.zeros(n)
    tick = fft_filter(noise(0.012), lo=2500, hi=7000) * np.exp(-np.arange(int(0.012 * SR)) / SR * 500)
    tock = fft_filter(noise(0.014), lo=1500, hi=5000) * np.exp(-np.arange(int(0.014 * SR)) / SR * 400)
    k = 0
    tt = start
    while tt < dur - 0.05:
        s = tick if k % 2 == 0 else tock
        i = int(tt * SR)
        out[i : i + len(s)] += s * 0.5
        tt += 1.0
        k += 1
    return out


write("amb_room_night.wav", room_tone(30) + crickets(30, 5) * 0.012 + fft_filter(noise(30), lo=200, hi=900) * 0.004)
write("clock_ticks.wav", ticks(8))


def traffic(dur, intensity=1.0):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    rumble = fft_filter(noise(dur), lo=30, hi=500) * 0.05 * intensity
    out = rumble.copy()
    # passing motorbikes / cars
    for _ in range(int(dur / 2.2 * intensity)):
        c = rng.uniform(0, dur)
        width = rng.uniform(1.2, 2.5)
        f0 = rng.uniform(70, 140)
        g = np.exp(-((tt - c) / width) ** 2)
        dop = 1 + 0.04 * np.tanh((c - tt) * 2)
        ph = 2 * np.cumsum(f0 * dop) / SR * np.pi
        eng = np.sign(np.sin(ph)) * 0.5 + np.sin(2 * ph) * 0.3
        out += fft_filter(eng * g, lo=60, hi=1800) * 0.05 * rng.uniform(0.5, 1)
        out += fft_filter(noise(dur) * g, lo=300, hi=3000) * 0.015
    return out


def birds(dur, count=10, lvl=0.05):
    n = int(dur * SR)
    out = np.zeros(n)
    for _ in range(count):
        c = rng.uniform(0, dur - 1)
        notes = rng.integers(2, 6)
        f = rng.uniform(2500, 4500)
        for k in range(notes):
            d = rng.uniform(0.05, 0.14)
            tt = np.arange(int(d * SR)) / SR
            sweep = f * (1 + rng.uniform(-0.25, 0.25) * tt / d)
            s = np.sin(2 * np.pi * np.cumsum(sweep) / SR) * np.sin(np.pi * tt / d) ** 2
            i = int((c + k * rng.uniform(0.1, 0.2)) * SR)
            if i + len(s) < n:
                out[i : i + len(s)] += s * lvl * rng.uniform(0.4, 1)
    return out


def crowd_steps(dur, lvl=0.04):
    n = int(dur * SR)
    out = np.zeros(n)
    for _ in range(int(dur * 7)):
        c = rng.uniform(0, dur - 0.1)
        s = fft_filter(noise(0.06), lo=200, hi=2500) * np.exp(-np.arange(int(0.06 * SR)) / SR * 70)
        i = int(c * SR)
        out[i : i + len(s)] += s * lvl * rng.uniform(0.2, 1)
    return out


def murmur(dur, lvl=0.02):
    # distant indistinct voices
    n = int(dur * SR)
    tt = np.arange(n) / SR
    out = np.zeros(n)
    for v in range(5):
        f0 = rng.uniform(110, 220)
        syl = (np.sin(2 * np.pi * rng.uniform(3, 5) * tt + rng.uniform(0, 6)) > 0.2).astype(float)
        syl = np.convolve(syl, np.ones(800) / 800, "same")
        ph = 2 * np.pi * np.cumsum(f0 * (1 + 0.1 * np.sin(2 * np.pi * 0.7 * tt + v))) / SR
        voice = np.sin(ph) + 0.5 * np.sin(2 * ph) + 0.3 * np.sin(3 * ph)
        out += fft_filter(voice * syl, lo=200, hi=1200) * lvl * rng.uniform(0.4, 1)
    return out


write("amb_city_day.wav", traffic(10, 1.0) + birds(10, 4, 0.02) + crowd_steps(10) + murmur(10, 0.012) + fft_filter(noise(10), lo=100, hi=3000) * 0.008)
write("amb_neighborhood.wav", traffic(14, 0.35) * 0.6 + birds(14, 10, 0.03) + fft_filter(noise(14), lo=200, hi=2000) * 0.006 + murmur(14, 0.006))
write("amb_evening.wav", crickets(12, 4) * 0.01 + traffic(12, 0.3) * 0.5 + birds(12, 3, 0.015) + fft_filter(noise(12), lo=100, hi=1500) * 0.006)
write("amb_night_street.wav", crickets(8, 7) * 0.016 + traffic(8, 0.3) * 0.5 + fft_filter(noise(8), lo=60, hi=800) * 0.008 + np.sin(2 * np.pi * 100 * t_(8)) * 0.002)
write("amb_office.wav", fft_filter(noise(10), lo=80, hi=700) * 0.025 + fft_filter(noise(10), lo=3000, hi=8000) * 0.002 + murmur(10, 0.005))
write("amb_morning.wav", birds(14, 26, 0.045) + fft_filter(noise(14), lo=150, hi=2500) * 0.009 + traffic(14, 0.25) * 0.4)

# ---------------------------------------------------------------- foley


def step(var, surface="street"):
    r = np.random.default_rng(100 + var)
    d = 0.12
    nn = int(d * SR)
    tt = np.arange(nn) / SR
    heel = r.standard_normal(nn) * np.exp(-tt * 90)
    toe = np.zeros(nn)
    o = int(0.035 * SR)
    toe[o:] = r.standard_normal(nn - o) * np.exp(-tt[: nn - o] * 120) * 0.6
    s = heel + toe
    if surface == "street":
        s = fft_filter(s, lo=150, hi=3500) + fft_filter(r.standard_normal(nn) * np.exp(-tt * 40), lo=3000, hi=9000) * 0.1
    else:
        s = fft_filter(s, lo=80, hi=1500)
    thump = np.sin(2 * np.pi * 85 * tt) * np.exp(-tt * 60) * 0.5
    return (s + thump) * 0.5


for v in range(4):
    write(f"step{v}.wav", step(v))


def key_click(r):
    d = 0.03
    tt = t_(d)
    s = r.standard_normal(len(tt)) * np.exp(-tt * 300)
    return fft_filter(s, lo=1200, hi=7000) * 0.5 + np.sin(2 * np.pi * 900 * tt) * np.exp(-tt * 250) * 0.1


def typing(dur, speed=9, seed=5):
    r = np.random.default_rng(seed)
    n = int(dur * SR)
    out = np.zeros(n)
    tt = 0.05
    while tt < dur - 0.05:
        c = key_click(r)
        i = int(tt * SR)
        out[i : i + len(c)] += c * r.uniform(0.4, 1)
        gap = r.exponential(1 / speed)
        if r.uniform() < 0.08:
            gap += r.uniform(0.2, 0.5)
        tt += max(0.045, gap)
    return out * 0.6


write("typing_fast.wav", typing(4, 11, 5))
write("typing_slow.wav", typing(4, 5, 6))


def thud(freq=90, d=0.25, lvl=0.6, click=0.3):
    tt = t_(d)
    s = np.sin(2 * np.pi * freq * tt * (1 - tt)) * np.exp(-tt * 25) * lvl
    s += fft_filter(noise(d) * np.exp(-tt * 120), lo=800, hi=5000) * click
    return s


lc = np.zeros(int(0.6 * SR))
slide = fft_filter(noise(0.35), lo=600, hi=4000) * np.sin(np.pi * t_(0.35) / 0.35) * 0.04
lc[: len(slide)] += slide
cl = thud(120, 0.25, 0.4, 0.35)
i = int(0.33 * SR)
lc[i : i + len(cl)] += cl
write("laptop_close.wav", lc)
lo_ = np.zeros(int(0.5 * SR))
cl2 = thud(150, 0.2, 0.15, 0.25)
lo_[: len(cl2)] += cl2
sl = fft_filter(noise(0.3), lo=600, hi=4000) * np.sin(np.pi * t_(0.3) / 0.3) * 0.03
lo_[int(0.08 * SR) : int(0.08 * SR) + len(sl)] += sl
write("laptop_open.wav", lo_)


def clink():
    tt = t_(0.6)
    s = sum(np.sin(2 * np.pi * f * tt) * np.exp(-tt * dcy) * a for f, dcy, a in ((2350, 9, 0.3), (3900, 14, 0.2), (5200, 20, 0.12)))
    s += thud(200, 0.1, 0.2, 0.2)[: len(tt)] if False else 0
    return s * 0.5


write("mug.wav", np.concatenate([thud(180, 0.15, 0.3, 0.2), np.zeros(10)]) * 1.0 + 0)
write("book.wav", thud(70, 0.3, 0.7, 0.5))
write("frame.wav", thud(260, 0.12, 0.25, 0.3))


def breath(dur=1.6, lvl=0.08):
    tt = t_(dur)
    e = np.sin(np.pi * np.clip(tt / dur, 0, 1)) ** 1.5 * np.exp(-tt * 0.6)
    s = fft_filter(noise(dur), lo=300, hi=2200) * e * lvl
    return s


write("sigh.wav", breath(1.8, 0.09))


def zipper(dur=0.7):
    tt = t_(dur)
    teeth = (np.sin(2 * np.pi * (60 + 40 * tt / dur) * tt * 6) > 0.7).astype(float)
    s = fft_filter(noise(dur) * teeth, lo=1500, hi=7000) * 0.3 * np.sin(np.pi * tt / dur)
    return s


write("zipper.wav", zipper())
write("paper.wav", fft_filter(noise(0.8), lo=1500, hi=8000) * np.sin(np.pi * t_(0.8) / 0.8) ** 2 * 0.12)


def sweep(dur=7, lvl=0.05):
    tt = t_(dur)
    s = fft_filter(noise(dur), lo=100, hi=500) * np.sin(np.pi * tt / dur) ** 2 * lvl
    return s


write("broom.wav", np.concatenate([fft_filter(noise(0.5), lo=1500, hi=6000) * np.sin(np.pi * t_(0.5) / 0.5) * 0.06 for _ in range(1)] * 1))


def swell(dur=2.5, lvl=0.07):
    tt = t_(dur)
    e = (tt / dur) ** 2
    e[int(0.9 * len(e)) :] *= np.linspace(1, 0, len(e) - int(0.9 * len(e)))
    return fft_filter(noise(dur), lo=200, hi=1400) * e * lvl


write("swell.wav", swell())


def rooster():
    tt = t_(1.4)
    f = 520 + 260 * np.sin(np.pi * np.clip(tt / 1.2, 0, 1)) - 200 * (tt > 1.0) * (tt - 1.0) / 0.4
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = (np.sin(ph) + 0.5 * np.sin(2 * ph) + 0.3 * np.sin(3 * ph)) * np.clip(np.sin(np.pi * tt / 1.4), 0, 1) ** 0.5
    return fft_filter(s, lo=300, hi=3000) * 0.1


write("rooster.wav", reverb(rooster(), 1.5, 0.6))
write("bus.wav", traffic(6, 0.6) * 0.8)
print("sfx ok")
