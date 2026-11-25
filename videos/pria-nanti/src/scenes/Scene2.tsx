import React from 'react';
import * as THREE from 'three';
import {useCurrentFrame} from 'remotion';
import {Stage} from '../three/Stage';
import {Character} from '../three/Character';
import {RoomSet, ROOM} from '../three/RoomSet';
import {Neighborhood} from '../three/Outdoor';
import {PhotoFrame} from '../three/props';
import {blinkAt, sitPose, standPose, withPose} from '../three/pose';
import {eyesWorld} from '../three/kinematics';
import {camLerp, dist, handheld, mixV, pocketHands, prog, walking} from './util';

type V = [number, number, number];

const framePoint = (pos: V, rot: V, local: V): V => {
	const v = new THREE.Vector3(...local).applyEuler(new THREE.Euler(...rot)).add(new THREE.Vector3(...pos));
	return [v.x, v.y, v.z];
};

// 2a — picks up the family photo from the desk and looks at it. Rack focus photo -> eyes.
export const Scene2a: React.FC = () => {
	const f = useCurrentFrame();
	const lift = prog(f, 4, 38);
	const deskPos: V = [-0.32, 0.835, -1.62];
	const deskRot: V = [-0.08, -0.35, 0];
	const holdPos: V = [-0.74, 1.08 + Math.sin(f * 0.05) * 0.004, -1.32];
	const holdRot: V = [-0.42, 0.05, 0.03];
	const arc = Math.sin(lift * Math.PI) * 0.08;
	const pPos = mixV(deskPos, holdPos, lift);
	pPos[1] += arc;
	const pRot = mixV(deskRot, holdRot, lift);
	const reach = prog(f, 0, 6);
	const pose = withPose(sitPose(), {
		spine: [0.14, 0, 0],
		chest: [0.08, 0.05 - lift * 0.05, 0],
		neck: [0.15 + lift * 0.1, 0.1 - lift * 0.1, 0],
		head: [0.15 + lift * 0.12, 0.2 - lift * 0.2, 0.03],
		lWrist: [-0.2, Math.PI / 2, 0.2],
		rWrist: [-0.2, -Math.PI / 2, -0.2],
		lFingers: 0.55,
		rFingers: 0.55,
		face: {blink: blinkAt(f, 5), lid: 0.35, sad: 0.6, smile: 0.25 * prog(f, 45, 75), lookY: -0.35 - lift * 0.3, lookX: (1 - lift) * -0.4},
	});
	const root = {position: [ROOM.chair[0], 0, ROOM.chair[2] - 0.02] as V, rotationY: Math.PI, scale: 1};
	const eyes = eyesWorld(pose, root);
	const rEdge = framePoint(pPos, pRot, [0.1, -0.02, -0.02]);
	const lEdge = framePoint(pPos, pRot, [-0.1, -0.02, -0.02]);
	const restR: V = [-0.62, 0.8, -1.25];
	const restL: V = [-0.9, 0.8, -1.25];
	const rT = mixV(restR, rEdge, Math.min(1, reach + lift));
	const lT = mixV(restL, lEdge, prog(f, 20, 40));
	const cam = handheld(camLerp({pos: [-0.3, 1.62, -0.55], target: [-0.5, 0.95, -1.5], fov: 40}, {pos: [-0.5, 1.56, -0.78], target: [holdPos[0], holdPos[1] - 0.02, holdPos[2]], fov: 30}, prog(f, 0, 100)), f, 0.5);
	const focusPhoto = dist(cam.pos, pPos);
	const focusEyes = dist(cam.pos, eyes);
	const focus = focusPhoto + (focusEyes - focusPhoto) * 0;
	void focusEyes;
	return (
		<Stage cam={cam} bg="#0a0d14" exposure={1.2} focus={focus} focusRange={0.18} bokeh={4}>
			<RoomSet frame={f + 200} time="night" clockSeconds={23 * 3600 + 48 * 60 + f / 30} photoOnDesk={false} />
			<pointLight position={[-0.4, 1.3, -1.6]} intensity={0.25} distance={2} decay={2} color="#ffcf9a" />
			<PhotoFrame position={pPos} rotation={pRot} />
			<Character pose={pose} position={root.position} rotationY={root.rotationY} lTarget={lT} rTarget={rT} lPalm={[1, 0, 0]} rPalm={[-1, 0, 0]} />
		</Stage>
	);
};

// 2b — standing at the window at night, imagining his own house (a warm house glows into existence).
export const Scene2b: React.FC = () => {
	const f = useCurrentFrame();
	const dream = prog(f, 4, 45);
	const root = {position: [0.92, 0, -1.3] as V, rotationY: Math.PI, scale: 1};
	const breathe = Math.sin(f * 0.08) * 0.5 + 0.5;
	const pose = withPose(standPose(), {
		spine: [-0.02, 0, 0],
		chest: [0.0, 0.05, 0],
		neck: [-0.05, 0.05, 0],
		head: [-0.08 + prog(f, 30, 58) * 0.05, 0.1, 0.06],
		breath: breathe * 0.4,
		lWrist: [0, 0, 0],
		lFingers: 0.25,
		rFingers: 0.6,
		face: {blink: blinkAt(f, 8), lid: 0.2, sad: 0.4, smile: 0.15 * dream, lookY: 0.05},
	});
	const eyes = eyesWorld(pose, root);
	// left hand rests on the window frame, right hand in the pocket
	const lT: V = [0.5, 1.35, -1.74];
	const rT: V = pocketHands(root, 0).r;
	const cam = handheld(camLerp({pos: [1.25, 1.78, 0.75], target: [0.9, 1.45, -6], fov: 42}, {pos: [1.2, 1.75, 0.45], target: [0.92, 1.48, -6], fov: 39}, prog(f, 0, 58)), f, 0.7);
	return (
		<Stage cam={cam} bg="#0a0d14" exposure={1.15} focus={dist(cam.pos, [1.6, 1.3, -12])} focusRange={8} bokeh={2}>
			<RoomSet frame={f + 400} time="night" clockSeconds={23 * 3600 + 51 * 60 + f / 30} lamp={0.7} dream={dream} />
			<Character pose={pose} position={root.position} rotationY={root.rotationY} lTarget={lT} rTarget={rT} />
			<pointLight position={[eyes[0], eyes[1] + 0.2, eyes[2] - 0.6]} intensity={0.25 + dream * 0.25} distance={2} decay={2} color="#ffd0a0" />
		</Stage>
	);
};

// 2c — walking through a modest neighborhood, lost in thought. Front tracking shot.
export const Scene2c: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / 30;
	const speed = 1.0;
	const d = speed * t;
	const x = -2 + d;
	const lookUp = prog(f, 62, 82) - prog(f, 92, 103) * 0.6;
	const pose = withPose(walking(d, 0.33, 0.15), {});
	pose.head = [pose.head[0] + 0.08 - lookUp * 0.45, pose.head[1] - lookUp * 0.25, pose.head[2]];
	pose.face = {...pose.face, blink: blinkAt(f, 2), lid: 0.35 - lookUp * 0.15, sad: 0.5, lookY: -0.3 + lookUp * 0.9, lookX: -lookUp * 0.3};
	// hands in hoodie pocket
	const root = {position: [x, 0.15, -3.7] as V, rotationY: Math.PI / 2, scale: 1};
	const eyes = eyesWorld(pose, root);
	const pk = pocketHands(root, pose.hipsY);
	const pocketL = pk.l;
	const pocketR = pk.r;
	const cam = handheld({pos: [x + 2.4, 1.45, -2.4 + Math.sin(t * 0.5) * 0.05], target: [x + 0.1, 1.2, -3.6], fov: 36}, f, 1.2);
	return (
		<Stage cam={cam} bg="#b8cfe6" exposure={1.0} focus={dist(cam.pos, eyes)} focusRange={1.2} bokeh={3}>
			<Neighborhood frame={f} light="afternoon" x0={-16} x1={30} sunDir={[6, 5, 5]} shadowCenter={[x, 0, -3]} />
			<Character pose={pose} position={root.position} rotationY={root.rotationY} lTarget={pocketL} rTarget={pocketR} />
		</Stage>
	);
};
