import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Stage} from '../three/Stage';
import {Character} from '../three/Character';
import {RoomSet} from '../three/RoomSet';
import {Laptop, Mug} from '../three/props';
import {mat, rbox, box} from '../three/geo';
import {blinkAt, floorSitPose, Pose, withPose} from '../three/pose';
import {eyesWorld} from '../three/kinematics';
import {camLerp, dist, handheld, mixV, prog, rootToWorld} from './util';

type V = [number, number, number];

// He sits on the floor leaning against the side of the bed, facing -x. A low folding table holds the laptop.
export const FLOOR_ROOT = {position: [0.42, 0, -0.45] as V, rotationY: -Math.PI / 2, scale: 1};
export const LOW_TABLE: V = [-0.22, 0, -0.45];
export const FLOOR_LAPTOP: V = [-0.12, 0.3, -0.45];

export const LowTable: React.FC = () => (
	<group position={LOW_TABLE}>
		<mesh geometry={rbox(0.5, 0.025, 0.7, 0.008)} material={mat('#8b6447', {rough: 0.55})} position={[0, 0.29, 0]} castShadow receiveShadow />
		{[-0.2, 0.2].map((x) => (
			<mesh key={x} geometry={box(0.03, 0.28, 0.6)} material={mat('#6b4a32', {rough: 0.6})} position={[x, 0.14, 0]} castShadow />
		))}
	</group>
);

export const floorPose = (f: number, o: Partial<Omit<Pose, 'face'>> & {face?: Partial<Pose['face']>} = {}) =>
	withPose(floorSitPose(), {
		spine: [0.22, 0, 0],
		chest: [0.12, 0, 0],
		neck: [0.18, 0, 0],
		head: [0.12, 0, 0],
		lWrist: [0.15, 0, 0],
		rWrist: [0.15, 0, 0],
		lFingers: 0.45,
		rFingers: 0.45,
		...o,
		face: {blink: blinkAt(f, 4), lid: 0.5, sad: 0.5, lookY: -0.45, ...(o.face ?? {})},
	});

const typingTargets = (f: number, amt: number) => {
	const k = FLOOR_LAPTOP;
	const t1 = Math.max(0, Math.sin(f * 1.9)) * 0.02 * amt;
	const t2 = Math.max(0, Math.sin(f * 2.2 + 1.1)) * 0.02 * amt;
	// laptop faces +x (towards him)
	return {
		l: [k[0] + 0.15, k[1] + 0.04 + t1, k[2] + 0.09] as V,
		r: [k[0] + 0.15, k[1] + 0.04 + t2, k[2] - 0.09] as V,
	};
};

const Scene6Base: React.FC<{f: number; children: React.ReactNode; cam: ReturnType<typeof camLerp>; focus: number; range: number; laptopOpen?: number; glow?: number; exposure?: number}> = ({
	f,
	children,
	cam,
	focus,
	range,
	laptopOpen = 1,
	glow = 1,
	exposure = 1.25,
}) => (
	<Stage cam={cam} bg="#0a0d14" exposure={exposure} focus={focus} focusRange={range} bokeh={4}>
		<RoomSet frame={f} time="night" clockSeconds={1 * 3600 + 12 * 60 + f / 30} laptopOnDesk={false} lamp={0.25} mess={1} />
		<LowTable />
		<Laptop position={FLOOR_LAPTOP} rotationY={Math.PI / 2} open={laptopOpen} glow={glow} screen="chart" />
		<Mug position={[-0.2, 0.3, -0.72]} />
		{laptopOpen > 0.25 ? <pointLight position={[FLOOR_LAPTOP[0] + 0.12, 0.55, FLOOR_LAPTOP[2]]} intensity={glow * 0.45 * Math.min(1, laptopOpen * 1.5)} distance={1.6} decay={2} color="#a9c6ff" /> : null}
		{children}
	</Stage>
);

// 6a — "Lo bekerja": close-up on hands typing.
export const Scene6a: React.FC = () => {
	const f = useCurrentFrame();
	const pose = floorPose(f);
	const h = typingTargets(f, 1);
	const kb = FLOOR_LAPTOP;
	const cam = handheld(camLerp({pos: [kb[0] + 0.2, 0.62, kb[2] + 0.62], target: [kb[0] + 0.08, 0.34, kb[2]], fov: 34}, {pos: [kb[0] + 0.18, 0.58, kb[2] + 0.52], target: [kb[0] + 0.08, 0.34, kb[2]], fov: 32}, prog(f, 0, 45)), f, 0.5);
	return (
		<Scene6Base f={f} cam={cam} focus={dist(cam.pos, [kb[0] + 0.12, 0.33, kb[2]])} range={0.12}>
			<Character pose={pose} position={FLOOR_ROOT.position} rotationY={FLOOR_ROOT.rotationY} lTarget={h.l} rTarget={h.r} lPalm={[0, -1, 0]} rPalm={[0, -1, 0]} />
		</Scene6Base>
	);
};

// 6b — "lo lelah": rubs his eyes, head heavy.
export const Scene6b: React.FC = () => {
	const f = useCurrentFrame();
	const rub = prog(f, 3, 14) - prog(f, 30, 38);
	const pose = floorPose(f + 45, {neck: [0.25, 0, 0], head: [0.2 + rub * 0.12, -0.1, 0.05], face: {blink: rub > 0.5 ? 1 : blinkAt(f, 6), lid: 0.7, sad: 0.7, mouth: 0.1}});
	const eyes = eyesWorld(pose, FLOOR_ROOT);
	const h = typingTargets(f, 0);
	const rubT: V = [eyes[0] - 0.07, eyes[1] - 0.11 + Math.sin(f * 0.9) * 0.008, eyes[2] - 0.02];
	const rT = mixV(h.r, rubT, rub);
	const cam = handheld({pos: [eyes[0] - 0.6, eyes[1] - 0.02, eyes[2] + 0.38], target: [eyes[0], eyes[1] - 0.08, eyes[2]], fov: 32}, f, 0.6);
	return (
		<Scene6Base f={f} cam={cam} focus={dist(cam.pos, eyes)} range={0.25}>
			<Character pose={pose} position={FLOOR_ROOT.position} rotationY={FLOOR_ROOT.rotationY} lTarget={h.l} rTarget={rT} lPalm={[0, -1, 0]} rPalm={[1, 0.3, 0]} rPole={[eyes[0] - 0.2, eyes[1] - 0.9, eyes[2] - 0.35]} />
		</Scene6Base>
	);
};

// 6c — "lo mencoba lagi": over-the-shoulder, typing again with determination.
export const Scene6c: React.FC = () => {
	const f = useCurrentFrame();
	const pose = floorPose(f + 90, {spine: [0.3, 0, 0], face: {lid: 0.35, frown: 0.5, sad: 0.3}});
	const h = typingTargets(f, 1.2);
	const cam = handheld(camLerp({pos: [0.75, 1.02, -0.12], target: [-0.12, 0.42, -0.5], fov: 36}, {pos: [0.7, 0.98, -0.2], target: [-0.12, 0.42, -0.48], fov: 33}, prog(f, 0, 50)), f, 0.6);
	return (
		<Scene6Base f={f} cam={cam} focus={dist(cam.pos, [-0.1, 0.42, -0.45])} range={0.35}>
			<Character pose={pose} position={FLOOR_ROOT.position} rotationY={FLOOR_ROOT.rotationY} lTarget={h.l} rTarget={h.r} lPalm={[0, -1, 0]} rPalm={[0, -1, 0]} />
		</Scene6Base>
	);
};

// 6d — wide: alone on the floor in the dark room, staring at the screen; a quiet sigh. Slow push-in.
export const Scene6d: React.FC = () => {
	const f = useCurrentFrame();
	const sigh = Math.sin(Math.PI * prog(f, 40, 85, (t) => t));
	const pose = floorPose(f + 140, {
		chest: [0.12 - sigh * 0.08, 0, 0],
		head: [0.12 + sigh * 0.1, 0, 0],
		lClav: sigh * 0.7,
		rClav: sigh * 0.7,
		breath: sigh,
		face: {lid: 0.45 + sigh * 0.3, sad: 0.6 + sigh * 0.2, mouth: sigh * 0.3},
	});
	const h = typingTargets(f, 0);
	const restL: V = rootToWorld(FLOOR_ROOT, [0.16, 0.42, 0.42]);
	const lT = mixV(h.l, restL, prog(f, 20, 45));
	const eyes = eyesWorld(pose, FLOOR_ROOT);
	const cam = handheld(camLerp({pos: [-1.35, 0.85, 0.95], target: [0.25, 0.55, -0.5], fov: 40}, {pos: [-0.95, 0.75, 0.55], target: [0.28, 0.6, -0.5], fov: 36}, prog(f, 0, 99)), f, 0.7);
	return (
		<Scene6Base f={f} cam={cam} focus={dist(cam.pos, eyes)} range={0.9}>
			<Character pose={pose} position={FLOOR_ROOT.position} rotationY={FLOOR_ROOT.rotationY} lTarget={lT} rTarget={h.r} lPalm={[0, -1, 0]} rPalm={[0, -1, 0]} />
		</Scene6Base>
	);
};

// 6e — his hand slowly closes the laptop; the screen light leaves his face. Camera rises to his face in moonlight.
export const Scene6e: React.FC = () => {
	const f = useCurrentFrame();
	const close = prog(f, 8, 62);
	const open = 1 - close;
	const pose = floorPose(f + 240, {spine: [0.26 - close * 0.12, 0, 0], neck: [0.2, 0, 0], head: [0.12 + close * 0.1, 0, 0.03], face: {lid: 0.55, sad: 0.75, lookY: -0.4 - close * 0.2}});
	const k = FLOOR_LAPTOP;
	// top edge of the lid (lid hinge at k.x - 0.113 when facing +x)
	const ang = -Math.PI / 2 + open * (Math.PI / 2 + 0.3);
	const lidTop: V = [k[0] - 0.113 + Math.cos(-ang) * 0.0 + Math.sin(open * (Math.PI / 2 + 0.3)) * 0.23 * 0 + 0.23 * Math.cos(open * (Math.PI / 2 + 0.3) - 0.3 - 0.0001) * 0, k[1], k[2]];
	// simple geometric lid tip: rotate around hinge
	const theta = Math.PI / 2 - open * (Math.PI / 2 + 0.3); // 0 = vertical-ish
	lidTop[0] = k[0] - 0.113 + Math.sin(theta) * 0.225;
	lidTop[1] = k[1] + 0.016 + Math.cos(theta) * 0.225;
	void ang;
	const reach = prog(f, 0, 10);
	const h = typingTargets(f, 0);
	const rT = mixV(h.r, [lidTop[0] + 0.07, lidTop[1] + 0.03, lidTop[2] - 0.03], reach * (1 - prog(f, 70, 92)));
	const glow = open;
	const eyes = eyesWorld(pose, FLOOR_ROOT);
	const cam = handheld(camLerp({pos: [k[0] - 0.4, 0.62, k[2] - 0.45], target: [k[0], 0.38, k[2]], fov: 36}, {pos: [eyes[0] - 0.75, eyes[1] + 0.02, eyes[2] - 0.35], target: [eyes[0], eyes[1] - 0.06, eyes[2]], fov: 32}, prog(f, 50, 97)), f, 0.6);
	const focus = dist(cam.pos, k) + (dist(cam.pos, eyes) - dist(cam.pos, k)) * prog(f, 55, 85);
	return (
		<Scene6Base f={f} cam={cam} focus={focus} range={0.25} laptopOpen={open} glow={glow} exposure={1.3}>
			<Character pose={pose} position={FLOOR_ROOT.position} rotationY={FLOOR_ROOT.rotationY} lTarget={h.l} rTarget={rT} lPalm={[0, -1, 0]} rPalm={[0, -1, 0]} />
			<pointLight position={[eyes[0] - 0.4, eyes[1] + 0.6, eyes[2] - 0.8]} intensity={0.25 * close} distance={2.5} decay={2} color="#8fa8de" />
		</Scene6Base>
	);
};
