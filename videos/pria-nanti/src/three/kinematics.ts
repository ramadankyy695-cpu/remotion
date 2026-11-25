import * as THREE from 'three';
import {Pose} from './pose';

type V3 = [number, number, number];

const e = new THREE.Euler();
const m = new THREE.Matrix4();
const q = new THREE.Quaternion();

const node = (parent: THREE.Matrix4, pos: V3, rot: V3, scale = 1) => {
	e.set(rot[0], rot[1], rot[2]);
	q.setFromEuler(e);
	m.compose(new THREE.Vector3(...pos), q, new THREE.Vector3(scale, scale, scale));
	return parent.clone().multiply(m);
};

export type Root = {position: V3; rotationY: number; scale: number};

export const chestMatrix = (pose: Pose, root: Root) => {
	const r = node(new THREE.Matrix4(), root.position, [0, root.rotationY, 0], root.scale);
	const hips = node(r, [0, 0.98 + pose.hipsY, pose.hipsZ], pose.hips);
	const spine = node(hips, [0, 0.09, 0], pose.spine);
	return node(spine, [0, 0.22, 0], pose.chest);
};

export const headMatrix = (pose: Pose, root: Root) => {
	const chest = chestMatrix(pose, root);
	const neck = node(chest, [0, 0.17, 0.005], pose.neck);
	return node(neck, [0, 0.072, 0.012], pose.head);
};

// World position of the point between the eyes.
export const eyesWorld = (pose: Pose, root: Root): V3 => {
	const v = new THREE.Vector3(0, 0.122, 0.07).applyMatrix4(headMatrix(pose, root));
	return [v.x, v.y, v.z];
};

export const localToWorld = (pose: Pose, root: Root, which: 'head' | 'chest', p: V3): V3 => {
	const mm = which === 'head' ? headMatrix(pose, root) : chestMatrix(pose, root);
	const v = new THREE.Vector3(...p).applyMatrix4(mm);
	return [v.x, v.y, v.z];
};

export type ArmIK = {quat: THREE.Quaternion; elbow: number; twist: number};

// Two-bone IK. target is the world-space wrist position. pole is a world-space hint for the elbow direction.
export const solveArm = (pose: Pose, root: Root, side: 1 | -1, build: number, target: V3, pole: V3, palm?: V3 | null): ArmIK => {
	const chest = chestMatrix(pose, root);
	const clav = side === 1 ? pose.lClav : pose.rClav;
	const shoulderLocal = new THREE.Vector3(side * 0.185 * build, 0.115 + clav * 0.04, -0.005);
	const inv = chest.clone().invert();
	// Work in chest space (account for root scale through the matrix)
	const T = new THREE.Vector3(...target).applyMatrix4(inv);
	const Pw = new THREE.Vector3(...pole).applyMatrix4(inv);
	const S = shoulderLocal;
	const a = 0.28;
	const b = 0.255;
	const toT = T.clone().sub(S);
	let d = toT.length();
	d = Math.min(a + b - 0.002, Math.max(Math.abs(a - b) + 0.01, d));
	const dir = toT.normalize();
	const cosA = (a * a + d * d - b * b) / (2 * a * d);
	const A = Math.acos(Math.min(1, Math.max(-1, cosA)));
	const pv = Pw.clone().sub(S);
	const pp = pv.sub(dir.clone().multiplyScalar(pv.dot(dir)));
	if (pp.lengthSq() < 1e-8) pp.set(0, -1, 0);
	pp.normalize();
	const u = dir.clone().multiplyScalar(Math.cos(A)).add(pp.clone().multiplyScalar(Math.sin(A))).normalize();
	const E = S.clone().add(u.clone().multiplyScalar(a));
	const Tc = S.clone().add(dir.clone().multiplyScalar(d));
	const v = Tc.clone().sub(E).normalize();
	const bend = Math.acos(Math.min(1, Math.max(-1, u.dot(v))));
	// Basis: local -Y -> u, local +Z -> forearm bend direction
	const y = u.clone().multiplyScalar(-1);
	let z = v.clone().sub(u.clone().multiplyScalar(v.dot(u)));
	if (z.lengthSq() < 1e-8) z = new THREE.Vector3(0, 0, 1).sub(y.clone().multiplyScalar(y.z));
	z.normalize();
	const x = new THREE.Vector3().crossVectors(y, z).normalize();
	const basis = new THREE.Matrix4().makeBasis(x, y, z);
	const quat = new THREE.Quaternion().setFromRotationMatrix(basis);
	let twist = 0;
	if (palm) {
		// palm direction in chest space
		const cq = new THREE.Quaternion();
		chest.decompose(new THREE.Vector3(), cq, new THREE.Vector3());
		const pd = new THREE.Vector3(...palm).applyQuaternion(cq.clone().invert()).normalize();
		// forearm frame = upper basis rotated about local X by -bend
		const fq = quat.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -bend));
		const xf = new THREE.Vector3(1, 0, 0).applyQuaternion(fq);
		const zf = new THREE.Vector3(0, 0, 1).applyQuaternion(fq);
		twist = Math.atan2(pd.dot(xf), pd.dot(zf));
	}
	return {quat, elbow: -bend, twist};
};
