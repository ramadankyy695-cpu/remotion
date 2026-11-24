export type V3 = [number, number, number];

export const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const lerp3 = (a: V3, b: V3, t: number): V3 => [
	lerp(a[0], b[0], t),
	lerp(a[1], b[1], t),
	lerp(a[2], b[2], t),
];
export const easeInOut = (t: number) =>
	t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeIn = (t: number) => t * t * t;
/** progress of f between frames a..b, clamped */
export const seg = (f: number, a: number, b: number) => clamp01((f - a) / (b - a));

export type CamKey = {f: number; pos: V3; target: V3; fov: number; roll?: number};
export type CamState = {pos: V3; target: V3; fov: number; roll: number};

/** Eased interpolation through camera keyframes (each segment ease-in-out). */
export const camAt = (f: number, keys: CamKey[], ease = easeInOut): CamState => {
	if (f <= keys[0].f) {
		const k = keys[0];
		return {pos: k.pos, target: k.target, fov: k.fov, roll: k.roll ?? 0};
	}
	for (let i = 0; i < keys.length - 1; i++) {
		const a = keys[i];
		const b = keys[i + 1];
		if (f <= b.f) {
			const t = ease(seg(f, a.f, b.f));
			return {
				pos: lerp3(a.pos, b.pos, t),
				target: lerp3(a.target, b.target, t),
				fov: lerp(a.fov, b.fov, t),
				roll: lerp(a.roll ?? 0, b.roll ?? 0, t),
			};
		}
	}
	const k = keys[keys.length - 1];
	return {pos: k.pos, target: k.target, fov: k.fov, roll: k.roll ?? 0};
};

/** Smooth deterministic pseudo-noise in [-1, 1]. */
export const wobble = (f: number, seed: number) =>
	(Math.sin(f * 0.37 + seed * 1.7) * 0.5 +
		Math.sin(f * 0.71 + seed * 3.1) * 0.3 +
		Math.sin(f * 1.33 + seed * 5.3) * 0.2);

export const addShake = (c: CamState, f: number, amp: number): CamState => ({
	...c,
	pos: [
		c.pos[0] + wobble(f * 2.2, 1) * amp,
		c.pos[1] + wobble(f * 2.2, 2) * amp,
		c.pos[2] + wobble(f * 2.2, 3) * amp,
	],
	roll: c.roll + wobble(f * 2.2, 4) * amp * 0.15,
});

export const mulberry32 = (seed: number) => {
	let a = seed;
	return () => {
		a |= 0;
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
};

/** Lantern flicker multiplier around 1. */
export const flicker = (f: number, seed: number) =>
	1 + 0.08 * Math.sin(f * 0.9 + seed) + 0.05 * Math.sin(f * 2.3 + seed * 2.1);
