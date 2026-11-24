import {useThree} from '@react-three/fiber';
import {useLayoutEffect} from 'react';
import * as THREE from 'three';
import {
	addShake,
	camAt,
	type CamState,
	easeIn,
	easeInOut,
	easeOut,
	lerp,
	lerp3,
	seg,
	type V3,
	wobble,
} from './lib/anim';
import {autoBlink, basePose, breathe, Character2D, cycle, talkMouth} from './components/Character2D';
import {Cave, CHEST_POS, Glow, ShotLights} from './world/Cave';
import {Bedroom, Chest, Gem, Particles, Phone} from './world/Props';
import type {ShotId} from './timeline';

const CameraRig = ({c}: {c: CamState}) => {
	const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
	useLayoutEffect(() => {
		camera.position.set(...c.pos);
		camera.up.set(0, 1, 0);
		camera.lookAt(...c.target);
		if (c.roll) camera.rotateZ(c.roll);
		if (camera.fov !== c.fov || camera.near !== 0.03) {
			camera.fov = c.fov;
			camera.near = 0.03;
			camera.far = 120;
			camera.updateProjectionMatrix();
		}
	});
	return null;
};

const Atmos = ({bg, near, far}: {bg: string; near: number; far: number}) => (
	<>
		<color attach="background" args={[bg]} />
		<fog attach="fog" args={[bg, near, far]} />
	</>
);

type P = {lf: number; len: number};

const CAVE_FOG = '#110b09';
const CHAMBER_FOG = '#0a0c15';

// ------------------------------------------------------------------ sh01 walk together
const Sh01 = ({lf}: P) => {
	const mainX = -10 + 1.35 * (lf / 30);
	const friendX = mainX + 1.05;
	const c = camAt(lf, [
		{f: 0, pos: [mainX - 1.6, 1.0, 3.3], target: [mainX - 0.1, 1.45, -1.6], fov: 54},
		{f: 90, pos: [mainX + 0.5, 1.55, 3.3], target: [mainX + 0.6, 1.3, -1.6], fov: 54},
	]);
	const cam = c.pos;
	const wm = cycle(lf, 1.0, 0.42);
	const wf = cycle(lf + 9, 1.0, 0.42);
	const friendTalks = lf > 8 && lf < 64;
	return (
		<>
			<CameraRig c={c} />
			<Atmos bg={CAVE_FOG} near={4} far={24} />
			<ShotLights
				lights={[
					{p: [-12, 2.6, -3.1], c: '#ffaa55', i: 7},
					{p: [-6, 2.6, 3.1], c: '#ffaa55', i: 6},
					{p: [mainX + 0.8, 2.3, 1.8], c: '#ffcf96', i: 2.6, d: 6},
					{p: [mainX, 3.2, -3.2], c: '#6f8cff', i: 2, d: 6},
				]}
			/>
			<Cave frame={lf} />
			{/* foreground lantern for the hook */}
			<group position={[-11.6, 2.3, 2.15]}>
				<mesh>
					<boxGeometry args={[0.22, 0.3, 0.22]} />
					<meshLambertMaterial color="#2a2018" />
				</mesh>
				<Glow position={[0, 0, 0]} size={1.4} color="#ffb15a" opacity={0.8} />
			</group>
			<Particles frame={lf} center={[mainX + 0.5, 2, -0.5]} size={[6, 3.5, 4]} count={90} pointSize={0.04} opacity={0.55} />
			<Character2D
				who="main"
				view="side"
				position={[mainX, 0, -1.3]}
				cam={cam}
				glow={0.4}
				pose={basePose({
					...wm,
					expr: lf > 40 && lf < 70 ? 'joy' : 'happy',
					mouth: lf > 40 && lf < 70 ? talkMouth(lf, 2) : 0,
					blink: autoBlink(lf, 1),
				})}
			/>
			<Character2D
				who="friend"
				view="side"
				position={[friendX, 0, -1.95]}
				cam={cam}
				glow={0.4}
				pose={basePose({
					...wf,
					expr: 'happy',
					mouth: friendTalks ? talkMouth(lf) : 0,
					headFlip: friendTalks,
					blink: autoBlink(lf, 3),
				})}
			/>
		</>
	);
};

// ------------------------------------------------------------------ sh02 promise + fist bump
const Sh02 = ({lf}: P) => {
	const c = camAt(lf, [
		{f: 0, pos: [3.0, 1.55, 0.35], target: [-2.6, 1.4, 0], fov: 50},
		{f: 108, pos: [1.0, 1.5, 0.12], target: [-2.6, 1.45, 0], fov: 50},
	]);
	const cam = c.pos;
	const bump = easeOut(seg(lf, 54, 66)) * (1 - easeInOut(seg(lf, 86, 104)));
	const talk = lf < 58;
	const gesture = talk ? 0.35 + 0.25 * Math.sin(lf * 0.25) : 0.1;
	return (
		<>
			<CameraRig c={c} />
			<Atmos bg={CAVE_FOG} near={5} far={26} />
			<ShotLights
				lights={[
					{p: [0, 2.6, -3.1], c: '#ffaa55', i: 6},
					{p: [-6, 2.6, 3.1], c: '#ffaa55', i: 6},
					{p: [-0.8, 2.1, 0.4], c: '#ffd2a0', i: 3, d: 6},
					{p: [-5.5, 2.4, 0], c: '#ff8a3a', i: 3, d: 6},
				]}
			/>
			<Cave frame={lf + 90} />
			<Particles frame={lf + 90} center={[-2.6, 2, 0]} size={[4, 3.5, 6]} count={80} pointSize={0.04} opacity={0.5} />
			<Character2D
				who="main"
				view="front"
				position={[-2.6, 0, 0.62]}
				cam={cam}
				glow={0.4}
				pose={basePose({
					expr: lf > 60 ? 'joy' : 'happy',
					mouth: lf > 62 && lf < 90 ? 2 : 0,
					armR: 0.06 + bump * 1.0,
					armL: 0.08,
					bob: breathe(lf),
					blink: autoBlink(lf, 2),
				})}
			/>
			<Character2D
				who="friend"
				view="front"
				position={[-2.6, 0, -0.62]}
				cam={cam}
				glow={0.4}
				pose={basePose({
					expr: lf > 60 ? 'joy' : 'happy',
					mouth: talk ? talkMouth(lf, 1) : lf < 90 ? 2 : 0,
					armL: 0.06 + bump * 1.0,
					armR: gesture,
					bob: breathe(lf + 20),
					headTilt: talk ? Math.sin(lf * 0.12) * 0.05 : 0,
					blink: autoBlink(lf, 4),
				})}
			/>
			{lf >= 64 && lf < 84 ? (
				<Glow position={[-2.5, 1.3, 0]} size={0.4 + easeOut(seg(lf, 64, 74)) * 1.4} color="#fff1b0" opacity={1 - seg(lf, 66, 84)} />
			) : null}
		</>
	);
};

// ------------------------------------------------------------------ sh03 chamber reveal
const Sh03 = ({lf}: P) => {
	const c = camAt(lf, [
		{f: 0, pos: [28.9, 1.2, 2.6], target: [34.5, 7.4, -2.2], fov: 56},
		{f: 50, pos: [28.4, 2.1, 2.7], target: [33.6, 1.0, -1.2], fov: 54},
		{f: 78, pos: [28.7, 2.0, 2.5], target: [34.0, 0.95, -1.3], fov: 52},
	]);
	const cam = c.pos;
	const mx = 29.9 + 1.15 * (lf / 30);
	return (
		<>
			<CameraRig c={c} />
			<Atmos bg={CHAMBER_FOG} near={6} far={34} />
			<ShotLights
				hemi={0.5}
				sky="#4b5a8a"
				lights={[
					{p: [36, 6, -6], c: '#46e2ff', i: 5, d: 20},
					{p: [30, 3, -5.6], c: '#ffaa55', i: 5, d: 12},
					{p: [36, 8, -1.5], c: '#cfe8ff', i: 4, d: 12},
					{p: [32, 2.2, 3.5], c: '#ffcf96', i: 1.8, d: 8},
				]}
			/>
			<Cave frame={lf + 198} />
			<Chest position={CHEST_POS} open={0} glow={0} />
			<Glow position={[CHEST_POS[0] + 0.3, CHEST_POS[1] + 0.55, CHEST_POS[2] + 0.3]} size={0.5 + 0.25 * Math.sin(lf * 0.3)} color="#fff3b0" opacity={0.9} />
			<Particles frame={lf} center={[36, 4, -1.5]} size={[3, 8, 3]} count={120} color="#cfe8ff" pointSize={0.06} opacity={0.6} seed={3} />
			<Character2D
				who="main"
				view="side"
				position={[mx, 0, -0.3]}
				cam={cam}
				glow={0.42}
				pose={basePose({...cycle(lf, 0.9, 0.38), expr: 'amazed', mouth: 1, blink: autoBlink(lf, 1)})}
			/>
			<Character2D
				who="friend"
				view="side"
				position={[mx + 0.55, 0, 0.42]}
				cam={cam}
				glow={0.42}
				pose={basePose({...cycle(lf + 10, 0.9, 0.38), expr: 'amazed', mouth: 1, blink: autoBlink(lf, 5)})}
			/>
		</>
	);
};

// ------------------------------------------------------------------ sh04 chest opens
const Sh04 = ({lf}: P) => {
	const c = camAt(lf, [
		{f: 0, pos: [36.0, 0.95, 0.75], target: [36.0, 0.7, -1.5], fov: 42},
		{f: 32, pos: [36.0, 1.05, 0.35], target: [36.0, 0.8, -1.5], fov: 42},
		{f: 84, pos: [36.05, 1.95, 1.9], target: [36.05, 1.45, -2.4], fov: 46},
	]);
	const cam = c.pos;
	const open = easeOut(seg(lf, 4, 26));
	const glow = easeOut(seg(lf, 8, 30));
	const awe = lf > 12;
	return (
		<>
			<CameraRig c={c} />
			<Atmos bg={CHAMBER_FOG} near={5} far={30} />
			<ShotLights
				hemi={0.45}
				sky="#4b5a8a"
				lights={[
					{p: [36, 1.3, -1.3], c: '#ffc23a', i: 1 + glow * 10, d: 7},
					{p: [36, 6, -6], c: '#46e2ff', i: 4, d: 20},
					{p: [36, 8, -1.5], c: '#cfe8ff', i: 3, d: 12},
					{p: [36.5, 2, 1.5], c: '#ffcf96', i: 1.2, d: 6},
				]}
			/>
			<Cave frame={lf + 276} skyBeam={1 - glow * 0.5} />
			<Chest position={CHEST_POS} open={open} glow={glow} />
			<Particles frame={lf} center={[36, 1.6, -1.5]} size={[1.0, 2.4, 0.7]} count={70} color="#ffd75a" pointSize={0.05 * glow + 0.001} opacity={glow} rise={0.006} seed={9} />
			<Character2D
				who="main"
				view="front"
				position={[35.45, 0, -2.85]}
				cam={cam}
				glow={0.45}
				pose={basePose({expr: awe ? 'amazed' : 'neutral', mouth: awe ? 2 : 0, armL: awe ? 0.35 : 0.06, armR: awe ? 0.35 : 0.06, bob: breathe(lf)})}
			/>
			<Character2D
				who="friend"
				view="front"
				position={[36.65, 0, -2.85]}
				cam={cam}
				glow={0.45}
				pose={basePose({expr: awe ? 'amazed' : 'neutral', mouth: awe ? 1 : 0, look: lf > 50 ? -1 : 0, armL: awe ? 0.3 : 0.06, armR: awe ? 0.3 : 0.06, bob: breathe(lf + 13)})}
			/>
		</>
	);
};

// ------------------------------------------------------------------ sh05 "lengah" — friend grabs treasure
const Sh05 = ({lf}: P) => {
	const c = camAt(lf, [
		{f: 0, pos: [37.4, 1.75, 3.9], target: [37.1, 1.5, -0.4], fov: 50},
		{f: 78, pos: [36.7, 1.7, 4.3], target: [36.4, 1.35, -1.0], fov: 52},
	]);
	const cam = c.pos;
	const grab = easeInOut(seg(lf, 48, 62));
	const friendPos: V3 = [35.75, 0, -2.4];
	const chestCarry: V3 = [friendPos[0], 0.72, friendPos[2] + 0.32];
	const chestPos = lerp3(CHEST_POS, chestCarry, grab);
	chestPos[1] += Math.sin(grab * Math.PI) * 0.35;
	const turning = lf > 68;
	const gemPos: V3 = [36.9 + 0.84, 1.74 + Math.sin(lf * 0.1) * 0.03, 0.22];
	return (
		<>
			<CameraRig c={c} />
			<Atmos bg={CHAMBER_FOG} near={5} far={30} />
			<ShotLights
				hemi={0.45}
				sky="#4b5a8a"
				lights={[
					{p: [gemPos[0], gemPos[1], gemPos[2] + 0.4], c: '#46e8ff', i: 3, d: 4},
					{p: [chestPos[0], chestPos[1] + 0.8, chestPos[2] + 0.2], c: '#ffc23a', i: 7, d: 6},
					{p: [36, 6, -6], c: '#46e2ff', i: 3, d: 20},
					{p: [37.2, 2.4, 2.6], c: '#ffcf96', i: 1.3, d: 6},
				]}
			/>
			<Cave frame={lf + 360} skyBeam={0.5} />
			<Chest position={chestPos} open={1 - grab * 0.85} glow={1 - grab * 0.4} />
			<Gem position={gemPos} spin={lf * 0.08} />
			<Particles frame={lf} center={[36.4, 1.6, -1]} size={[4, 3, 3]} count={70} color="#ffd75a" pointSize={0.035} opacity={0.6} seed={4} />
			<Character2D
				who="main"
				view="side"
				facing={1}
				position={[36.9, 0, 0]}
				cam={cam}
				glow={0.45}
				pose={basePose({expr: 'joy', mouth: talkMouth(lf, 5) === 2 ? 1 : 0, armR: 1.72, armL: 0.15, bob: breathe(lf), headTilt: 0.06})}
			/>
			<Character2D
				who="friend"
				view={turning ? 'side' : 'front'}
				facing={-1}
				position={[friendPos[0] - (turning ? easeIn(seg(lf, 68, 78)) * 0.5 : 0), 0, friendPos[2]]}
				cam={cam}
				glow={0.42}
				pose={
					turning
						? basePose({...cycle(lf, 1.4, 0.6), expr: 'guilty', armR: 1.1, armL: 0.9})
						: basePose({
								expr: 'guilty',
								look: lf < 46 ? 1 : 0,
								armL: grab > 0 ? -0.25 * grab : 0.06,
								armR: grab > 0 ? -0.25 * grab : 0.06,
								bob: breathe(lf + 7),
								blink: autoBlink(lf, 6),
							})
				}
			/>
		</>
	);
};

// ------------------------------------------------------------------ sh06 shocked close-up
const Sh06 = ({lf}: P) => {
	let c = camAt(
		lf,
		[
			{f: 0, pos: [36.9, 1.62, 3.6], target: [36.9, 1.5, 0], fov: 46},
			{f: 9, pos: [36.9, 1.92, 1.35], target: [36.9, 1.9, 0], fov: 40, roll: 0.05},
			{f: 42, pos: [36.88, 1.95, 1.15], target: [36.9, 1.92, 0], fov: 40, roll: 0.07},
		],
		easeOut,
	);
	c = addShake(c, lf, 0.012);
	const cam = c.pos;
	const fx = 36.7 - lf * 0.06;
	return (
		<>
			<CameraRig c={c} />
			<Atmos bg={CHAMBER_FOG} near={4} far={28} />
			<ShotLights
				hemi={0.45}
				sky="#4b5a8a"
				lights={[
					{p: [36.9, 2.2, 1.4], c: '#e8f0ff', i: 2.4, d: 5},
					{p: [fx, 1.6, -3.2], c: '#ffc23a', i: 6, d: 6},
					{p: [36, 6, -6], c: '#46e2ff', i: 3, d: 20},
					{p: [38.5, 2.2, -1], c: '#5aa0ff', i: 1.5, d: 6},
				]}
			/>
			<Cave frame={lf + 438} skyBeam={0.5} />
			<Character2D
				who="main"
				view="front"
				position={[36.9, 0, 0]}
				cam={cam}
				glow={0.45}
				pose={basePose({expr: 'shocked', armL: 0.15 + easeOut(seg(lf, 0, 6)) * 0.5, armR: 0.15 + easeOut(seg(lf, 0, 6)) * 0.5, bob: easeOut(seg(lf, 0, 5)) * 0.04})}
			/>
			<Character2D
				who="friend"
				view="side"
				facing={-1}
				position={[fx, 0, -3.6]}
				cam={cam}
				glow={0.3}
				pose={basePose({...cycle(lf, 1.7, 0.8), expr: 'guilty', armR: 1.1, armL: 0.9})}
			/>
			<Chest position={[fx - 0.45, 0.72, -3.55]} open={0.15} glow={0.6} scale={0.85} />
		</>
	);
};

// ------------------------------------------------------------------ sh07 friend runs with treasure
const Sh07 = ({lf}: P) => {
	const fx = 21 - 3.6 * (lf / 30);
	let c = camAt(lf, [
		{f: 0, pos: [fx - 0.2, 1.35, 3.2], target: [fx - 0.5, 1.25, -1.4], fov: 54, roll: -0.03},
		{f: 54, pos: [fx - 0.6, 1.3, 3.2], target: [fx - 0.8, 1.25, -1.4], fov: 54, roll: -0.03},
	]);
	c = addShake(c, lf, 0.02);
	const cam = c.pos;
	const glance = lf > 14 && lf < 34;
	const run = cycle(lf, 1.7, 0.8);
	return (
		<>
			<CameraRig c={c} />
			<Atmos bg={CAVE_FOG} near={4} far={22} />
			<ShotLights
				lights={[
					{p: [18, 2.6, 3.1], c: '#ffaa55', i: 6},
					{p: [12, 2.6, -3.1], c: '#ffaa55', i: 6},
					{p: [24, 2.6, -3.1], c: '#ffaa55', i: 5},
					{p: [fx - 0.5, 1.6, -0.2], c: '#ffc23a', i: 4, d: 5},
				]}
			/>
			<Cave frame={lf + 480} />
			<Character2D
				who="friend"
				view="side"
				facing={-1}
				position={[fx, 0, -1.4]}
				cam={cam}
				glow={0.4}
				pose={basePose({...run, armR: 1.15, armL: 0.95, expr: glance ? 'sad' : 'guilty', headFlip: glance, lean: 0.12})}
			/>
			<Chest position={[fx - 0.5, 0.72 + run.bob, -1.3]} open={0.12} glow={0.6} scale={0.8} />
		</>
	);
};

// ------------------------------------------------------------------ sh08 main chases (toward camera)
const Sh08 = ({lf}: P) => {
	const mx = 5.5 - 3.4 * (lf / 30);
	let c = camAt(lf, [
		{f: 0, pos: [mx - 3.8, 1.35, -0.25], target: [mx, 1.35, -0.5], fov: 48},
		{f: 63, pos: [mx - 2.6, 1.45, -0.3], target: [mx, 1.45, -0.5], fov: 48},
	]);
	c = addShake(c, lf, 0.03);
	const cam = c.pos;
	const ph = Math.sin((lf / 30) * 1.8 * Math.PI * 2);
	return (
		<>
			<CameraRig c={c} />
			<Atmos bg={CAVE_FOG} near={4} far={22} />
			<ShotLights
				lights={[
					{p: [0, 2.6, -3.1], c: '#ffaa55', i: 6},
					{p: [6, 2.6, 3.1], c: '#ffaa55', i: 6},
					{p: [-6, 2.6, 3.1], c: '#ffaa55', i: 5},
					{p: [mx - 1.5, 2, 0], c: '#ffd2a0', i: 2, d: 5},
				]}
			/>
			<Cave frame={lf + 534} />
			<Particles frame={lf} center={[mx - 1, 1.8, -0.5]} size={[5, 3, 5]} count={80} pointSize={0.04} opacity={0.5} />
			<Character2D
				who="main"
				view="front"
				position={[mx, 0, -0.5]}
				cam={cam}
				glow={0.4}
				pose={basePose({
					expr: lf < 22 ? 'shocked' : 'determined',
					liftL: Math.max(0, ph),
					liftR: Math.max(0, -ph),
					armL: 0.3 + 0.25 * ph,
					armR: 0.3 - 0.25 * ph,
					bob: Math.abs(ph) * 0.07,
				})}
			/>
		</>
	);
};

// ------------------------------------------------------------------ sh09 the stone door slams
const Sh09 = ({lf}: P) => {
	const doorOpen = 1 - easeIn(seg(lf, 4, 39));
	const slam = lf >= 39 ? Math.max(0, 1 - (lf - 39) / 22) : 0;
	let c = camAt(lf, [
		{f: 0, pos: [-9.0, 1.7, 2.9], target: [-13.6, 1.9, -0.6], fov: 50},
		{f: 72, pos: [-9.7, 1.62, 2.55], target: [-13.6, 1.8, -0.6], fov: 48},
	]);
	c = addShake(c, lf, 0.015 + slam * 0.12);
	const cam = c.pos;
	const runT = easeOut(seg(lf, 0, 46));
	const mx = lerp(-8.6, -13.25, runT);
	const pounding = lf > 47;
	return (
		<>
			<CameraRig c={c} />
			<Atmos bg={CAVE_FOG} near={4} far={22} />
			<ShotLights
				lights={[
					{p: [-13.4, 2.2, 0], c: '#fff0cf', i: 12 * doorOpen + 0.5, d: 10},
					{p: [-12, 2.6, -3.1], c: '#ffaa55', i: 5},
					{p: [-6, 2.6, 3.1], c: '#ffaa55', i: 4},
					{p: [-11, 3, 1], c: '#6f8cff', i: 1.6, d: 8},
				]}
			/>
			<Cave frame={lf + 597} doorOpen={doorOpen} />
			{doorOpen > 0.05 ? (
				<Character2D
					who="friend"
					view="side"
					facing={-1}
					position={[-16 - lf * 0.08, 0, 0.6]}
					cam={cam}
					glow={0.05}
					shadow={false}
					pose={basePose({...cycle(lf, 1.7, 0.8), expr: 'guilty', armR: 1.1, armL: 0.9})}
				/>
			) : null}
			{slam > 0 ? (
				<Particles frame={lf} center={[-13.2, 0.6, 0]} size={[2.4, 1.2, 7]} count={160} color="#c8b9a6" pointSize={0.08} opacity={slam * 0.8} rise={0.004} seed={12} />
			) : null}
			<Character2D
				who="main"
				view="side"
				facing={-1}
				position={[mx, 0, -0.4]}
				cam={cam}
				glow={0.38}
				pose={
					pounding
						? basePose({expr: 'sad', mouth: 2, armR: 1.55 + 0.45 * Math.max(0, Math.sin(lf * 0.55)), armL: 1.2 + 0.4 * Math.max(0, Math.sin(lf * 0.55 + 2)), lean: 0.05})
						: basePose({...cycle(lf, 1.7 * (1 - runT * 0.6), 0.8 * (1 - runT * 0.5)), expr: 'shocked', lean: 0.1 * (1 - runT)})
				}
			/>
		</>
	);
};

// ------------------------------------------------------------------ sh10 the vow
const Sh10 = ({lf, len}: P) => {
	const t = easeInOut(lf / len);
	const ang = lerp(0.42, -0.12, t);
	const rad = lerp(4.3, 2.2, t);
	const center: V3 = [-12.9, 0, -0.2];
	const c: CamState = {
		pos: [center[0] + Math.cos(ang) * rad, lerp(0.75, 1.6, t), center[2] + Math.sin(ang) * rad],
		target: [center[0], lerp(1.55, 1.9, t), center[2]],
		fov: 42,
		roll: 0,
	};
	const cam = c.pos;
	const angry = lf > 36;
	const tremble = angry ? 0.03 * Math.sin(lf * 1.9) : 0;
	return (
		<>
			<CameraRig c={c} />
			<Atmos bg="#07060a" near={3} far={16} />
			<ShotLights
				hemi={0.3}
				sky="#38416a"
				lights={[
					{p: [-13.3, 0.2, 0], c: '#ffd9a0', i: 2.5, d: 4},
					{p: [-10.4, 3.2, 2.0], c: '#7d97ff', i: 3.4, d: 9},
					{p: [-12, 2.6, -3.1], c: '#ff9a45', i: 2.6 * (1 + 0.15 * Math.sin(lf * 0.7)), d: 8},
					{p: [-13.7, 2.4, 1.6], c: '#ff4a3a', i: 1.8, d: 5},
				]}
			/>
			<Cave frame={lf + 669} doorOpen={0} />
			<Particles frame={lf} center={[-12.6, 2, -0.2]} size={[3, 4, 4]} count={90} color="#d8c8b0" pointSize={0.035} opacity={0.6} speed={-0.0025} seed={21} />
			<Character2D
				who="main"
				view="front"
				position={center}
				cam={cam}
				glow={0.32}
				pose={basePose({
					expr: lf < 36 ? 'sad' : lf < 96 ? 'angry' : 'determined',
					look: lf < 36 ? -1 : 0,
					armL: 0.12 + tremble,
					armR: 0.12 - tremble,
					bob: breathe(lf) * 2,
					headTilt: lf < 36 ? 0.08 : tremble * 0.3,
					blink: lf < 36 && autoBlink(lf, 2),
				})}
			/>
		</>
	);
};

// ------------------------------------------------------------------ sh11 bedroom, 3 days later
const Sh11 = ({lf}: P) => {
	const c = camAt(lf, [
		{f: 0, pos: [-0.6, 2.1, 2.2], target: [-1.4, 1.95, -3.0], fov: 54},
		{f: 52, pos: [0.45, 1.45, 2.85], target: [0.4, 0.95, -1.0], fov: 54},
		{f: 132, pos: [0.5, 1.45, 2.1], target: [0.45, 1.0, -1.0], fov: 50},
	]);
	const cam = c.pos;
	const lit = lf >= 87;
	const buzz = lf >= 87 && lf < 112 ? Math.sin(lf * 3.1) * 0.012 : 0;
	const pick = easeInOut(seg(lf, 108, 126));
	const phonePos = lerp3([1.2 + buzz, 0.585, -1.15], [0.45, 1.05, -0.6], pick);
	const phoneRot: V3 = [lerp(-Math.PI / 2, 0.3, pick), lerp(0.2, Math.PI, pick), 0];
	return (
		<>
			<CameraRig c={c} />
			<Atmos bg="#0b0e20" near={6} far={18} />
			<ShotLights
				hemi={0.45}
				sky="#4a5590"
				ground="#1e1a26"
				lights={[
					{p: [-1.4, 2.2, -2.3], c: '#8fb0ff', i: 3.8, d: 8},
					{p: [2.3, 1.2, -1.0], c: '#ffb46a', i: 2.4, d: 6},
					{p: [0, 2.8, 1.5], c: '#7a6ab0', i: 1.2, d: 6},
					{p: [phonePos[0], phonePos[1] + 0.25, phonePos[2] + 0.1], c: '#cfe0ff', i: lit ? 2.6 : 0, d: 3},
				]}
			/>
			<Bedroom />
			<Phone position={phonePos} rotation={phoneRot} mode={lit ? 'notif' : 'off'} step={Math.min(5, lf - 87)} />
			<Character2D
				who="main"
				view="front"
				position={[0.1, 0, -0.85]}
				cam={cam}
				glow={0.32}
				pose={basePose({
					sit: true,
					expr: lf > 92 && lf < 110 ? 'neutral' : 'sad',
					look: lf > 92 && lf < 116 ? 1 : 0,
					armR: lf > 104 ? -0.35 * pick + 0.06 : 0.06,
					armL: 0.06,
					bob: breathe(lf) * 1.5,
					headTilt: lf < 92 ? 0.1 : 0.02,
					blink: autoBlink(lf, 3),
				})}
			/>
		</>
	);
};

// ------------------------------------------------------------------ sh12 / sh13 phone POV
const PhonePOV = ({lf, mode, push}: P & {mode: 'notif' | 'chat'; push: [V3, V3]}) => {
	const t = easeInOut(lf / 90);
	const c: CamState = {pos: lerp3(push[0], push[1], t), target: [0.3, mode === 'chat' ? 1.31 : 1.27, -0.5], fov: 40, roll: 0};
	const tremble = mode === 'chat' ? 0.006 + 0.01 * seg(lf, 10, 80) : 0.004;
	return (
		<>
			<CameraRig c={c} />
			<Atmos bg="#0b0e20" near={3} far={14} />
			<ShotLights
				hemi={0.4}
				sky="#4a5590"
				ground="#1e1a26"
				lights={[
					{p: [-1.4, 2.2, -2.3], c: '#8fb0ff', i: 3, d: 8},
					{p: [0.3, 1.5, 0.1], c: '#cfe0ff', i: 1.2, d: 3},
					{p: [2.3, 1.2, -1.0], c: '#ffb46a', i: 2, d: 6},
				]}
			/>
			<Bedroom />
			<Phone
				position={[0.3 + wobble(lf, 1) * tremble, 1.25 + wobble(lf, 2) * tremble, -0.5]}
				rotation={[-0.32 + wobble(lf, 3) * tremble * 2, 0, wobble(lf, 4) * tremble * 3]}
				mode={mode}
				step={mode === 'chat' ? Math.min(5, lf) : 5}
				hands
			/>
		</>
	);
};

// ------------------------------------------------------------------ sh14 devastated face
const Sh14 = ({lf}: P) => {
	const c = camAt(lf, [
		{f: 0, pos: [0.13, 1.56, 1.1], target: [0.1, 1.5, -0.85], fov: 40},
		{f: 62, pos: [0.1, 1.6, 0.38], target: [0.1, 1.58, -0.85], fov: 38},
	]);
	const cam = c.pos;
	const tear = seg(lf, 6, 56);
	return (
		<>
			<CameraRig c={c} />
			<Atmos bg="#0b0e20" near={3} far={14} />
			<ShotLights
				hemi={0.35}
				sky="#4a5590"
				ground="#1e1a26"
				lights={[
					{p: [0.1, 1.45, -0.45], c: '#cfe0ff', i: 2.0, d: 3},
					{p: [-1.4, 2.2, -2.3], c: '#8fb0ff', i: 3.2, d: 8},
					{p: [2.3, 1.2, -1.0], c: '#ffb46a', i: 1.6, d: 6},
				]}
			/>
			<Bedroom />
			<Character2D
				who="main"
				view="front"
				position={[0.1, 0, -0.85]}
				cam={cam}
				glow={0.3}
				pose={basePose({sit: true, expr: 'devastated', mouth: lf % 24 < 12 ? 1 : 0, armR: -0.3, armL: -0.3, bob: breathe(lf) * 2})}
			/>
			<Phone position={[0.1, 1.02, -0.6]} rotation={[0.25, Math.PI, 0]} mode="chat" step={5} />
			{/* tear */}
			<mesh position={[0.1 - 0.105, 1.5 - tear * 0.22, -0.82]} scale={[1, 1 + tear * 0.3, 1]}>
				<circleGeometry args={[0.018, 12]} />
				<meshBasicMaterial color="#9fd8ff" transparent opacity={0.9 * (1 - seg(lf, 52, 60))} />
			</mesh>
		</>
	);
};

export const ShotView = ({id, lf, len}: {id: ShotId; lf: number; len: number}) => {
	switch (id) {
		case 'sh01':
			return <Sh01 lf={lf} len={len} />;
		case 'sh02':
			return <Sh02 lf={lf} len={len} />;
		case 'sh03':
			return <Sh03 lf={lf} len={len} />;
		case 'sh04':
			return <Sh04 lf={lf} len={len} />;
		case 'sh05':
			return <Sh05 lf={lf} len={len} />;
		case 'sh06':
			return <Sh06 lf={lf} len={len} />;
		case 'sh07':
			return <Sh07 lf={lf} len={len} />;
		case 'sh08':
			return <Sh08 lf={lf} len={len} />;
		case 'sh09':
			return <Sh09 lf={lf} len={len} />;
		case 'sh10':
			return <Sh10 lf={lf} len={len} />;
		case 'sh11':
			return <Sh11 lf={lf} len={len} />;
		case 'sh12':
			return <PhonePOV lf={lf} len={len} mode="notif" push={[[0.3, 1.47, 0.2], [0.3, 1.42, 0.02]]} />;
		case 'sh13':
			return <PhonePOV lf={lf} len={len} mode="chat" push={[[0.3, 1.45, 0.1], [0.3, 1.42, -0.06]]} />;
		case 'sh14':
			return <Sh14 lf={lf} len={len} />;
	}
};
