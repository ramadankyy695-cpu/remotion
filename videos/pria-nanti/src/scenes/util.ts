import {Easing, interpolate} from 'remotion';
import {Cam} from '../three/Stage';

type V = [number, number, number];

export const ease = Easing.bezier(0.45, 0, 0.55, 1);
export const easeOut = Easing.bezier(0.2, 0.7, 0.3, 1);

export const mixV = (a: V, b: V, t: number): V => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

export const prog = (f: number, a: number, b: number, e = ease) => interpolate(f, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: e});

export const camLerp = (a: Cam, b: Cam, t: number): Cam => ({
	pos: mixV(a.pos, b.pos, t),
	target: mixV(a.target, b.target, t),
	fov: a.fov + (b.fov - a.fov) * t,
	roll: (a.roll ?? 0) + ((b.roll ?? 0) - (a.roll ?? 0)) * t,
});

// Subtle handheld drift so locked shots still breathe.
export const handheld = (c: Cam, f: number, amt = 1): Cam => ({
	...c,
	pos: [c.pos[0] + Math.sin(f * 0.031) * 0.006 * amt, c.pos[1] + Math.sin(f * 0.047 + 1) * 0.004 * amt, c.pos[2] + Math.cos(f * 0.027) * 0.005 * amt],
	target: [c.target[0] + Math.sin(f * 0.023 + 2) * 0.004 * amt, c.target[1] + Math.cos(f * 0.039) * 0.003 * amt, c.target[2]],
	roll: (c.roll ?? 0) + Math.sin(f * 0.019) * 0.003 * amt,
});

export const dist = (a: V, b: V) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

import {cycleLength, walkPose, Pose} from '../three/pose';

// Walking helper: distance traveled at `speed` m/s (with ease in/out), returns pose with planted feet.
export const walking = (dist: number, amp = 0.36, mood = 0.3, phase0 = 0): Pose => walkPose(phase0 + (dist / cycleLength(amp)) * Math.PI * 2, amp, mood);

// Frames (local) where a foot contacts the ground for a linear walk starting at frame a.
export const stepFrames = (speed: number, amp: number, fromFrame: number, toFrame: number, phase0 = 0) => {
	const out: number[] = [];
	const cl = cycleLength(amp);
	for (let f = fromFrame; f < toFrame; f++) {
		const p1 = phase0 + ((speed * (f - fromFrame)) / 30 / cl) * Math.PI * 2;
		const p2 = phase0 + ((speed * (f + 1 - fromFrame)) / 30 / cl) * Math.PI * 2;
		// contact at sin = +-1 -> phase = pi/2 + k*pi
		const k1 = Math.floor((p1 - Math.PI / 2) / Math.PI);
		const k2 = Math.floor((p2 - Math.PI / 2) / Math.PI);
		if (k2 > k1) out.push(f);
	}
	return out;
};

type RootT = {position: [number, number, number]; rotationY: number};
// Convert a point in character-root space into world space.
export const rootToWorld = (root: RootT, p: [number, number, number]): [number, number, number] => {
	const c = Math.cos(root.rotationY);
	const s = Math.sin(root.rotationY);
	return [root.position[0] + p[0] * c + p[2] * s, root.position[1] + p[1], root.position[2] - p[0] * s + p[2] * c];
};

// Wrist targets for hands tucked in the hoodie pocket.
export const pocketHands = (root: RootT, hipsY: number) => ({
	l: rootToWorld(root, [0.075, 0.95 + hipsY, 0.135]),
	r: rootToWorld(root, [-0.075, 0.95 + hipsY, 0.135]),
});

import {localToWorld} from '../three/kinematics';
import type {Pose as PoseT} from '../three/pose';

// Wrist targets for gripping the backpack straps at chest height.
export const strapHands = (pose: PoseT, root: {position: [number, number, number]; rotationY: number; scale?: number}, drop = 0) => {
	const r = {position: root.position, rotationY: root.rotationY, scale: root.scale ?? 1};
	const fwd: [number, number, number] = [-Math.sin(root.rotationY), 0, -Math.cos(root.rotationY)];
	return {
		l: localToWorld(pose, r, 'chest', [0.13, -0.08 - drop, 0.17]),
		r: localToWorld(pose, r, 'chest', [-0.13, -0.08 - drop, 0.17]),
		palm: fwd,
	};
};
