import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Stage} from '../three/Stage';
import {Character} from '../three/Character';
import {Neighborhood} from '../three/Outdoor';
import {BackpackWorn, Glow, House, houseStyles, Tree} from '../three/props';
import {mat, rbox, sphere} from '../three/geo';
import {blinkAt, standPose, mixPose, withPose} from '../three/pose';
import {eyesWorld} from '../three/kinematics';
import {camLerp, dist, handheld, prog, strapHands, walking} from './util';

type V = [number, number, number];

const DREAM_X = 8;
let GRIP = 0;

// A modest but warm house: lit windows, a tree with a small swing, potted plants.
export const DreamHouse: React.FC<{frame: number; lit: number}> = ({frame, lit}) => (
	<group position={[DREAM_X, 0, -11]}>
		<House s={{...houseStyles[2], wall: '#f0dfc0', roof: '#8e4b33', lit}} dream={lit} />
		<Tree position={[2.4, 0, 4.1]} scale={1.1} seed={77} color="#527a40" />
		{/* swing */}
		<group position={[2.0, 2.4, 4.1]} rotation={[Math.sin(frame * 0.04) * 0.05, 0, 0]}>
			{[-0.22, 0.22].map((x) => (
				<mesh key={x} position={[x, -0.75, 0]}>
					<cylinderGeometry args={[0.008, 0.008, 1.5, 4]} />
					<meshStandardMaterial color="#5a4a3a" />
				</mesh>
			))}
			<mesh geometry={rbox(0.55, 0.04, 0.2, 0.01)} material={mat('#8a6442', {rough: 0.7})} position={[0, -1.5, 0]} castShadow />
		</group>
		{/* warm porch lamp */}
		<mesh geometry={sphere(0.08)} position={[-0.6, 2.3, 3.15]}>
			<meshBasicMaterial color="#ffd9a0" toneMapped={false} />
		</mesh>
		<Glow position={[-0.6, 2.3, 3.3]} scale={1.8} color="#ffc27a" opacity={0.6 * lit} />
		<pointLight position={[-0.6, 2.2, 3.6]} intensity={2.5 * lit} distance={7} decay={1.6} color="#ffbe78" />
		<pointLight position={[1.3, 1.8, 5]} intensity={1.2 * lit} distance={6} decay={1.6} color="#ffc27a" />
	</group>
);

const walkerPose = (d: number, f: number, mood = 0.25, phase0 = 0) => {
	const p = walking(d, 0.32, mood, phase0);
	p.face = {...p.face, blink: blinkAt(f, 5), lid: 0.4, sad: 0.5, lookY: -0.25};
	return p;
};

// 7a — dusk: walking past the houses with his backpack. Side tracking from the road.
export const Scene7a: React.FC = () => {
	const f = useCurrentFrame();
	GRIP = 0;
	const d = 0.95 * (f / 30);
	const x = -3 + d;
	const pose = walkerPose(d, f);
	pose.head = [pose.head[0] + 0.05, pose.head[1] - 0.25 * Math.sin(f * 0.03), pose.head[2]];
	const root = {position: [x, 0.15, -3.6] as V, rotationY: Math.PI / 2, scale: 1};
	const eyes = eyesWorld(pose, root);
	const cam = handheld({pos: [x + 0.7, 1.3, -0.5], target: [x + 0.1, 1.25, -3.9], fov: 38}, f, 1.0);
	return (
		<Stage cam={cam} bg="#232a52" exposure={1.2} focus={dist(cam.pos, eyes)} focusRange={1.2} bokeh={3.5}>
			<Neighborhood frame={f} light="dusk" x0={-20} x1={24} lit={0.8} lampsOn={0.6} skipHouse={DREAM_X} shadowCenter={[x, 0, -3]} />
			<DreamHouse frame={f} lit={0.9} />
			<pointLight position={[x + 1.2, 2.2, -1.5]} intensity={1.2} distance={5} decay={1.5} color="#ffc890" />
			<Character pose={pose} position={root.position} rotationY={root.rotationY} back={<BackpackWorn />} lTarget={strapHands(pose, root, GRIP).l} rTarget={strapHands(pose, root, GRIP).r} lPalm={strapHands(pose, root).palm} rPalm={strapHands(pose, root).palm} />
		</Stage>
	);
};

// 7b — he slows down and stops in front of the warm house; over-the-shoulder push-in.
export const Scene7b: React.FC = () => {
	const f = useCurrentFrame();
	const slow = prog(f, 0, 32);
	const d = 1.4 * slow; // decelerating walk
	const x = 5.9 + d;
	const turn = prog(f, 26, 50);
	const walk = walkerPose(d * 1.0, f, 0.3, 0.7);
	const stand = withPose(standPose(), {
		neck: [-0.02, 0, 0],
		head: [-0.06, 0, 0],
		lFingers: 0.5,
		rFingers: 0.5,
		breath: (Math.sin(f * 0.08) + 1) / 4,
		face: {blink: blinkAt(f, 9), lid: 0.25, sad: 0.55, smile: 0.12 * prog(f, 45, 70), lookY: 0.15},
	});
	const pose = mixPose(walk, stand, prog(f, 24, 36));
	const root = {position: [x, 0.15, -3.6] as V, rotationY: Math.PI / 2 + turn * (Math.PI / 2 - 0.1), scale: 1};
	GRIP = prog(f, 40, 70) * 0.06;
	pose.lFingers = 0.5 + prog(f, 40, 70) * 0.4;
	pose.rFingers = 0.5 + prog(f, 40, 70) * 0.4;
	const cam = handheld(camLerp({pos: [x - 0.6, 1.8, 0.9], target: [DREAM_X + 0.6, 1.5, -9], fov: 42}, {pos: [x - 0.4, 1.78, 0.3], target: [DREAM_X + 0.6, 1.55, -9], fov: 38}, prog(f, 0, 82)), f, 0.8);
	return (
		<Stage cam={cam} bg="#232a52" exposure={1.2} focus={dist(cam.pos, [DREAM_X, 1.5, -8])} focusRange={4} bokeh={3}>
			<Neighborhood frame={f + 95} light="dusk" x0={-8} x1={26} lit={0.8} lampsOn={0.8} skipHouse={DREAM_X} shadowCenter={[x, 0, -5]} />
			<DreamHouse frame={f + 95} lit={0.9 + prog(f, 30, 70) * 0.25} />
			<Character pose={pose} position={root.position} rotationY={root.rotationY} back={<BackpackWorn />} lTarget={strapHands(pose, root, GRIP).l} rTarget={strapHands(pose, root, GRIP).r} lPalm={strapHands(pose, root).palm} rPalm={strapHands(pose, root).palm} />
		</Stage>
	);
};

// 7c — he turns away and walks back into the dusk; static wide, streetlights flicker on.
export const Scene7c: React.FC = () => {
	const f = useCurrentFrame();
	GRIP = 0.06 - prog(f, 0, 30) * 0.06;
	const turn = prog(f, 0, 22);
	const go = Math.max(0, f - 14);
	const d = 0.9 * (go / 30);
	const x = 7.3 - d;
	const stand = withPose(standPose(), {head: [0.15, 0, 0], neck: [0.1, 0, 0], face: {blink: blinkAt(f, 3), lid: 0.5, sad: 0.6, lookY: -0.4}});
	const walk = walkerPose(d, f, 0.1, 0.3);
	walk.head = [walk.head[0] + 0.12, walk.head[1], walk.head[2]];
	const pose = mixPose(stand, walk, prog(f, 8, 24));
	const rotY = Math.PI - 0.1 + turn * (Math.PI / 2 + 0.1);
	const root = {position: [x, 0.15, -3.6] as V, rotationY: rotY, scale: 1};
	const lamps = prog(f, 30, 60);
	const cam = handheld({pos: [11.5, 1.5, -1.3], target: [4.5, 1.2, -3.7], fov: 36}, f, 0.5);
	return (
		<Stage cam={cam} bg="#232a52" exposure={1.2} focus={dist(cam.pos, root.position) + 0.2} focusRange={3} bokeh={2.5}>
			<Neighborhood frame={f + 180} light="dusk" x0={-30} x1={22} lit={0.85} lampsOn={0.6 + lamps * 0.4} skipHouse={DREAM_X} shadowCenter={[x, 0, -3]} />
			<DreamHouse frame={f + 180} lit={1.1} />
			{[0, -16].map((lx) => (
				<pointLight key={lx} position={[lx, 4.0, -3.75]} intensity={6 * lamps} distance={10} decay={1.5} color="#ffcf8a" />
			))}
			<Character pose={pose} position={root.position} rotationY={root.rotationY} back={<BackpackWorn />} lTarget={strapHands(pose, root, GRIP).l} rTarget={strapHands(pose, root, GRIP).r} lPalm={strapHands(pose, root).palm} rPalm={strapHands(pose, root).palm} />
		</Stage>
	);
};
