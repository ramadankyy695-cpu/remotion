import * as THREE from 'three';
import type {Pose} from './pose';

// Forward kinematics mirroring the transform hierarchy in Character.tsx.
const m = new THREE.Matrix4();
const tmp = new THREE.Matrix4();
const e = new THREE.Euler();
const v = new THREE.Vector3();

const T = (x: number, y: number, z: number) => tmp.makeTranslation(x, y, z);
const R = (x: number, y: number, z: number) => tmp.makeRotationFromEuler(e.set(x, y, z));

export const wristWorld = (p: Pose, side: 1 | -1, scale = 1): THREE.Vector3 => {
	const shX = side === 1 ? p.lShX : p.rShX;
	const shY = side === 1 ? p.lShY : p.rShY;
	const shZ = side === 1 ? p.lShZ : p.rShZ;
	const el = side === 1 ? p.lEl : p.rEl;
	m.identity();
	m.multiply(T(p.x, 0, p.z));
	m.multiply(R(0, p.rotY, 0));
	m.multiply(tmp.makeScale(scale, scale, scale));
	m.multiply(T(0, 0.95 + p.y, 0));
	m.multiply(T(0, 0.02, 0));
	m.multiply(R(p.spineX, p.spineY, p.spineZ));
	m.multiply(T(0.182 * side, 0.462, 0));
	m.multiply(R(shX, shY, shZ));
	m.multiply(T(0, -0.3, 0));
	m.multiply(R(el, 0, 0));
	m.multiply(T(0, -0.27, 0));
	return v.set(0, 0, 0).applyMatrix4(m).clone();
};

// Solves shoulder/elbow angles so the wrist reaches `target` (world space).
// Deterministic coordinate descent starting from the pose's current angles,
// with a weak pull toward that starting pose so the result stays natural.
export const reach = (pose: Pose, side: 1 | -1, target: THREE.Vector3): Pose => {
	const keys = side === 1 ? (['lShX', 'lShY', 'lShZ', 'lEl'] as const) : (['rShX', 'rShY', 'rShZ', 'rEl'] as const);
	const start = keys.map((k) => pose[k]);
	const cur: Pose = {...pose};
	const cost = (p: Pose) => {
		const d = wristWorld(p, side).distanceToSquared(target);
		let reg = 0;
		keys.forEach((k, i) => {
			reg += (p[k] - start[i]) ** 2;
		});
		// keep elbow bending the natural way
		const el = p[keys[3]];
		const bad = el > 0 ? el * el * 10 : 0;
		return d + reg * 0.0004 + bad;
	};
	let step = 0.2;
	let best = cost(cur);
	for (let it = 0; it < 60 && step > 0.0005; it++) {
		let improved = false;
		for (const k of keys) {
			for (const dir of [1, -1]) {
				const trial = {...cur, [k]: cur[k] + dir * step};
				const c = cost(trial);
				if (c < best) {
					best = c;
					cur[k] = trial[k];
					improved = true;
				}
			}
		}
		if (!improved) step *= 0.5;
	}
	return cur;
};
