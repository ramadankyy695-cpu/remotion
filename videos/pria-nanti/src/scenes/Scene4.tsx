import React from 'react';
import * as THREE from 'three';
import {useCurrentFrame} from 'remotion';
import {Stage} from '../three/Stage';
import {Character, FATHER, MOTHER} from '../three/Character';
import {Neighborhood} from '../three/Outdoor';
import {GiftBag, House, houseStyles, Plant} from '../three/props';
import {cyl, lathe, mat, rbox, sphere} from '../three/geo';
import {blinkAt, sitPose, standPose, withPose} from '../three/pose';
import {eyesWorld, localToWorld} from '../three/kinematics';
import {camLerp, dist, handheld, mixV, prog, rootToWorld} from './util';

type V = [number, number, number];

// Parents' house sits at x=0 on the north side of the street.
const MOM = {position: [-1.35, 0.25, -7.35] as V, rotationY: 0.25, scale: MOTHER.height};
const DAD_BASE: V = [1.6, 0.02, -6.4];

const Bench: React.FC<{position: V; rotationY: number}> = ({position, rotationY}) => (
	<group position={position} rotation={[0, rotationY, 0]}>
		<mesh geometry={rbox(1.3, 0.05, 0.4, 0.015)} material={mat('#7a5638', {rough: 0.6})} position={[0, 0.4, 0]} castShadow receiveShadow />
		{[-0.55, 0.55].map((x) => (
			<mesh key={x} geometry={rbox(0.05, 0.4, 0.36, 0.01)} material={mat('#6a4a30', {rough: 0.6})} position={[x, 0.2, 0]} castShadow />
		))}
	</group>
);

// Woven tray (tampah) with green beans.
const Tray: React.FC<{position: V; rotation?: V; frame: number}> = ({position, rotation = [0, 0, 0], frame}) => (
	<group position={position} rotation={rotation}>
		<mesh geometry={lathe('tampah', [[0.001, 0], [0.2, 0.0], [0.23, 0.035], [0.225, 0.037], [0.195, 0.006], [0.001, 0.006]])} material={mat('#b8915a', {rough: 0.9})} castShadow receiveShadow />
		{new Array(26).fill(0).map((_, i) => {
			const a = i * 2.39;
			const r = 0.03 + (i % 9) * 0.018;
			return (
				<mesh key={i} geometry={cyl(0.005, 0.005, 0.09, 6)} material={mat(i % 3 ? '#5f8a3a' : '#7aa04a', {rough: 0.6})} position={[Math.cos(a) * r, 0.014, Math.sin(a) * r]} rotation={[Math.PI / 2, 0, a + frame * 0]} />
			);
		})}
	</group>
);

const Broom: React.FC<{position: V; rotation: V}> = ({position, rotation}) => (
	<group position={position} rotation={rotation}>
		<mesh geometry={cyl(0.014, 0.016, 1.1, 8)} material={mat('#8a6a42', {rough: 0.7})} position={[0, -0.55, 0]} castShadow />
		<mesh geometry={lathe('lidi', [[0.02, 0], [0.05, -0.15], [0.16, -0.55], [0.001, -0.56]], 14)} material={mat('#c2a46a', {rough: 0.9})} position={[0, -1.05, 0]} castShadow />
	</group>
);

const ParentsHome: React.FC<{frame: number}> = ({frame}) => {
	const t = frame / 30;
	const sweep = Math.sin(t * 2.4);
	// father sweeping: torso twist, broom swings
	const dadPose = withPose(standPose(), {
		hips: [0, 0.15 + sweep * 0.12, 0],
		spine: [0.28, sweep * 0.1, 0],
		chest: [0.12, sweep * 0.12, 0],
		neck: [0.2, 0, 0],
		head: [0.15, -sweep * 0.1, 0],
		lKnee: 0.25,
		rKnee: 0.25,
		lHip: [-0.25, 0, 0.08],
		rHip: [0.05, 0, -0.08],
		lAnkle: 0.0,
		rAnkle: -0.25,
		hipsY: -0.04,
		face: {blink: blinkAt(frame, 11), lid: 0.35, sad: 0.15},
	});
	const dadRoot = {position: DAD_BASE, rotationY: -0.9 + sweep * 0.05, scale: FATHER.height};
	const broomTop = rootToWorld(dadRoot, [0.12 + sweep * 0.08, 1.05, 0.35]);
	const broomRot: V = [0.75, -0.9 + sweep * 0.45, 0.2];
	const bDir = new THREE.Vector3(0, -1, 0).applyEuler(new THREE.Euler(...broomRot));
	const handA: V = [broomTop[0] + bDir.x * 0.05, broomTop[1] + bDir.y * 0.05, broomTop[2] + bDir.z * 0.05];
	const handB: V = [broomTop[0] + bDir.x * 0.42, broomTop[1] + bDir.y * 0.42, broomTop[2] + bDir.z * 0.42];
	// mother sorting beans
	const pick = (Math.sin(t * 1.6) + 1) / 2;
	const momPose = withPose(sitPose(), {
		spine: [0.3, 0, 0],
		chest: [0.12, 0, 0],
		neck: [0.25, 0, 0],
		head: [0.25, 0, 0],
		lKnee: 1.55,
		rKnee: 1.55,
		lFingers: 0.4 + pick * 0.3,
		rFingers: 0.5,
		face: {blink: blinkAt(frame, 17), lid: 0.5, sad: 0.1, smile: 0.1, lookY: -0.7},
	});
	const tray = rootToWorld(MOM, [0, 0.55, 0.38]);
	const momL = rootToWorld(MOM, [0.07 + pick * 0.05, 0.6 + Math.sin(t * 3.2) * 0.02 + pick * 0.03, 0.4 + pick * 0.04]);
	const momR = rootToWorld(MOM, [-0.1, 0.59, 0.36]);
	return (
		<group>
			<House position={[0, 0, -11]} s={{...houseStyles[0], wall: '#e6d9bf', lit: 0.15}} />
			<mesh geometry={rbox(6.2, 0.25, 1.5, 0.02)} material={mat('#b9ada0', {rough: 0.85})} position={[0, 0.125, -7.3]} castShadow receiveShadow />
			<Bench position={[-1.35, 0.25, -7.55]} rotationY={0.25} />
			<Plant position={[-2.6, 0.25, -7.6]} scale={1.3} seed={3} />
			<Plant position={[1.0, 0.25, -7.7]} scale={1.1} seed={8} />
			{/* drying clothes line */}
			<mesh geometry={cyl(0.006, 0.006, 3.2, 4)} material={mat('#444')} position={[3.2, 1.9, -7.0]} rotation={[0, 0, Math.PI / 2]} />
			{[2.2, 2.7, 3.3, 3.9].map((x, i) => (
				<mesh key={x} geometry={rbox(0.42, 0.55 + (i % 2) * 0.15, 0.01, 0.005)} material={mat(['#c9d8e4', '#e8c7a0', '#f2f2f0', '#9fb59a'][i], {rough: 0.95})} position={[x, 1.6 - (i % 2) * 0.07 + Math.sin(frame * 0.05 + i) * 0.01, -7.0]} rotation={[Math.sin(frame * 0.04 + i) * 0.08, 0, 0]} castShadow />
			))}
			<Tray position={tray} rotation={[0.25, 0.25, 0]} frame={frame} />
			<Character pose={momPose} look={MOTHER} position={MOM.position} rotationY={MOM.rotationY} lTarget={momL} rTarget={momR} lPalm={[0, -1, 0]} rPalm={[0, -1, 0]} />
			<Broom position={broomTop} rotation={broomRot} />
			<Character pose={dadPose} look={FATHER} position={dadRoot.position} rotationY={dadRoot.rotationY} lTarget={handA} rTarget={handB} />
			{/* small leaf pile */}
			{new Array(14).fill(0).map((_, i) => (
				<mesh key={i} geometry={sphere(0.03)} material={mat(i % 2 ? '#8a6a3a' : '#a57a3e', {rough: 0.9})} position={[1.9 + Math.cos(i * 2.1) * 0.25, 0.03, -5.9 + Math.sin(i * 1.7) * 0.2]} scale={[1, 0.25, 0.7]} />
			))}
		</group>
	);
};

const HERO_ROOT = {position: [-3.4, 0.15, 3.7] as V, rotationY: Math.PI + 0.25, scale: 1};

const heroPose = (f: number, lower: number) => {
	const breath = (Math.sin(f * 0.07) + 1) / 2;
	return withPose(standPose(), {
		spine: [0.03, 0, 0],
		chest: [0.02 + lower * 0.04, 0, 0],
		neck: [0.02 + lower * 0.12, 0, 0],
		head: [0.0 + lower * 0.18, -0.08, 0.02],
		breath: breath * 0.5,
		lFingers: 0.6,
		rFingers: 0.6,
		face: {blink: blinkAt(f, 9), lid: 0.3 + lower * 0.25, sad: 0.65, smile: 0.08 * (1 - lower), lookY: -0.1 - lower * 0.5, lookX: 0.1},
	});
};

// 4a — wide over-the-shoulder: he watches his parents from across the street.
export const Scene4a: React.FC = () => {
	const f = useCurrentFrame();
	const pose = heroPose(f, 0);
	// fiddles with the hoodie drawstring while holding the bag of oranges he brought
	const fid = localToWorld(pose, HERO_ROOT, 'chest', [-0.03 + Math.sin(f * 0.12) * 0.012, 0.0 + Math.sin(f * 0.09) * 0.03, 0.2]);
	const cam = handheld(camLerp({pos: [-4.6, 1.75, 6.4], target: [-0.4, 1.0, -7], fov: 34}, {pos: [-4.35, 1.7, 5.7], target: [-0.3, 1.05, -7], fov: 31}, prog(f, 0, 99)), f, 0.8);
	return (
		<Stage cam={cam} bg="#e7a77a" exposure={1.0} focus={dist(cam.pos, [0, 1, -7])} focusRange={4} bokeh={3}>
			<Neighborhood frame={f} light="golden" x0={-20} x1={20} skipHouse={0} sunDir={[-10, 3.2, 5]} shadowCenter={[-1, 0, -2]} />
			<ParentsHome frame={f} />
			<Character pose={pose} position={HERO_ROOT.position} rotationY={HERO_ROOT.rotationY} rTarget={fid} rPalm={[0, 0, 1]} leftHand={<GiftBag />} />
		</Stage>
	);
};

// 4b — close-up of mother's hands sorting beans; father's broom in the soft background.
export const Scene4b: React.FC = () => {
	const f = useCurrentFrame();
	const tray = rootToWorld(MOM, [0, 0.55, 0.38]);
	const cam = handheld(camLerp({pos: [tray[0] + 0.25, tray[1] + 0.28, tray[2] + 0.55], target: [tray[0], tray[1] + 0.03, tray[2]], fov: 34}, {pos: [tray[0] + 0.12, tray[1] + 0.25, tray[2] + 0.48], target: [tray[0] - 0.02, tray[1] + 0.04, tray[2]], fov: 31}, prog(f, 0, 86)), f + 100, 0.6);
	return (
		<Stage cam={cam} bg="#e7a77a" exposure={1.05} focus={dist(cam.pos, tray)} focusRange={0.25} bokeh={5}>
			<Neighborhood frame={f} light="golden" x0={-12} x1={12} skipHouse={0} sunDir={[-10, 3.2, 5]} shadowCenter={[-1, 0, -6]} />
			<ParentsHome frame={f + 99} />
			<pointLight position={[tray[0] + 0.3, tray[1] + 0.5, tray[2] + 0.6]} intensity={0.4} distance={2} decay={2} color="#ffc890" />
		</Stage>
	);
};

// 4c — his face, golden light; he watches, then lowers his eyes.
export const Scene4c: React.FC = () => {
	const f = useCurrentFrame();
	const lower = prog(f, 60, 100);
	const pose = heroPose(f + 185, lower);
	// rubs the back of his neck, then lets the hand drop as he lowers his eyes
	const rub = prog(f, 10, 28) - prog(f, 70, 95);
	const nape = localToWorld(pose, HERO_ROOT, 'head', [-0.05 + Math.sin(f * 0.22) * 0.012, -0.02, -0.11]);
	const side = rootToWorld(HERO_ROOT, [-0.24, 0.78, 0.06]);
	const rT = mixV(side, nape, rub);
	const eyes = eyesWorld(pose, HERO_ROOT);
	const cam = handheld(camLerp({pos: [eyes[0] - 0.55, eyes[1] - 0.05, eyes[2] - 0.95], target: [eyes[0], eyes[1] - 0.12, eyes[2]], fov: 34}, {pos: [eyes[0] - 0.42, eyes[1] - 0.06, eyes[2] - 0.72], target: [eyes[0], eyes[1] - 0.1, eyes[2]], fov: 32}, prog(f, 0, 117)), f, 0.7);
	return (
		<Stage cam={cam} bg="#e7a77a" exposure={1.05} focus={dist(cam.pos, eyes)} focusRange={0.35} bokeh={5}>
			<Neighborhood frame={f} light="golden" x0={-16} x1={16} skipHouse={0} sunDir={[-10, 3.2, 5]} shadowCenter={[-3, 0, 3]} />
			<ParentsHome frame={f + 185} />
			<Character pose={pose} position={HERO_ROOT.position} rotationY={HERO_ROOT.rotationY} rTarget={rT} rPole={rootToWorld(HERO_ROOT, [-0.6, 1.7, -0.1])} rPalm={rub > 0.5 ? localToWorld(pose, HERO_ROOT, 'head', [0, 0, 1]).map((v, i) => v - localToWorld(pose, HERO_ROOT, 'head', [0, 0, 0])[i]) as V : null} leftHand={<GiftBag />} />
			<pointLight position={[eyes[0] - 0.8, eyes[1] + 0.3, eyes[2] - 1.0]} intensity={0.6} distance={3} decay={2} color="#ffc58a" />
		</Stage>
	);
};
