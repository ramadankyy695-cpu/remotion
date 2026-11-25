import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Stage} from '../three/Stage';
import {Character} from '../three/Character';
import {CityStreet, Pedestrians, Ped, StreetClock} from '../three/Outdoor';
import {BackpackWorn, Phone} from '../three/props';
import {blinkAt, withPose} from '../three/pose';
import {eyesWorld} from '../three/kinematics';
import {dist, handheld, mixV, prog, rootToWorld, strapHands, walking} from './util';

type V = [number, number, number];

// approximate hanging right-hand position used as the start of the phone lift
const walkHand = (pose: {hipsY: number}, root: {position: V; rotationY: number}): V => rootToWorld(root, [-0.2, 0.75 + pose.hipsY, 0.05]);

const peds = (seed: number): Ped[] =>
	new Array(9).fill(0).map((_, i) => ({
		x0: -6 + ((i * 7 + seed * 3) % 26),
		z: i % 3 === 0 ? -3.05 : i % 3 === 1 ? -5.1 : -4.6,
		dir: (i + seed) % 2 ? 1 : -1,
		speed: 1.1 + ((i * 13) % 5) * 0.08,
		idx: i + seed,
	}));

// 3a — side tracking along the sidewalk; the crowd moves in fast-forward while he keeps his pace. Noon -> afternoon.
export const Scene3a: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / 30;
	const d = 1.05 * t;
	const x = 0 + d;
	const pose = withPose(walking(d, 0.34, 0.25), {});
	const look = prog(f, 18, 34) - prog(f, 92, 108);
	pose.head = [pose.head[0] + 0.05 + look * 0.35, pose.head[1], pose.head[2]];
	pose.face = {...pose.face, blink: blinkAt(f, 4), lid: 0.3, sad: 0.45, lookY: -0.2 - look * 0.6};
	const root = {position: [x, 0.15, -4.0] as V, rotationY: Math.PI / 2, scale: 1};
	// phone in front of the chest, showing the time racing forward
	const phoneT = rootToWorld(root, [-0.06, 1.1 + pose.hipsY, 0.3]);
	const minutes = 12 * 60 + 5 + Math.floor(f * 1.6);
	const clock = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
	const sh = strapHands(pose, root);
	const eyes = eyesWorld(pose, root);
	const sun = mixV([2, 10, 3], [-5, 6, 4], prog(f, 0, 115, (k) => k));
	const cam = handheld({pos: [x + 0.4, 1.35, -0.9], target: [x + 0.25, 1.2, -4.2], fov: 38}, f, 1.0);
	return (
		<Stage cam={cam} bg="#a9c9ec" exposure={1.0} focus={dist(cam.pos, eyes)} focusRange={1.0} bokeh={3.5}>
			<CityStreet frame={f} light="noon" light2="afternoon" lightT={prog(f, 0, 115, (k) => k)} sunDir={sun as V} x0={-14} x1={30} shadowCenter={[x, 0, -4]} timeScale={2.5} />
			<StreetClock position={[6.5, 0.15, -2.95]} seconds={12 * 3600 + f * 90} />
			<Pedestrians frame={f} peds={peds(1)} timeScale={2.6} />
			<Character pose={pose} position={root.position} rotationY={root.rotationY} back={<BackpackWorn />} lTarget={sh.l} lPalm={sh.palm} rTarget={look > 0.02 ? mixV(walkHand(pose, root), phoneT, look) : null} rPalm={[-0.6, 0.8, 0.2]} rightHand={look > 0.02 ? <Phone time={clock} /> : null} />
		</Stage>
	);
};

// 3b — low front tracking into golden hour; light keeps sliding, people rush by.
export const Scene3b: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / 30;
	const d = 1.0 * t;
	const x = 18 + d;
	const pose = withPose(walking(d, 0.33, 0.2, 1.3), {});
	pose.head = [pose.head[0] + 0.1, pose.head[1], pose.head[2]];
	pose.face = {...pose.face, blink: blinkAt(f, 6), lid: 0.4, sad: 0.55, lookY: -0.35};
	const root = {position: [x, 0.15, -4.0] as V, rotationY: Math.PI / 2, scale: 1};
	const eyes = eyesWorld(pose, root);
	const sun = mixV([-7, 4, 3], [-10, 1.8, 2], prog(f, 0, 102, (k) => k));
	const cam = handheld({pos: [x + 2.3 - prog(f, 0, 102) * 0.5, 0.95, -3.7], target: [x, 1.4, -4.05], fov: 36}, f, 1.1);
	return (
		<Stage cam={cam} bg="#e7a77a" exposure={1.05} focus={dist(cam.pos, eyes)} focusRange={0.9} bokeh={4}>
			<CityStreet frame={f + 300} light="afternoon" light2="golden" lightT={prog(f, 0, 102, (k) => k)} sunDir={sun as V} x0={4} x1={50} shadowCenter={[x, 0, -4]} timeScale={2.5} />
			<Pedestrians frame={f + 200} peds={peds(4).map((p) => ({...p, x0: p.x0 + 16}))} timeScale={2.8} />
			<Character pose={pose} position={root.position} rotationY={root.rotationY} back={<BackpackWorn />} lTarget={strapHands(pose, root).l} lPalm={strapHands(pose, root).palm} />
		</Stage>
	);
};
