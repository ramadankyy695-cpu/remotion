// Pose system for the procedural character rig.
// Conventions: character faces +Z, up is +Y, character's left is +X.
// Limbs hang down (-Y). Rotation x < 0 swings a limb forward.
// For upward chains (spine/neck/head) rotation x > 0 leans forward / nods down.

export type V3 = [number, number, number];

export type Face = {
	blink: number; // 0 open .. 1 closed
	lid: number; // tired droop 0..1
	sad: number; // inner brows up
	frown: number; // brows down / focused
	mouth: number; // open 0..1
	smile: number; // -1 (down) .. 1 (smile)
	lookX: number; // -1..1 (character's left is +)
	lookY: number; // -1..1 (up is +)
};

export type Pose = {
	hipsY: number; // vertical offset of hips
	hipsZ: number; // forward offset of hips
	hips: V3;
	spine: V3;
	chest: V3;
	neck: V3;
	head: V3;
	breath: number; // 0..1 chest expansion
	lShoulder: V3;
	rShoulder: V3;
	lClav: number; // shoulder shrug
	rClav: number;
	lElbow: number;
	rElbow: number;
	lWrist: V3;
	rWrist: V3;
	lFingers: number; // curl 0..1
	rFingers: number;
	lHip: V3;
	rHip: V3;
	lKnee: number;
	rKnee: number;
	lAnkle: number;
	rAnkle: number;
	face: Face;
};

export const neutralFace: Face = {blink: 0, lid: 0.15, sad: 0.2, frown: 0, mouth: 0, smile: 0, lookX: 0, lookY: 0};

export const standPose = (): Pose => ({
	hipsY: 0,
	hipsZ: 0,
	hips: [0, 0, 0],
	spine: [0.02, 0, 0],
	chest: [0.03, 0, 0],
	neck: [0.04, 0, 0],
	head: [0.02, 0, 0],
	breath: 0,
	lShoulder: [0.05, 0, 0.09],
	rShoulder: [0.05, 0, -0.09],
	lClav: 0,
	rClav: 0,
	lElbow: -0.2,
	rElbow: -0.2,
	lWrist: [0, -1.4, 0],
	rWrist: [0, 1.4, 0],
	lFingers: 0.35,
	rFingers: 0.35,
	lHip: [0, 0, 0.02],
	rHip: [0, 0, -0.02],
	lKnee: 0.04,
	rKnee: 0.04,
	lAnkle: -0.04,
	rAnkle: -0.04,
	face: {...neutralFace},
});

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerp3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

export const mixPose = (a: Pose, b: Pose, t: number): Pose => {
	if (t <= 0) return a;
	if (t >= 1) return b;
	const out: Record<string, unknown> = {};
	for (const k of Object.keys(a) as (keyof Pose)[]) {
		const va = a[k];
		const vb = b[k];
		if (typeof va === 'number') {
			out[k] = lerp(va, vb as number, t);
		} else if (Array.isArray(va)) {
			out[k] = lerp3(va as V3, vb as V3, t);
		} else {
			const fa = va as Face;
			const fb = vb as Face;
			const f: Record<string, number> = {};
			for (const fk of Object.keys(fa) as (keyof Face)[]) {
				f[fk] = lerp(fa[fk], fb[fk], t);
			}
			out[k] = f;
		}
	}
	return out as Pose;
};

// Apply a partial override on top of a pose.
export const withPose = (p: Pose, o: Partial<Omit<Pose, 'face'>> & {face?: Partial<Face>}): Pose => ({
	...p,
	...o,
	face: {...p.face, ...(o.face ?? {})},
});

export const add3 = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

export const smooth = (t: number) => {
	const c = Math.min(1, Math.max(0, t));
	return c * c * (3 - 2 * c);
};

// Ramp 0->1 between frames a and b with smoothstep
export const ramp = (f: number, a: number, b: number) => smooth((f - a) / (b - a));

// Natural blinking driven by frame number.
export const blinkAt = (frame: number, seed = 0) => {
	const period = 95 + ((seed * 37) % 40);
	const local = (frame + seed * 13) % period;
	if (local < 2) return local / 2;
	if (local < 4) return 1 - (local - 2) / 2;
	return 0;
};

// Stride length per full cycle (two steps) given hip swing amplitude.
export const LEG_LEN = 0.87;
export const cycleLength = (amp: number) => 4 * LEG_LEN * Math.sin(amp);

// Walk cycle. phase in radians. mood: 0 heavy/sad .. 1 upright/hopeful
export const walkPose = (phase: number, amp = 0.38, mood = 0.3): Pose => {
	const s = Math.sin(phase);
	const c = Math.cos(phase);
	const base = standPose();
	const kneeL = 0.08 + 0.75 * Math.pow(Math.max(0, c), 1.3) + 0.1 * Math.max(0, -s);
	const kneeR = 0.08 + 0.75 * Math.pow(Math.max(0, -c), 1.3) + 0.1 * Math.max(0, s);
	const slump = 1 - mood;
	const lHx = -amp * s - 0.04;
	const rHx = amp * s - 0.04;
	const reach = (hx: number, k: number) => 0.44 * Math.cos(hx) + 0.43 * Math.cos(hx + k);
	const hipsY = Math.max(reach(lHx, kneeL), reach(rHx, kneeR)) - LEG_LEN - slump * 0.01;
	return {
		...base,
		hipsY,
		hips: [0.03, 0.12 * s, 0.035 * c],
		spine: [0.05 + slump * 0.06, -0.05 * s, -0.02 * c],
		chest: [0.04 + slump * 0.07, -0.08 * s, 0],
		neck: [0.04 + slump * 0.1, 0.03 * s, 0],
		head: [0.02 + slump * 0.12, 0.03 * s, 0.015 * c],
		lShoulder: [0.32 * s * (0.7 + mood * 0.5), 0, 0.1],
		rShoulder: [-0.32 * s * (0.7 + mood * 0.5), 0, -0.1],
		lElbow: -0.25 - 0.18 * Math.max(0, -s),
		rElbow: -0.25 - 0.18 * Math.max(0, s),
		lHip: [lHx, 0, 0.02],
		rHip: [rHx, 0, -0.02],
		lKnee: kneeL,
		rKnee: kneeR,
		lAnkle: -(lHx + kneeL) - 0.15 * Math.max(0, s) + 0.3 * Math.max(0, -s) * Math.max(0, c),
		rAnkle: -(rHx + kneeR) - 0.15 * Math.max(0, -s) + 0.3 * Math.max(0, s) * Math.max(0, -c),
		face: {...neutralFace},
	};
};

// Sitting on a chair: hips at chair height, thighs forward.
export const sitPose = (): Pose =>
	withPose(standPose(), {
		hipsY: -0.47,
		hipsZ: 0,
		hips: [0, 0, 0],
		spine: [0.12, 0, 0],
		chest: [0.08, 0, 0],
		neck: [0.06, 0, 0],
		head: [0.05, 0, 0],
		lHip: [-1.5, 0.05, 0.08],
		rHip: [-1.5, -0.05, -0.08],
		lKnee: 1.45,
		rKnee: 1.5,
		lAnkle: 0.05,
		rAnkle: 0.05,
	});

// Arms forward resting on a desk / typing
export const typingArms = (frame: number, intensity = 1): Partial<Pose> => {
	const t1 = Math.sin(frame * 1.9) * 0.05 * intensity;
	const t2 = Math.sin(frame * 2.3 + 1.2) * 0.05 * intensity;
	return {
		lShoulder: [-0.62, -0.05, 0.2],
		rShoulder: [-0.62, 0.05, -0.2],
		lElbow: -0.95 + t1,
		rElbow: -0.95 + t2,
		lWrist: [0.25 + t2, -0.15, 0.25],
		rWrist: [0.25 + t1, 0.15, -0.25],
		lFingers: 0.35 + t1 * 2,
		rFingers: 0.35 + t2 * 2,
	};
};

// Sitting on the floor leaning back against the bed, knees up.
export const floorSitPose = (): Pose =>
	withPose(standPose(), {
		hipsY: -0.86,
		hipsZ: 0.08,
		hips: [-0.25, 0, 0],
		spine: [0.12, 0, 0],
		chest: [0.08, 0, 0],
		neck: [0.15, 0, 0],
		head: [0.1, 0, 0],
		lHip: [-1.05, 0.15, 0.18],
		rHip: [-1.05, -0.15, -0.18],
		lKnee: 1.7,
		rKnee: 1.65,
		lAnkle: 0.25,
		rAnkle: 0.25,
	});
