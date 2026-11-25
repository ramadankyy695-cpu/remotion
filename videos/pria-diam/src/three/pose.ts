// Joint angles (radians) for the procedural character rig.
// Conventions (character faces +Z):
//  spineX/neckX/headX > 0  -> lean / nod forward
//  shX < 0                 -> arm swings forward
//  lShZ > 0 / rShZ < 0     -> arm lifts sideways (outward)
//  el < 0                  -> elbow flexes (forearm comes forward/up)
//  hipX < 0                -> thigh swings forward
//  knee > 0                -> knee bends
export type Pose = {
	x: number;
	y: number; // vertical offset of hips relative to standing height
	z: number;
	rotY: number;
	spineX: number;
	spineY: number;
	spineZ: number;
	neckX: number;
	headX: number;
	headY: number;
	headZ: number;
	lShX: number;
	lShY: number;
	lShZ: number;
	lEl: number;
	lWr: number;
	rShX: number;
	rShY: number;
	rShZ: number;
	rEl: number;
	rWr: number;
	lHipX: number;
	lHipZ: number;
	lKnee: number;
	lAnk: number;
	rHipX: number;
	rHipZ: number;
	rKnee: number;
	rAnk: number;
};

export type Face = {
	smile: number; // -1 sad .. 1 smile
	brow: number; // 0 neutral .. 1 worried/sad
	blink: number; // 0 open .. 1 closed
	mouthOpen: number; // 0..1
	lookX: number; // -1..1
	lookY: number; // -1..1
};

export const STAND: Pose = {
	x: 0,
	y: 0,
	z: 0,
	rotY: 0,
	spineX: 0.02,
	spineY: 0,
	spineZ: 0,
	neckX: 0,
	headX: 0,
	headY: 0,
	headZ: 0,
	lShX: 0.05,
	lShY: 0,
	lShZ: 0.12,
	lEl: -0.15,
	lWr: 0,
	rShX: 0.05,
	rShY: 0,
	rShZ: -0.12,
	rEl: -0.15,
	rWr: 0,
	lHipX: 0,
	lHipZ: 0.03,
	lKnee: 0.02,
	lAnk: 0,
	rHipX: 0,
	rHipZ: -0.03,
	rKnee: 0.02,
	rAnk: 0,
};

export const NEUTRAL_FACE: Face = {
	smile: 0,
	brow: 0,
	blink: 0,
	mouthOpen: 0,
	lookX: 0,
	lookY: 0,
};

// Hips height when standing is 0.95. Sitting on a 0.48 high seat.
export const SIT: Pose = {
	...STAND,
	y: -0.45,
	spineX: 0.08,
	lShX: -0.25,
	lShZ: 0.1,
	lEl: -0.9,
	rShX: -0.25,
	rShZ: -0.1,
	rEl: -0.9,
	lHipX: -1.5,
	lHipZ: 0.08,
	lKnee: 1.45,
	lAnk: 0.05,
	rHipX: -1.5,
	rHipZ: -0.08,
	rKnee: 1.45,
	rAnk: 0.05,
};

// Sitting, slouched forward, elbows on knees, head down.
export const SIT_SLUMP: Pose = {
	...SIT,
	spineX: 0.55,
	neckX: 0.25,
	headX: 0.35,
	lShX: -0.75,
	lShZ: 0.05,
	lEl: -1.35,
	rShX: -0.75,
	rShZ: -0.05,
	rEl: -1.35,
	lHipZ: 0.14,
	rHipZ: -0.14,
};

export const mixPose = (a: Pose, b: Pose, t: number): Pose => {
	const out = {} as Pose;
	for (const k of Object.keys(a) as (keyof Pose)[]) {
		out[k] = a[k] + (b[k] - a[k]) * t;
	}
	return out;
};

export const mixFace = (a: Face, b: Face, t: number): Face => {
	const out = {} as Face;
	for (const k of Object.keys(a) as (keyof Face)[]) {
		out[k] = a[k] + (b[k] - a[k]) * t;
	}
	return out;
};

// Natural walk cycle. phase in radians, stride 0..1.
export const walkPose = (phase: number, stride = 1, base: Pose = STAND): Pose => {
	const s = Math.sin(phase);
	const c = Math.cos(phase);
	const kneeL = Math.max(0, Math.sin(phase + Math.PI * 0.55)) * 0.95;
	const kneeR = Math.max(0, Math.sin(phase + Math.PI * 1.55)) * 0.95;
	return {
		...base,
		y: base.y - 0.025 * stride + 0.02 * stride * Math.cos(phase * 2),
		spineX: base.spineX + 0.05 * stride,
		spineY: base.spineY + 0.06 * s * stride,
		spineZ: base.spineZ + 0.02 * c * stride,
		headY: base.headY - 0.04 * s * stride,
		lHipX: -0.42 * s * stride,
		rHipX: 0.42 * s * stride,
		lKnee: 0.08 + kneeL * stride,
		rKnee: 0.08 + kneeR * stride,
		lAnk: -0.15 * s * stride,
		rAnk: 0.15 * s * stride,
		lShX: 0.32 * s * stride + 0.05,
		rShX: -0.32 * s * stride + 0.05,
		lEl: -0.25 - 0.15 * Math.max(0, -s) * stride,
		rEl: -0.25 - 0.15 * Math.max(0, s) * stride,
	};
};

// Small deterministic breathing / idle motion.
export const breathe = (p: Pose, t: number, amount = 1): Pose => {
	const b = Math.sin(t * 1.6) * amount;
	return {
		...p,
		spineX: p.spineX + 0.012 * b,
		neckX: p.neckX - 0.006 * b,
		lShZ: p.lShZ + 0.01 * b,
		rShZ: p.rShZ - 0.01 * b,
		headY: p.headY + 0.015 * Math.sin(t * 0.37) * amount,
	};
};

// Deterministic blink: returns 0..1
export const blinkAt = (t: number, seed = 0) => {
	const period = 3.1 + (seed % 3) * 0.7;
	const local = (t + seed * 1.37) % period;
	const d = Math.abs(local - period + 0.12);
	return d < 0.09 ? 1 - d / 0.09 : 0;
};
