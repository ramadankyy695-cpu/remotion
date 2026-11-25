import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Stage} from '../three/Stage';
import {Character} from '../three/Character';
import {RoomSet, ROOM} from '../three/RoomSet';
import {Laptop} from '../three/props';
import {blinkAt, floorSitPose, mixPose, sitPose, standPose, withPose} from '../three/pose';
import {eyesWorld, localToWorld} from '../three/kinematics';
import {camLerp, dist, handheld, mixV, prog, rootToWorld} from './util';
import {FLOOR_ROOT, LowTable} from './Scene6';
import {deskTyping} from './Scene1';

type V = [number, number, number];

// 8a — dawn. He gets up from the floor. Not a sudden change: slow, heavy, but he stands.
export const Scene8a: React.FC = () => {
	const f = useCurrentFrame();
	const floor = withPose(floorSitPose(), {spine: [0.15, 0, 0], neck: [-0.05, 0, 0], head: [-0.1, 0.25, 0], face: {blink: blinkAt(f, 2), lid: 0.4, sad: 0.4, lookY: 0.3, lookX: 0.4}});
	const crouch = withPose(standPose(), {
		hipsY: -0.5,
		hipsZ: 0.15,
		hips: [0.3, 0, 0],
		spine: [0.45, 0, 0],
		chest: [0.2, 0, 0],
		neck: [-0.1, 0, 0],
		head: [-0.1, 0, 0],
		lHip: [-1.45, 0.1, 0.12],
		rHip: [-1.0, -0.1, -0.12],
		lKnee: 2.1,
		rKnee: 1.9,
		lAnkle: -0.6,
		rAnkle: -0.9,
		face: {lid: 0.35, sad: 0.35, lookY: 0.1},
	});
	const stand = withPose(standPose(), {spine: [0.0, 0, 0], chest: [-0.03, 0, 0], neck: [-0.04, 0.15, 0], head: [-0.05, 0.3, 0], breath: 0.8, face: {blink: blinkAt(f, 2), lid: 0.2, sad: 0.25, smile: 0.05, lookX: 0.5, lookY: 0.15}});
	const a = prog(f, 14, 40);
	const b = prog(f, 38, 66);
	const pose = b > 0 ? mixPose(crouch, stand, b) : mixPose(floor, crouch, a);
	const root = {position: mixV(FLOOR_ROOT.position, [0.2, 0, -0.45], a) as V, rotationY: FLOOR_ROOT.rotationY, scale: 1};
	const eyes = eyesWorld(pose, root);
	// hands push on the floor/bed edge to get up, then right hand runs through his hair
	const push = 1 - prog(f, 34, 48);
	const lPush: V = [0.62, 0.36, -0.15];
	const rPush: V = [0.62, 0.36, -0.75];
	const lRest = rootToWorld(root, [0.22, 0.85 + pose.hipsY, 0.05]);
	const hair = prog(f, 50, 60) * (1 - prog(f, 68, 74));
	const hairT = localToWorld(pose, root, 'head', [-0.02, 0.2, 0.02 - prog(f, 50, 68) * 0.08]);
	const rRest = rootToWorld(root, [-0.22, 0.85 + pose.hipsY, 0.05]);
	const lT = mixV(lRest, lPush, push);
	const rT = mixV(mixV(rRest, hairT, hair), rPush, push);
	const cam = handheld(camLerp({pos: [-1.3, 0.75, 0.9], target: [0.3, 0.6, -0.5], fov: 40}, {pos: [-1.2, 1.25, 0.75], target: [eyes[0], eyes[1] - 0.15, eyes[2]], fov: 38}, prog(f, 10, 74)), f, 0.7);
	return (
		<Stage cam={cam} bg="#a9bfe0" exposure={1.3} focus={dist(cam.pos, eyes)} focusRange={1.0} bokeh={3}>
			<RoomSet frame={f} time="dawn" clockSeconds={5 * 3600 + 41 * 60 + f / 30} laptopOnDesk lamp={0} laptopOpen={0} mess={1} />
			<LowTable />
			<Character pose={pose} position={root.position} rotationY={root.rotationY} lTarget={lT} rTarget={rT} lPalm={push > 0.5 ? [0, -1, 0] : null} rPalm={push > 0.5 ? [0, -1, 0] : hair > 0.5 ? [0, -1, 0] : null} rPole={hair > 0.3 ? rootToWorld(root, [-0.5, 1.6, 0.2]) : undefined} />
		</Stage>
	);
};

// 8b — close on the desk: he straightens the papers and opens the laptop again.
export const Scene8b: React.FC = () => {
	const f = useCurrentFrame();
	const open = prog(f, 14, 38);
	const k = ROOM.laptop;
	const theta = Math.PI / 2 - open * (Math.PI / 2 + 0.3);
	const lidTop: V = [k[0], k[1] + 0.016 + Math.cos(theta) * 0.225 + 0.02, k[2] - 0.113 + Math.sin(theta) * 0.225 + 0.04];
	const root = {position: [ROOM.chair[0] + 0.05, 0, ROOM.chair[2] - 0.15] as V, rotationY: Math.PI, scale: 1};
	const pose = withPose(standPose(), {spine: [0.4, 0, 0], chest: [0.2, 0, 0], neck: [0.15, 0, 0], head: [0.25, 0, 0], lFingers: 0.3, rFingers: 0.55, face: {blink: blinkAt(f, 4), lid: 0.3, sad: 0.2, lookY: -0.6}});
	const stackL: V = mixV([-0.35, 0.8, -1.2], [-0.32, 0.79, -1.4], prog(f, 0, 14));
	const rT = mixV([-0.7, 0.85, -1.2], lidTop, prog(f, 4, 14));
	const cam = handheld(camLerp({pos: [0.2, 1.0, -1.55], target: [-0.72, 0.84, -1.35], fov: 40}, {pos: [0.12, 1.02, -1.55], target: [-0.74, 0.86, -1.35], fov: 36}, prog(f, 0, 41)), f, 0.6);
	return (
		<Stage cam={cam} bg="#a9bfe0" exposure={1.05} focus={dist(cam.pos, k)} focusRange={0.3} bokeh={4}>
			<RoomSet frame={f + 74} time="dawn" clockSeconds={5 * 3600 + 43 * 60 + f / 30} laptopOnDesk={false} lamp={0} mess={1 - prog(f, 0, 14)} chair={false} />
			<Laptop position={k} open={open} glow={0.9} screen="doc" />
			<Character pose={pose} position={root.position} rotationY={root.rotationY} lTarget={stackL} rTarget={rT} lPalm={[0, -1, 0]} rPalm={[0, -1, 0]} />
		</Stage>
	);
};

// 8c — he sits and starts working again. Same framing as the opening, but warm morning light and a straighter back.
export const Scene8c: React.FC = () => {
	const f = useCurrentFrame();
	const pose = withPose(sitPose(), {
		spine: [0.06, 0, 0],
		chest: [0.02, 0, 0],
		neck: [0.06, 0, 0],
		head: [0.08, 0, 0],
		lWrist: [0.15, 0, 0],
		rWrist: [0.15, 0, 0],
		lFingers: 0.45,
		rFingers: 0.45,
		face: {blink: blinkAt(f, 1), lid: 0.15, sad: 0.15, frown: 0.25, smile: 0.12 + prog(f, 20, 40) * 0.15, lookY: -0.3},
	});
	const root = {position: [ROOM.chair[0], 0, ROOM.chair[2] - 0.02] as V, rotationY: Math.PI, scale: 1};
	const h = deskTyping(f, 1);
	const eyes = eyesWorld(pose, root);
	const cam = handheld(camLerp({pos: [0.35, 1.25, -1.6], target: [eyes[0] + 0.12, eyes[1] - 0.1, eyes[2]], fov: 34}, {pos: [0.28, 1.27, -1.62], target: [eyes[0] + 0.1, eyes[1] - 0.08, eyes[2]], fov: 31}, prog(f, 0, 48)), f, 0.5);
	return (
		<Stage cam={cam} bg="#a9bfe0" exposure={1.05} focus={dist(cam.pos, eyes)} focusRange={0.5} bokeh={3}>
			<RoomSet frame={f + 120} time="dawn" clockSeconds={5 * 3600 + 46 * 60 + f / 30} lamp={0} mess={0} screen="doc" />
			<pointLight position={[0.3, 1.6, -1.5]} intensity={0.8} distance={3} decay={2} color="#ffc890" />
			<Character pose={pose} position={root.position} rotationY={root.rotationY} lTarget={h.l} rTarget={h.r} lPalm={[0, -1, 0]} rPalm={[0, -1, 0]} />
		</Stage>
	);
};
