import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Stage} from '../three/Stage';
import {Character} from '../three/Character';
import {Neighborhood, Pedestrians} from '../three/Outdoor';
import {BackpackWorn, Glow} from '../three/props';
import {blinkAt} from '../three/pose';
import {eyesWorld} from '../three/kinematics';
import {camLerp, dist, mixV, prog, walking, handheld, strapHands} from './util';

type V = [number, number, number];

// SCENE 9 — morning. He walks towards the rising sun. Camera follows from behind, then drifts to the side.
export const Scene9: React.FC = () => {
	const f = useCurrentFrame();
	const d = 1.12 * (f / 30);
	const x = 0 + d;
	const pose = walking(d, 0.37, 0.95, 0.2);
	pose.head = [pose.head[0] - 0.04, pose.head[1], pose.head[2]];
	pose.face = {...pose.face, blink: blinkAt(f, 6), lid: 0.12, sad: 0.05, smile: 0.25 * prog(f, 80, 130), lookY: 0.1};
	const root = {position: [x, 0.15, -3.5] as V, rotationY: Math.PI / 2, scale: 1};
	const eyes = eyesWorld(pose, root);
	const side = prog(f, 70, 200);
	const behind = {pos: [x - 3.2, 1.55, -3.35] as V, target: [x + 4, 1.3, -3.5] as V, fov: 42};
	const sideCam = {pos: [x - 3.0, 1.5, -2.2] as V, target: [x + 3.0, 1.4, -3.9] as V, fov: 42};
	const cam = handheld(camLerp(behind, sideCam, side), f, 0.8);
	const sunPos: V = [x + 120, 7, -9];
	return (
		<Stage cam={cam} bg="#ffe2b4" exposure={1.05} focus={dist(cam.pos, eyes)} focusRange={2.0} bokeh={3} bloom={0.9}>
			<Neighborhood frame={f} light="morning" x0={-12} x1={45} sunDir={[12, 2.2, -0.6]} shadowCenter={[x + 3, 0, -3]} />
			<Glow position={sunPos} scale={60} color="#ffd59a" opacity={0.95} />
			<Glow position={sunPos} scale={18} color="#fff1d0" opacity={1} />
			<Glow position={mixV(sunPos, cam.pos, 0.5)} scale={3} color="#ffd59a" opacity={0.08} />
			<Pedestrians frame={f} peds={[{x0: 18, z: 3.4, dir: -1, speed: 1.0, idx: 2}, {x0: 26, z: -3.4, dir: -1, speed: 1.1, idx: 5}, {x0: 34, z: 3.6, dir: 1, speed: 0.9, idx: 6}]} />
			<Character pose={pose} position={root.position} rotationY={root.rotationY} back={<BackpackWorn />} lTarget={strapHands(pose, root).l} lPalm={strapHands(pose, root).palm} />
		</Stage>
	);
};
