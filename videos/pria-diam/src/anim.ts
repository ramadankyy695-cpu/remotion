import {Easing, interpolate} from 'remotion';
import type {V3} from './three/Stage';

export const FPS = 30;

const ease = Easing.bezier(0.45, 0, 0.25, 1);

// Eased, clamped interpolation over seconds.
export const tw = (t: number, t0: number, t1: number, a = 0, b = 1, easing = ease) =>
	interpolate(t, [t0, t1], [a, b], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing,
	});

export const lin = (t: number, t0: number, t1: number, a = 0, b = 1) =>
	interpolate(t, [t0, t1], [a, b], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

export const lerp3 = (a: V3, b: V3, k: number): V3 => [
	a[0] + (b[0] - a[0]) * k,
	a[1] + (b[1] - a[1]) * k,
	a[2] + (b[2] - a[2]) * k,
];

// Piecewise camera path over keyframes [time, value]
export const path3 = (t: number, keys: [number, V3][]): V3 => {
	if (t <= keys[0][0]) return keys[0][1];
	for (let i = 0; i < keys.length - 1; i++) {
		const [t0, a] = keys[i];
		const [t1, b] = keys[i + 1];
		if (t <= t1) return lerp3(a, b, tw(t, t0, t1));
	}
	return keys[keys.length - 1][1];
};

export const path1 = (t: number, keys: [number, number][]): number => {
	if (t <= keys[0][0]) return keys[0][1];
	for (let i = 0; i < keys.length - 1; i++) {
		const [t0, a] = keys[i];
		const [t1, b] = keys[i + 1];
		if (t <= t1) return a + (b - a) * tw(t, t0, t1);
	}
	return keys[keys.length - 1][1];
};

export const dist = (a: V3, b: V3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

// Handheld camera micro-shake (deterministic)
export const shake = (t: number, amt = 0.01): V3 => [
	(Math.sin(t * 1.3) + Math.sin(t * 2.9 + 1) * 0.5) * amt,
	(Math.sin(t * 1.7 + 2) + Math.sin(t * 3.7) * 0.4) * amt * 0.7,
	Math.sin(t * 1.1 + 4) * amt * 0.5,
];

export const talk = (t: number, amount = 1) =>
	Math.max(0, (0.5 + 0.5 * Math.sin(t * 21)) * (0.55 + 0.45 * Math.sin(t * 6.3 + 1)) * amount) * 0.55;

export const add3 = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
