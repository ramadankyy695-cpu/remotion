import React, {useMemo} from 'react';
import {useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {add3, dist, path1, path3, shake, talk, tw} from '../anim';
import {Character, FRIEND_DIMAS, RAKA} from '../three/Character';
import {City, Dust, Glow, LightCone, Rain, Room, SpotAt, WindowUnit} from '../three/env';
import type {Face, Pose} from '../three/pose';
import {blinkAt, breathe, mixPose, NEUTRAL_FACE, SIT, STAND, walkPose} from '../three/pose';
import type {V3} from '../three/Stage';
import {Cam, Stage} from '../three/Stage';

const skyTex = (stops: [number, string][]) => {
	const c = document.createElement('canvas');
	c.width = 4;
	c.height = 256;
	const g = c.getContext('2d')!;
	const gr = g.createLinearGradient(0, 0, 0, 256);
	for (const [o, col] of stops) gr.addColorStop(o, col);
	g.fillStyle = gr;
	g.fillRect(0, 0, 4, 256);
	const t = new THREE.CanvasTexture(c);
	t.colorSpace = THREE.SRGBColorSpace;
	return t;
};

const WIN = {x: 0, y: 1.45, w: 2.2, h: 1.8};

export const WindowSet: React.FC<{t: number; dawn: number; rain: number}> = ({t, dawn, rain}) => {
	const night = useMemo(() => skyTex([[0, '#070b16'], [0.6, '#111b30'], [1, '#1b2740']]), []);
	const day = useMemo(() => skyTex([[0, '#2c3a63'], [0.35, '#7d6a8c'], [0.62, '#f09a6a'], [0.8, '#ffc98a'], [1, '#ffe2b0']]), []);
	return (
		<group>
			<Room w={5.2} d={5} h={2.8} wall="#353b48" floor="#4d3a2c" win={WIN} />
			<WindowUnit x={WIN.x} y={WIN.y} z={-2.5} w={WIN.w} h={WIN.h} t={t} />
			{rain > 0.02 ? <Rain t={t} center={[0, 1.5, -3.8]} size={[4, 4, 2]} count={420} opacity={0.38 * rain} /> : null}
			<City center={[0, -12, -36]} spread={[70, 14]} count={34} brightness={0.85 * (1 - dawn * 0.6)} seed={61} />
			<mesh position={[0, 10, -60]}>
				<planeGeometry args={[170, 70]} />
				<meshBasicMaterial map={night} fog={false} />
			</mesh>
			<mesh position={[0, 10, -59.9]}>
				<planeGeometry args={[170, 70]} />
				<meshBasicMaterial map={day} fog={false} transparent opacity={dawn} />
			</mesh>
			<Glow position={[6, -1.5, -55]} size={40} color="#ffb070" opacity={dawn * 0.9} />
			{/* moonlight / dawn light through the window */}
			<directionalLight
				position={[-1.2, 4.2, -7]}
				intensity={1.3 + dawn * 1.8}
				color={new THREE.Color('#86a6d8').lerp(new THREE.Color('#ffb877'), dawn)}
				castShadow
				shadow-mapSize={[1024, 1024]}
				shadow-camera-left={-4}
				shadow-camera-right={4}
				shadow-camera-top={4}
				shadow-camera-bottom={-4}
				shadow-bias={-0.0015}
			/>
			<LightCone
				from={[-0.8, 3.4, -5.2]}
				to={[0.4, 0, 0.8]}
				radius={2.0}
				color={new THREE.Color('#8fb2ff').lerp(new THREE.Color('#ffc58a'), dawn).getStyle()}
				intensity={0.1 + dawn * 0.08}
			/>
			<Dust t={t} center={[0, 1.2, -1.2]} size={[2.6, 2, 2.4]} color={dawn > 0.5 ? '#ffe0b0' : '#c6d8ff'} opacity={0.45 + dawn * 0.25} />
			<ambientLight intensity={0.1 + dawn * 0.12} color={dawn > 0.5 ? '#ffd9b5' : '#9fb3d6'} />
			<hemisphereLight args={['#5f7396', '#20150e', 0.25 + dawn * 0.2]} />
			{/* doorway light on the right wall side */}
			<mesh position={[2.55, 1.05, 0.9]} rotation={[0, -Math.PI / 2, 0]}>
				<planeGeometry args={[0.9, 2.1]} />
				<meshBasicMaterial color="#ffcf98" />
			</mesh>
			<pointLight position={[2.2, 1.8, 0.9]} intensity={2.2} distance={5} color="#ffb877" />
			{/* shelf + plant */}
			<group position={[1.9, 0, -2.2]}>
				<mesh position={[0, 0.5, 0]} castShadow><boxGeometry args={[0.8, 1.0, 0.35]} /><meshStandardMaterial color="#3a2a20" roughness={0.6} /></mesh>
				<mesh position={[0.15, 1.15, 0]} castShadow><cylinderGeometry args={[0.1, 0.08, 0.2, 16]} /><meshStandardMaterial color="#b46a45" /></mesh>
				{[0, 1, 2, 3, 4].map((i) => (
					<mesh key={i} position={[0.15 + Math.sin(i * 1.3) * 0.08, 1.35 + (i % 2) * 0.08, Math.cos(i * 1.3) * 0.08]} castShadow>
						<sphereGeometry args={[0.1, 10, 8]} />
						<meshStandardMaterial color="#2f5a35" roughness={0.8} />
					</mesh>
				))}
			</group>
		</group>
	);
};

// ------------- shared characters -------------
const RAKA_STAND: Pose = {...STAND, x: 0.22, z: -1.55, rotY: Math.PI, spineX: 0.04, headX: 0.1, lShX: -0.3, lShZ: -0.05, lEl: -1.25, rShX: -0.3, rShZ: 0.05, rEl: -1.25};
const DIMAS_STOP: V3 = [0.85, 0, -1.2];

// ---------------- Scene 7: someone finally asks (38.13s - 43.4s) ----------------
const windowCast = (abs: number) => {
	// Raka by the window
	const turn = tw(abs, 41.15, 41.75);
	let raka: Pose = breathe(RAKA_STAND, abs, 1);
	raka = mixPose(raka, {...raka, headY: -0.75, spineY: -0.15}, turn);
	const answer = tw(abs, 42.0, 42.4);
	raka = mixPose(raka, {...raka, headY: -0.45, headX: 0.15}, answer);
	// Dimas walks in, stops, hand on shoulder
	const walkT = Math.min(1, Math.max(0, (abs - 38.5) / 1.8));
	const start: V3 = [2.3, 0, 0.6];
	const k = 1 - Math.pow(1 - walkT, 1.6);
	const dx = start[0] + (DIMAS_STOP[0] - start[0]) * k;
	const dz = start[2] + (DIMAS_STOP[2] - start[2]) * k;
	const heading = Math.atan2(DIMAS_STOP[0] - start[0], DIMAS_STOP[2] - start[2]);
	const walking = walkT < 1;
	let dimas: Pose = walking
		? walkPose((abs - 38.5) * 5.2, 1 - walkT * 0.5)
		: breathe({...STAND}, abs, 1);
	const faceTurn = tw(abs, 40.0, 40.5);
	const rot = heading + (-2.05 - heading) * faceTurn;
	dimas = {...dimas, x: dx, z: dz, rotY: rot};
	const reach = tw(abs, 40.2, 40.6);
	dimas = mixPose(dimas, {...dimas, rShX: -1.2, rShZ: 0.12, rEl: -0.35, headX: 0.12, headY: 0.05}, reach);
	const dimasFace: Face = {...NEUTRAL_FACE, brow: 0.55, smile: -0.05, mouthOpen: abs > 40.7 && abs < 41.25 ? talk(abs, 1.2) : 0, blink: blinkAt(abs, 8)};
	return {raka, dimas, dimasFace, turn};
};

export const Scene7: React.FC = () => {
	const t = useCurrentFrame() / 30;
	const abs = t + 38.13;
	const {raka, dimas, dimasFace, turn} = windowCast(abs);
	const rakaFace: Face = {
		...NEUTRAL_FACE,
		smile: -0.35,
		brow: 0.7,
		blink: blinkAt(abs, 3),
		lookX: turn * 0.6,
		lookY: abs > 42.0 ? -0.5 : 0,
	};
	let cam: V3;
	let target: V3;
	let focus: V3;
	let fov = 34;
	if (abs < 40.0) {
		cam = path3(abs, [[38.13, [-0.75, 1.6, 1.6]], [40.0, [-0.5, 1.55, 1.1]]]);
		target = [0.25, 1.4, -2.2];
		focus = [0.22, 1.4, -1.55];
	} else if (abs < 41.85) {
		cam = path3(abs, [[40.0, [-1.2, 1.52, -0.55]], [41.85, [-1.05, 1.5, -0.7]]]);
		target = [0.55, 1.45, -1.4];
		focus = [0.85, 1.6, -1.2];
		fov = 44;
	} else {
		cam = path3(abs, [[41.85, [0.62, 1.62, -2.33]], [43.4, [0.56, 1.6, -2.3]]]);
		target = [0.26, 1.56, -1.55];
		focus = [0.22, 1.62, -1.5];
		fov = 32;
	}
	cam = add3(cam, shake(abs, 0.006));
	return (
		<Stage background="#0a0f1a" fog={['#0a0f1a', 9, 70]} focus={dist(cam, focus)} aperture={0.016} maxblur={0.012}>
			<Cam pos={cam} target={target} fov={fov} />
			<WindowSet t={abs} dawn={0} rain={1} />
			<SpotAt position={[-0.6, 1.9, -2.35]} target={[0.22, 1.5, -1.55]} color="#9cbcff" intensity={8} angle={0.5} />
			<SpotAt position={[1.8, 1.7, 0.6]} target={[0.4, 1.4, -1.5]} color="#ffbf85" intensity={5} angle={0.5} />
			<Character pose={raka} face={rakaFace} look={RAKA} />
			{abs > 38.5 ? <Character pose={dimas} face={dimasFace} look={FRIEND_DIMAS} /> : null}
		</Stage>
	);
};

// ---------------- Scene 8 + 9: "Ga apa-apa", then finally heard (43.33s - 52.5s) ----------------
export const Scene89: React.FC<{start?: number; mode?: 'close' | 'wide' | 'auto'}> = ({start = 43.33, mode = 'auto'}) => {
	const t = useCurrentFrame() / 30;
	const abs = t + start;
	const toWide = mode === 'wide' || (mode === 'auto' && abs >= 46.9);
	const dawn = tw(abs, 47.4, 51.2);
	const rain = 1 - tw(abs, 47.0, 50.5);

	if (!toWide) {
		const {raka, dimas, dimasFace} = windowCast(43.3);
		const forced = tw(abs, 43.35, 43.6) * (1 - tw(abs, 44.6, 45.6));
		const nod = abs > 43.45 && abs < 44.1 ? Math.sin((abs - 43.45) * 12) * 0.08 : 0;
		const down = tw(abs, 45.4, 46.3);
		const r = mixPose({...raka, headY: -0.35 + 0.15 * forced, headX: 0.05 + nod}, {...raka, headY: -0.1, headX: 0.42, neckX: 0.1}, down);
		const face: Face = {
			...NEUTRAL_FACE,
			smile: 0.5 * forced - 0.5 * (1 - forced),
			brow: 0.55 + 0.4 * (1 - forced),
			mouthOpen: abs > 43.45 && abs < 43.95 ? talk(abs, 0.8) : 0,
			blink: blinkAt(abs, 5) + down * 0.35,
			lookX: 0.4 * (1 - down),
			lookY: -0.2 - down * 0.6,
		};
		const cam = add3(path3(abs, [[43.33, [0.58, 1.62, -2.32]], [46.9, [0.48, 1.6, -2.38]]]), shake(abs, 0.004));
		const target: V3 = [0.25, 1.57, -1.55];
		return (
			<Stage background="#0a0f1a" fog={['#0a0f1a', 9, 70]} focus={dist(cam, [0.22, 1.62, -1.5])} aperture={0.03} maxblur={0.014}>
				<Cam pos={cam} target={target} fov={path1(abs, [[43.33, 32], [46.9, 27]])} />
				<WindowSet t={abs} dawn={0} rain={1} />
				<SpotAt position={[-0.6, 1.9, -2.35]} target={[0.22, 1.5, -1.55]} color="#9cbcff" intensity={8} angle={0.5} />
				<SpotAt position={[1.8, 1.7, 0.6]} target={[0.4, 1.4, -1.5]} color="#ffbf85" intensity={5} angle={0.5} />
				<Character pose={r} face={face} look={RAKA} tears={0.5 + down * 0.5} />
				<Character pose={dimas} face={{...dimasFace, mouthOpen: 0}} look={FRIEND_DIMAS} />
			</Stage>
		);
	}

	// Wide: sitting together on the floor under the window; Raka finally talks, Dimas listens.
	const speak = abs > 47.6 ? 1 : 0;
	const gesture = Math.sin(abs * 1.7) * 0.5 + 0.5;
	const FLOOR: Pose = {...SIT, y: -0.8, spineX: -0.05, lHipX: -1.25, rHipX: -1.55, lKnee: 2.1, rKnee: 0.9, lAnk: 0.3, rAnk: 0.2};
	let raka: Pose = {...FLOOR, x: -0.3, z: -2.12, rotY: 0.18, spineX: 0.1, headX: 0.22, lShX: -0.75, lEl: -0.9, rShX: -0.5, rEl: -1.1, rShZ: 0.05};
	raka = mixPose(raka, {...raka, rShX: -0.85, rEl: -1.55 - gesture * 0.3, rShZ: -0.1, headX: 0.05, headY: 0.32, spineX: 0.02}, tw(abs, 47.8, 48.6) * speak);
	raka = breathe(raka, abs, 1.2);
	let dimas: Pose = {...FLOOR, x: 0.33, z: -2.12, rotY: -0.25, lHipX: -1.5, rHipX: -1.2, lKnee: 1.0, rKnee: 2.0, headX: 0.1, headY: -0.45, lShX: -0.3, lEl: -0.6, rShX: -0.6, rEl: -1.0};
	// arm around Raka's shoulder
	dimas = mixPose(dimas, {...dimas, rShX: -0.25, rShZ: -1.25, rEl: -0.5, rShY: 0.2}, tw(abs, 47.2, 48.0));
	const nod = Math.sin(abs * 3.1) * 0.05 * tw(abs, 48.4, 48.8);
	dimas = breathe({...dimas, headX: dimas.headX + nod}, abs + 1, 1);
	const rakaFace: Face = {...NEUTRAL_FACE, smile: -0.2 + dawn * 0.45, brow: 0.6 - dawn * 0.35, mouthOpen: talk(abs, speak * 0.9), blink: blinkAt(abs, 2), lookX: -0.6, lookY: -0.1};
	const dimasFace: Face = {...NEUTRAL_FACE, smile: 0.15 + dawn * 0.25, brow: 0.35, blink: blinkAt(abs, 7), lookX: 0.6, lookY: -0.1};
	const cam = add3(
		path3(abs, [[46.9, [0.1, 0.85, -0.05]], [49.3, [0.06, 0.92, 0.35]], [52.6, [0.45, 1.75, 1.7]]]),
		shake(abs, 0.005),
	);
	const target = path3(abs, [[46.9, [0.02, 0.72, -2.1]], [49.3, [0.02, 0.85, -2.1]], [52.6, [0.0, 1.25, -2.3]]]);
	return (
		<Stage background="#0a0f1a" fog={['#0a0f1a', 9, 70]} focus={dist(cam, [0.0, 0.8, -2.05])} aperture={0.01} maxblur={0.01} exposure={1.25 + dawn * 0.15}>
			<Cam pos={cam} target={target} fov={path1(abs, [[46.9, 50], [49.3, 46], [52.6, 50]])} />
			<WindowSet t={abs} dawn={dawn} rain={rain} />
			<SpotAt position={[0.0, 2.2, -1.0]} target={[0.0, 0.7, -2.1]} color={new THREE.Color('#9cbcff').lerp(new THREE.Color('#ffc590'), dawn).getStyle()} intensity={5 + dawn * 7} angle={0.6} shadow />
			<SpotAt position={[1.6, 1.4, 0.8]} target={[0, 0.8, -2.1]} color="#ffbf85" intensity={3 + dawn * 2} angle={0.45} />
			<SpotAt position={[0, 1.6, -2.9]} target={[0, 0.9, -2.0]} color="#ffb070" intensity={dawn * 14} angle={0.7} />
			<Character pose={raka} face={rakaFace} look={RAKA} />
			<Character pose={dimas} face={dimasFace} look={FRIEND_DIMAS} />
		</Stage>
	);
};
