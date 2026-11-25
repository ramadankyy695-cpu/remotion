# Aligns the original VO script to the audio using detected pauses.
# Sentence/phrase segments come from silencedetect (-38dB, 0.18s); short internal
# pauses (-30dB, 0.1s) are used as anchors to snap word boundaries.
import json, re, sys

segs = [
 (0.00, 0.36, "Pernah"),
 (0.74, 2.26, "nggak lo menunda sesuatu"),
 (2.48, 3.43, "bukan karena malas,"),
 (3.73, 5.87, "tapi karena merasa masih punya banyak waktu?"),
 (6.92, 7.57, "Lo bilang nanti"),
 (7.92, 9.60, "mau bahagiain orang tua."),
 (10.26, 11.44, "Nanti mau punya rumah sendiri."),
 (12.21, 14.71, "Nanti mau berhenti hidup dalam kekhawatiran."),
 (15.83, 18.87, "Tapi hari demi hari berlalu,"),
 (19.44, 21.92, "dan ternyata hidup nggak selalu menunggu kesiapan lo."),
 (23.07, 25.44, "Ada orang tua yang usianya terus bertambah."),
 (26.28, 28.20, "Ada kesempatan yang perlahan hilang."),
 (29.23, 30.86, "Dan ada mimpi yang terlalu lama"),
 (31.14, 32.18, "cuma menjadi rencana."),
 (33.16, 33.80, "Kadang,"),
 (34.04, 35.41, "bukan karena lo nggak berusaha."),
 (36.23, 40.25, "Lo cuma terlalu sibuk bertahan sampai lupa bahwa hidup juga perlu dijalani."),
 (41.42, 42.20, "Lo bekerja,"),
 (42.65, 43.36, "lo lelah,"),
 (43.87, 44.76, "lo mencoba lagi."),
 (45.83, 46.66, "Tapi diam-diam,"),
 (47.09, 49.42, "lo takut kalau semua usaha ini"),
 (49.71, 51.19, "ternyata nggak membawa lo ke mana-mana."),
 (52.38, 52.87, "Dan mungkin,"),
 (53.39, 54.51, "hari ini lo belum berhasil."),
 (55.34, 57.16, "Belum punya apa yang lo inginkan."),
 (58.02, 60.83, "Belum bisa memberikan semuanya kepada orang yang lo sayangi."),
 (61.93, 64.00, "Tapi jangan sampai karena lo belum sampai,"),
 (64.36, 66.21, "lo menganggap perjalanan lo nggak berarti."),
 (67.27, 68.84, "Karena selama lo masih berusaha,"),
 (69.25, 70.47, "cerita lo belum selesai."),
]
anchors = [(1.72,1.90),(5.65,5.79),(13.58,13.73),(16.50,16.67),(37.92,38.05),(39.42,39.58),(47.40,47.51),(47.60,47.74),(56.09,56.22),(64.82,64.93)]

def syl(w):
    w = re.sub(r"[^a-z]", "", w.lower())
    w = w.replace("ng", "N").replace("ny", "Y")
    groups = re.findall(r"[aeiou]+", w)
    n = 0
    for g in groups:
        # diphthongs ai, au, oi count as one
        n += 1 if g in ("ai", "au", "oi") else len(g)
    return max(1, n)

words = []
for (a, b, text) in segs:
    ws = text.split()
    weights = [syl(w) + 0.35 for w in ws]
    tot = sum(weights)
    bounds = [a]
    acc = 0
    for wt in weights:
        acc += wt
        bounds.append(a + (b - a) * acc / tot)
    # snap internal boundaries to anchors inside this segment
    for (s, e) in anchors:
        if a < s < b:
            i = min(range(1, len(bounds) - 1), key=lambda k: abs(bounds[k] - s)) if len(bounds) > 2 else None
            if i is None:
                continue
            # rescale words before and after the anchor
            left = [a + (s - a) * (bounds[k] - a) / (bounds[i] - a) for k in range(0, i + 1)]
            right = [e + (b - e) * (bounds[k] - bounds[i]) / (b - bounds[i]) for k in range(i, len(bounds))]
            # boundary i: left word ends at s, right word starts at e
            new = left[:-1] + [s]
            bounds_end = new
            starts = left[:-1] + [e] + right[1:]
            ends = left[1:] + right[1:]
            bounds = None
            seg_words = []
            for k, w in enumerate(ws):
                st = starts[k]
                en = left[k + 1] if k < i else right[k - i + 1]
                seg_words.append((w, st, en))
            break
    else:
        seg_words = [(w, bounds[k], bounds[k + 1]) for k, w in enumerate(ws)]
    for (w, st, en) in seg_words:
        words.append({"text": w, "start": round(st, 3), "end": round(en, 3)})

json.dump(words, open(sys.argv[1], "w"), indent=1, ensure_ascii=False)
print(len(words), "words")
for w in words[:12]:
    print(w)
