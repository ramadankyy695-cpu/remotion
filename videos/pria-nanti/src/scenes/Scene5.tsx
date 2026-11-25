import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Stage} from '../three/Stage';
import {Character} from '../three/Character';
import {Neighborhood, Office} from '../three/Outdoor';
import {Backpack, BusStop, Chair, Laptop} from '../three/props';
import {blinkAt, mixPose, sitPose, standPose, withPose} from '../three/pose';
import {eyesWorld} from '../three/kinematics';
import {camLerp, dist, handheld, mixV, prog, rootToWorld, walking} from './util';

type V = [number, number, number];

const DESK = [-1, 0.76, -1.5] as V;
const LAPTOP: V = [-1, 0.76, -1.42];

// 5a — office at night, he's typing fast; high slow orbit, empty desks around him.
export const Scene5a: React.FC = () => {
	const f = useCurrentFrame();
	const root = {position: [-1, 0, -0.84] as V, rotationY: Math.PI, scale: 1};
	const look = Math.sin(f * 0.05);
	const pose = withPose(sitPose(), {
		spine: [0.2, 0, 0],
		chest: [0.12, 0, 0],
		neck: [0.15, look * 0.06, 0],
		head: [0.12, look * 0.12, 0],
		lWrist: [0.15, 0, 0],
		rWrist: [0.15, 0, 0],
		lFingers: 0.45,
		rFingers: 0.45,
		face: {blink: blinkAt(f, 1), lid: 0.35, sad: 0.2, frown: 0.5, lookY: -0.45, lookX: look * 0.3},
	});
	const t1 = Math.max(0, Math.sin(f * 2.3)) * 0.02;
	const t2 = Math.max(0, Math.sin(f * 2.7 + 1)) * 0.02;
	const lT: V = [LAPTOP[0] - 0.1, LAPTOP[1] + 0.035 + t1, LAPTOP[2] + 0.115];
	const rT: V = [LAPTOP[0] + 0.1, LAPTOP[1] + 0.035 + t2, LAPTOP[2] + 0.115];
	const eyes = eyesWorld(pose, root);
	const a = 0.9 - prog(f, 0, 95) * 0.5;
	const cam = handheld({pos: [-1 + Math.sin(a) * 2.6, 3.0 - prog(f, 0, 95) * 0.4, -1.1 + Math.cos(a) * 2.6], target: [-1, 0.95, -1.15], fov: 36}, f, 0.5);
	return (
		<Stage cam={cam} bg="#0c1424" exposure={1.05} focus={dist(cam.pos, eyes)} focusRange={1.0} bokeh={3}>
			<Office frame={f} />
			<Chair position={[-1, 0, -0.82]} />
			<Laptop position={LAPTOP} open={1} screen="sheet" />
			<pointLight position={[LAPTOP[0], 0.95, LAPTOP[2] - 0.05]} intensity={0.12} distance={1.4} decay={2} color="#bcd4ff" />
			<mesh position={[DESK[0] + 0.45, DESK[1] + 0.05, DESK[2] + 0.1]}>
				<cylinderGeometry args={[0.04, 0.035, 0.1, 16]} />
				<meshStandardMaterial color="#c9c3b6" roughness={0.4} />
			</mesh>
			<Character pose={pose} position={root.position} rotationY={root.rotationY} lTarget={lT} rTarget={rT} lPalm={[0, -1, 0]} rPalm={[0, -1, 0]} />
		</Stage>
	);
};

// 5b — packing up: zips the backpack on the desk and lifts it.
export const Scene5b: React.FC = () => {
	const f = useCurrentFrame();
	const root = {position: [-1, 0, -0.95] as V, rotationY: Math.PI, scale: 1};
	const zip = prog(f, 2, 30);
	const lift = prog(f, 32, 54);
	const pose = withPose(standPose(), {
		spine: [0.35 - lift * 0.25, 0, 0],
		chest: [0.15 - lift * 0.1, -lift * 0.2, 0],
		neck: [0.25 - lift * 0.15, 0, 0],
		head: [0.2 - lift * 0.1, lift * 0.2, 0],
		lFingers: 0.7,
		rFingers: 0.8,
		hipsZ: 0.02,
		face: {blink: blinkAt(f, 2), lid: 0.5, sad: 0.4, lookY: -0.6 + lift * 0.4},
	});
	const bagStart: V = [-1, 0.97, -1.45];
	const bagEnd: V = [-0.82, 1.32, -1.08];
	const bag = mixV(bagStart, bagEnd, lift);
	bag[1] += Math.sin(lift * Math.PI) * 0.06;
	const zipX = -1.13 + zip * 0.26;
	const rT: V = lift > 0 ? [bag[0] - 0.02, bag[1] + 0.25, bag[2] + 0.02] : [zipX, 1.2, -1.45];
	const lT: V = mixV([-1.1, 1.08, -1.32], [-1.15, 0.95, -1.0], lift);
	const eyes = eyesWorld(pose, root);
	const cam = handheld(camLerp({pos: [0.45, 1.4, -0.95], target: [-1.0, 1.1, -1.3], fov: 40}, {pos: [0.35, 1.45, -0.85], target: [-1.0, 1.25, -1.2], fov: 38}, prog(f, 0, 55)), f, 0.8);
	return (
		<Stage cam={cam} bg="#0c1424" exposure={1.05} focus={dist(cam.pos, eyes)} focusRange={0.7} bokeh={3}>
			<Office frame={f + 95} />
			<Chair position={[-1, 0, -0.62]} rotationY={0.3} />
			<group position={bag} rotation={[-Math.PI / 2 + lift * Math.PI / 2, 0, 0]}>
				<Backpack />
			</group>
			<Character pose={pose} position={root.position} rotationY={root.rotationY} lTarget={lT} rTarget={rT} />
		</Stage>
	);
};

// 5c — walking home at night under streetlights, backpack on, tired.
export const Scene5c: React.FC = () => {
	const f = useCurrentFrame();
	const d = 0.9 * (f / 30);
	const x = 4 + d;
	const pose = withPose(walking(d, 0.3, 0.0, 0.5), {});
	pose.head = [pose.head[0] + 0.18, pose.head[1], pose.head[2]];
	pose.face = {...pose.face, blink: blinkAt(f, 3), lid: 0.55, sad: 0.5, lookY: -0.5};
	const root = {position: [x, 0.15, -3.6] as V, rotationY: Math.PI / 2, scale: 1};
	const eyes = eyesWorld(pose, root);
	const cam = handheld({pos: [x - 0.8, 0.7, -1.2], target: [x + 0.3, 1.25, -3.6], fov: 40}, f, 1.2);
	return (
		<Stage cam={cam} bg="#04060c" exposure={1.25} focus={dist(cam.pos, eyes)} focusRange={1.2} bokeh={4}>
			<Neighborhood frame={f} light="night" x0={-10} x1={30} lit={0.7} lampsOn={1} shadowCenter={[x, 0, -3]} />
			{[8, 24].map((lx) => (
				<pointLight key={lx} position={[lx, 4.0, -3.75]} intensity={9} distance={12} decay={1.5} color="#ffcf8a" />
			))}
			<Character pose={pose} position={root.position} rotationY={root.rotationY} back={<Backpack />} />
		</Stage>
	);
};

// 5d — sitting alone at a bus stop, elbows on knees, head down.
export const Scene5d: React.FC = () => {
	const f = useCurrentFrame();
	const root = {position: [20, 0.15, -4.1] as V, rotationY: 0, scale: 1};
	const breath = (Math.sin(f * 0.09) + 1) / 2;
	const base = withPose(sitPose(), {
		hipsY: -0.33,
		spine: [0.42, 0, 0],
		chest: [0.2, 0, 0],
		neck: [0.25, 0, 0],
		head: [0.25 + breath * 0.03, 0.05, 0.04],
		breath: breath * 0.6,
		lFingers: 0.6,
		rFingers: 0.6,
		lHip: [-1.25, 0.12, 0.12],
		rHip: [-1.25, -0.12, -0.12],
		lKnee: 1.45,
		rKnee: 1.4,
		lAnkle: -0.2,
		rAnkle: -0.2,
		face: {blink: blinkAt(f, 7), lid: 0.6, sad: 0.6, lookY: -0.6},
	});
	const pose = mixPose(base, base, 0);
	// hands clasped between the knees
	const hands = rootToWorld(root, [0, 0.66, 0.4]);
	const lT: V = [hands[0] + 0.03, hands[1], hands[2]];
	const rT: V = [hands[0] - 0.03, hands[1] + 0.01, hands[2]];
	const cam = handheld(camLerp({pos: [22.4, 1.55, 1.2], target: [20, 0.9, -4.2], fov: 38}, {pos: [21.9, 1.45, 0.4], target: [20, 0.9, -4.2], fov: 34}, prog(f, 0, 51)), f, 0.6);
	const eyes = eyesWorld(pose, root);
	return (
		<Stage cam={cam} bg="#04060c" exposure={1.25} focus={dist(cam.pos, eyes)} focusRange={1.5} bokeh={3}>
			<Neighborhood frame={f + 50} light="night" x0={2} x1={40} lit={0.5} lampsOn={1} shadowCenter={[20, 0, -3]} />
			<BusStop position={[20, 0.15, -4.0]} />
			<pointLight position={[24, 4.0, -3.75]} intensity={10} distance={12} decay={1.5} color="#ffcf8a" castShadow shadow-mapSize={[1024, 1024]} />
			<pointLight position={[20, 2.4, -4.1]} intensity={1.2} distance={4} decay={1.5} color="#d9e6ff" />
			<group position={[20.75, 0.85, -4.25]} rotation={[0, -0.3, 0]}>
				<Backpack />
			</group>
			<Character pose={pose} position={root.position} rotationY={root.rotationY} lTarget={lT} rTarget={rT} />
		</Stage>
	);
};
