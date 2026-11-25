import React, {useMemo} from 'react';
import {useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {dist, path1, path3, shake, add3, tw} from '../anim';
import {Character} from '../three/Character';
import {Bed, Chair, City, Dust, Glow, LightCone, Nightstand, Phone, Rain, Room, SpotAt, WindowUnit} from '../three/env';
import {lerp3} from '../anim';
import type {Face, Pose} from '../three/pose';
import {blinkAt, breathe, mixFace, mixPose, NEUTRAL_FACE, SIT_SLUMP} from '../three/pose';
import type {V3} from '../three/Stage';
import {Cam, Stage} from '../three/Stage';

const CHAR_POS: V3 = [0, 0, -0.6];

export const SEATED: Pose = {
	...SIT_SLUMP,
	x: CHAR_POS[0],
	z: CHAR_POS[2],
	y: -0.36,
	lHipX: -1.32,
	rHipX: -1.32,
	lKnee: 1.22,
	rKnee: 1.22,
	lAnk: 0.12,
	rAnk: 0.12,
};

// Holding the phone with both hands in front of the chest, looking at it.
export const PHONE_HOLD: Pose = {
	...SEATED,
	spineX: 0.32,
	neckX: 0.2,
	headX: 0.42,
	rShX: -0.62,
	rShY: 0.25,
	rShZ: 0.05,
	rEl: -1.75,
	rWr: -0.2,
	lShX: -0.62,
	lShY: -0.25,
	lShZ: -0.05,
	lEl: -1.75,
	lWr: -0.2,
};

const SAD: Face = {...NEUTRAL_FACE, smile: -0.45, brow: 0.8, lookY: -0.6};

export const PhoneInHand: React.FC<{typed: string; cursor: boolean; on: number}> = ({typed, cursor, on}) => (
	<group position={[0.065, -0.075, 0.03]} rotation={[-1.25, 0.0, 0.05]}>
		<Phone typed={typed} cursor={cursor} screenOn={on} />
	</group>
);

export const BedroomSet: React.FC<{t: number; lamp: number}> = ({t, lamp}) => {
	const flick = 0.94 + 0.06 * Math.sin(t * 13.1) * Math.sin(t * 4.7);
	const rug = useMemo(() => new THREE.MeshStandardMaterial({color: '#4a3436', roughness: 1}), []);
	return (
		<group>
			<Room w={4.4} d={4.6} h={2.8} wall="#3d4352" floor="#6b4a33" win={{x: -0.3, y: 1.6, w: 1.4, h: 1.2}} />
			<WindowUnit x={-0.3} y={1.6} z={-2.3} w={1.4} h={1.2} t={t} />
			{/* outside world */}
			<Rain t={t} center={[-0.3, 1.6, -3.4]} size={[3.5, 4, 1.6]} count={380} opacity={0.35} />
			<City center={[0, -10, -38]} spread={[70, 16]} count={34} brightness={0.75} />
			<mesh position={[0, 12, -60]}>
				<planeGeometry args={[160, 60]} />
				<meshBasicMaterial color="#121c2e" fog={false} />
			</mesh>
			<directionalLight
				position={[-1.6, 4.8, -6.5]}
				intensity={1.5}
				color="#86a6d8"
				castShadow
				shadow-mapSize={[1024, 1024]}
				shadow-camera-left={-4}
				shadow-camera-right={4}
				shadow-camera-top={4}
				shadow-camera-bottom={-4}
				shadow-bias={-0.0015}
			/>
			<LightCone from={[-1.1, 3.6, -4.8]} to={[0.6, 0, 0.6]} radius={1.7} color="#8fb2ff" intensity={0.11} />
			<Dust t={t} center={[0, 1.1, -1.2]} size={[2.6, 2.0, 2.2]} color="#c6d8ff" opacity={0.5} />
			<ambientLight intensity={0.12} color="#9fb3d6" />
			{/* key: warm bounce from the lamp side, rim: cool window light */}
			<SpotAt position={[-1.5, 1.7, 0.9]} target={[0, 1.0, -0.5]} color="#ffb877" intensity={9 * lamp} angle={0.55} shadow />
			<SpotAt position={[1.1, 2.3, -2.0]} target={[0, 1.1, -0.5]} color="#8fb4ff" intensity={14} angle={0.5} />
			<SpotAt position={[0.6, 1.2, 2.5]} target={[0, 1.0, -0.5]} color="#6f86b0" intensity={2.2} angle={0.6} />
			<hemisphereLight args={['#5f7396', '#20150e', 0.25]} />
			<Bed position={[-0.6, 0, -1.43]} rotY={Math.PI / 2} />
			<Nightstand position={[-1.85, 0, -1.95]} lampOn={lamp * flick} />
			{/* desk corner on the right */}
			<group position={[1.65, 0, -1.6]}>
				<mesh position={[0, 0.74, 0]} castShadow receiveShadow>
					<boxGeometry args={[0.7, 0.04, 1.2]} />
					<meshStandardMaterial color="#3e2c20" roughness={0.6} />
				</mesh>
				{[[-0.3, -0.55], [0.3, -0.55], [-0.3, 0.55], [0.3, 0.55]].map(([x, z], i) => (
					<mesh key={i} position={[x, 0.37, z]} castShadow>
						<boxGeometry args={[0.04, 0.74, 0.04]} />
						<meshStandardMaterial color="#2a1e16" />
					</mesh>
				))}
				<mesh position={[0, 0.77, 0.1]} rotation={[0, 0.3, 0]} castShadow>
					<boxGeometry args={[0.3, 0.02, 0.22]} />
					<meshStandardMaterial color="#8d9198" metalness={0.6} roughness={0.35} />
				</mesh>
				{[0, 1, 2, 3, 4].map((i) => (
					<mesh key={i} position={[0.1, 0.86, -0.45 + i * 0.05]} rotation={[0, 0, 0.04 * i]} castShadow>
						<boxGeometry args={[0.16, 0.22, 0.04]} />
						<meshStandardMaterial color={['#6b3b32', '#2e4a5c', '#857245', '#3d3d3d', '#5b6d4c'][i]} roughness={0.8} />
					</mesh>
				))}
			</group>
			<Chair position={[1.15, 0, -1.4]} rotY={Math.PI / 2 + 0.3} color="#2f241d" />
			{/* poster frames */}
			<mesh position={[1.25, 1.75, -2.24]}>
				<boxGeometry args={[0.6, 0.8, 0.02]} />
				<meshStandardMaterial color="#1c1f26" roughness={0.5} />
			</mesh>
			<mesh position={[1.25, 1.75, -2.225]}>
				<planeGeometry args={[0.5, 0.7]} />
				<meshStandardMaterial color="#5b6f78" roughness={0.9} />
			</mesh>
			<mesh position={[0.2, 0.006, 0.4]} rotation={[-Math.PI / 2, 0, 0]} material={rug} receiveShadow>
				<circleGeometry args={[1.0, 40]} />
			</mesh>
			<Glow position={[-0.3, 1.6, -2.4]} size={2.4} color="#5d7fb8" opacity={0.25} />
		</group>
	);
};

// ---------------- Scene 1: alone in the dim room (0.0s - 7.0s) ----------------
export const Scene1: React.FC = () => {
	const t = useCurrentFrame() / 30;
	const lift = tw(t, 3.0, 4.2) * (1 - tw(t, 5.0, 6.0));
	const sigh = Math.sin(Math.max(0, Math.min(1, (t - 4.1) / 1.2)) * Math.PI);
	let pose = mixPose(SEATED, {...SEATED, spineX: 0.25, neckX: 0.0, headX: -0.12, headY: 0.18}, lift);
	pose = mixPose(pose, {...pose, headX: 0.5, rShX: -0.85, rEl: -1.5}, tw(t, 5.2, 6.3));
	pose = {...pose, lShZ: pose.lShZ + sigh * 0.06, rShZ: pose.rShZ - sigh * 0.06, spineX: pose.spineX - sigh * 0.05};
	pose = breathe(pose, t, 1.2);
	const face = mixFace(SAD, {...SAD, lookY: 0.4, lookX: -0.2, brow: 0.6}, lift);
	face.blink = Math.max(blinkAt(t), sigh * 0.55);
	const phoneOn = tw(t, 5.0, 5.4);
	const camPos = add3(path3(t, [[0, [1.75, 2.25, 3.3]], [7.2, [0.6, 1.32, 1.45]]]), shake(t, 0.008));
	const target = path3(t, [[0, [-0.35, 0.85, -0.9]], [7.2, [-0.02, 0.98, -0.62]]]);
	return (
		<Stage background="#0b1220" fog={['#0b1220', 9, 70]} focus={dist(camPos, [0, 0.95, -0.6])} aperture={0.012} maxblur={0.012}>
			<Cam pos={camPos} target={target} fov={path1(t, [[0, 36], [7, 31]])} />
			<BedroomSet t={t} lamp={1} />
			<Character pose={pose} face={face} rightHand={<PhoneInHand typed="" cursor={false} on={phoneOn} />} />
		</Stage>
	);
};

// ---------------- Scene 2: typing, then deleting (starts 6.6s) ----------------
const MSG = 'Bro, gue lagi ngerasa capek banget...';

export const Scene2: React.FC = () => {
	const t = useCurrentFrame() / 30; // local
	const abs = t + 6.6;
	// typing 6.9 -> 9.3, pause, delete 12.2 -> 13.6
	const typedN = Math.floor(Math.min(1, Math.max(0, (abs - 6.9) / 2.4)) * MSG.length);
	const delN = Math.floor(Math.min(1, Math.max(0, (abs - 12.2) / 1.4)) * MSG.length);
	const typed = MSG.slice(0, Math.max(0, typedN - delN));
	const cursor = Math.floor(abs * 2.2) % 2 === 0 || (abs > 6.9 && abs < 9.3) || (abs > 12.2 && abs < 13.6);
	const screen = 1 - tw(abs, 13.9, 14.15) * 0.92;
	const typing = (abs > 6.9 && abs < 9.3) || (abs > 12.2 && abs < 13.6) ? 1 : 0;
	const tap = Math.sin(abs * 26) * 0.05 * typing;

	let pose: Pose = {...PHONE_HOLD, rWr: PHONE_HOLD.rWr + tap, lWr: PHONE_HOLD.lWr - tap};
	const lookAway = tw(abs, 9.7, 10.3) * (1 - tw(abs, 11.6, 12.1));
	pose = mixPose(pose, {...pose, headX: 0.12, headY: -0.35, neckX: 0.05}, lookAway);
	pose = mixPose(pose, {...pose, rShX: -0.35, rEl: -1.2, lShX: -0.4, lEl: -1.1, headX: 0.6}, tw(abs, 13.9, 14.6));
	pose = breathe(pose, abs, 1);
	const face: Face = {
		...SAD,
		brow: 0.7 + lookAway * 0.3,
		smile: -0.4 - lookAway * 0.2,
		lookY: -0.9 + lookAway * 0.9,
		lookX: lookAway * -0.8,
		blink: blinkAt(abs, 1),
		mouthOpen: 0,
	};

	// shots: A phone OTS (until 9.5), B face close (9.5-11.5), C phone close push (11.5+)
	const lower = tw(abs, 13.9, 14.6);
	const phonePos = lerp3([0.0, 0.99, -0.2], [0.0, 0.74, -0.08], lower);
	let camPos: V3;
	let target: V3;
	let fov: number;
	let focusPt: V3;
	if (abs < 9.5) {
		camPos = path3(abs, [[6.6, [-0.36, 1.56, -0.62]], [9.5, [-0.28, 1.48, -0.54]]]);
		target = [0.0, 0.97, -0.2];
		fov = 34;
		focusPt = [0.0, 0.99, -0.2];
	} else if (abs < 11.5) {
		camPos = path3(abs, [[9.5, [0.2, 0.98, 0.45]], [11.5, [0.12, 1.0, 0.3]]]);
		target = [0.0, 1.18, -0.35];
		fov = 30;
		focusPt = [0.0, 1.2, -0.32];
	} else {
		camPos = path3(abs, [[11.5, [0.36, 1.54, -0.6]], [14.6, [0.24, 1.4, -0.46]]]);
		target = [0.0, 0.95, -0.2];
		fov = 34;
		focusPt = [0.0, 0.97, -0.2];
	}
	camPos = add3(camPos, shake(abs, 0.006));
	return (
		<Stage background="#0b1220" fog={['#0b1220', 9, 70]} focus={dist(camPos, focusPt)} aperture={0.02} maxblur={0.014}>
			<Cam pos={camPos} target={target} fov={fov} />
			<BedroomSet t={abs} lamp={1} />
			<Character pose={pose} face={face} />
			<group position={phonePos} rotation={[0.88 - lower * 0.5, Math.PI, 0]}>
				<Phone typed={typed} cursor={cursor && screen > 0.5} screenOn={screen} />
			</group>
		</Stage>
	);
};
