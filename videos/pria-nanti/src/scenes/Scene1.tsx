import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Stage} from '../three/Stage';
import {Character} from '../three/Character';
import {RoomSet, ROOM} from '../three/RoomSet';
import {blinkAt, sitPose, withPose} from '../three/pose';
import {eyesWorld} from '../three/kinematics';
import {camLerp, dist, handheld, prog} from './util';

type V = [number, number, number];

export const deskTyping = (f: number, amt: number): {l: V; r: V} => {
	const k = ROOM.laptop;
	const t1 = Math.max(0, Math.sin(f * 1.7)) * 0.018 * amt;
	const t2 = Math.max(0, Math.sin(f * 2.1 + 1.3)) * 0.018 * amt;
	return {
		l: [k[0] - 0.1, k[1] + 0.035 + t1, k[2] + 0.115],
		r: [k[0] + 0.1, k[1] + 0.035 + t2, k[2] + 0.115],
	};
};

// SCENE 1 — late night at the desk; looks at the clock, back to the laptop. Dolly-in wide -> MCU.
export const Scene1: React.FC = () => {
	const f = useCurrentFrame();
	const lookClock = prog(f, 58, 78) - prog(f, 122, 146);
	const sigh = Math.sin(Math.PI * prog(f, 150, 185, (t) => t));
	const typing = 1 - prog(f, 50, 60) + prog(f, 165, 180) * 0.6;
	const pose = withPose(sitPose(), {
		spine: [0.16, 0, 0],
		chest: [0.1 - sigh * 0.06, 0, 0],
		neck: [0.1 - lookClock * 0.3, lookClock * 0.12, 0],
		head: [0.14 - lookClock * 0.35 + sigh * 0.1, lookClock * 0.22, 0],
		lClav: sigh * 0.6,
		rClav: sigh * 0.6,
		breath: sigh,
		lWrist: [0.15, 0, 0],
		rWrist: [0.15, 0, 0],
		lFingers: 0.45,
		rFingers: 0.45,
		face: {
			blink: blinkAt(f, 3),
			lid: 0.45 - lookClock * 0.2 + sigh * 0.3,
			sad: 0.45 + sigh * 0.3,
			frown: 0.15,
			lookY: -0.4 + lookClock * 1.2,
			lookX: lookClock * 0.2,
			mouth: sigh * 0.25,
		},
	});
	const root = {position: [ROOM.chair[0], 0, ROOM.chair[2] - 0.02] as V, rotationY: Math.PI, scale: 1};
	const hands = deskTyping(f, typing);
	const eyes = eyesWorld(pose, root);
	const wide = {pos: [1.25, 1.75, 1.6] as V, target: [-0.6, 1.0, -1.1] as V, fov: 42};
	const mcu = {pos: [0.3, 1.22, -1.62] as V, target: [eyes[0] + 0.12, eyes[1] - 0.1, eyes[2]] as V, fov: 33};
	const cam = handheld(camLerp(wide, mcu, prog(f, 0, 190)), f, 0.6);
	return (
		<Stage cam={cam} bg="#0a0d14" exposure={1.15} focus={dist(cam.pos, eyes)} focusRange={0.5} bokeh={3}>
			<RoomSet frame={f} time="night" clockSeconds={23 * 3600 + 47 * 60 + 12 + f / 30} />
			<pointLight position={[0.6, 1.9, 0.6]} intensity={0.6} distance={4} decay={1.5} color="#7f95c8" />
			<Character pose={pose} position={root.position} rotationY={root.rotationY} lTarget={hands.l} rTarget={hands.r} lPalm={[0, -1, 0]} rPalm={[0, -1, 0]} />
		</Stage>
	);
};
