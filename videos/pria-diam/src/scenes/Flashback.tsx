import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {add3, dist, path3, shake, tw} from '../anim';
import type {Look} from '../three/Character';
import {Character, RAKA} from '../three/Character';
import {Dust, Glow, LightCone, Room, SpotAt} from '../three/env';
import type {Pose} from '../three/pose';
import {blinkAt, breathe, mixPose, NEUTRAL_FACE, STAND} from '../three/pose';
import type {V3} from '../three/Stage';
import {Cam, Stage} from '../three/Stage';

export const FATHER: Look = {
	skin: '#a87552',
	top: '#45484d',
	topDark: '#34373b',
	pants: '#2b2722',
	shoes: '#1d1a17',
	hair: '#16110d',
	hairStyle: 'buzz',
	hood: false,
};

export const BOY_SCALE = 0.6;
export const BOY_HEAD = 1.32;

export const Sofa: React.FC<{readonly position: V3; readonly rotY?: number; readonly color?: string}> = ({position, rotY = 0, color = '#6d4b3a'}) => {
	const m = useMemo(() => new THREE.MeshStandardMaterial({color, roughness: 0.95}), [color]);
	return (
		<group position={position} rotation={[0, rotY, 0]}>
			<mesh position={[0, 0.22, 0]} material={m} castShadow receiveShadow><boxGeometry args={[2.0, 0.3, 0.85]} /></mesh>
			<mesh position={[0, 0.42, 0.05]} material={m} castShadow receiveShadow><boxGeometry args={[1.8, 0.14, 0.75]} /></mesh>
			<mesh position={[0, 0.68, -0.34]} rotation={[-0.12, 0, 0]} material={m} castShadow receiveShadow><boxGeometry args={[1.9, 0.55, 0.2]} /></mesh>
			<mesh position={[-0.95, 0.5, 0]} material={m} castShadow receiveShadow><boxGeometry args={[0.18, 0.4, 0.85]} /></mesh>
			<mesh position={[0.95, 0.5, 0]} material={m} castShadow receiveShadow><boxGeometry args={[0.18, 0.4, 0.85]} /></mesh>
		</group>
	);
};

// Boy sitting on the floor hugging his knees.
const BOY_HUG: Pose = {
	...STAND,
	y: -0.8,
	spineX: 0.35,
	neckX: 0.2,
	headX: 0.35,
	lHipX: -1.95,
	rHipX: -1.95,
	lHipZ: 0.12,
	rHipZ: -0.12,
	lKnee: 2.35,
	rKnee: 2.35,
	lAnk: 0.4,
	rAnk: 0.4,
	lShX: -1.05,
	lShZ: -0.12,
	lEl: -1.0,
	rShX: -1.05,
	rShZ: 0.12,
	rEl: -1.0,
};

export const ChildRoom: React.FC<{t: number}> = ({t}) => (
	<group>
		<Room w={4.4} d={4.4} h={2.7} wall="#6f5a45" floor="#7c5a3a" win={{x: 1.35, y: 1.0, w: 0.9, h: 2.0}} />
		{/* bright doorway */}
		<mesh position={[1.35, 1.0, -2.5]}>
			<planeGeometry args={[1.2, 2.2]} />
			<meshBasicMaterial color="#ffe3b3" toneMapped={false} />
		</mesh>
		<LightCone from={[1.9, 2.4, -4.0]} to={[-0.1, 0, 0.6]} radius={1.6} color="#ffd29a" intensity={0.16} />
		<Dust t={t} center={[0.6, 1.0, -0.8]} size={[2.4, 2, 2.4]} color="#ffe2b0" opacity={0.7} pointSize={0.014} />
		<Sofa position={[-0.6, 0, -1.75]} />
		{/* small toys on the floor */}
		<mesh position={[0.7, 0.06, -0.6]} rotation={[0, 0.5, 0]} castShadow><boxGeometry args={[0.12, 0.12, 0.12]} /><meshStandardMaterial color="#b0473b" roughness={0.6} /></mesh>
		<mesh position={[0.85, 0.05, -0.45]} castShadow><sphereGeometry args={[0.05, 16, 12]} /><meshStandardMaterial color="#3e7cb1" roughness={0.4} /></mesh>
		<mesh position={[-1.9, 1.5, -2.15]}><boxGeometry args={[0.45, 0.55, 0.02]} /><meshStandardMaterial color="#3a2a1d" /></mesh>
		<mesh position={[-1.9, 1.5, -2.135]}><planeGeometry args={[0.36, 0.46]} /><meshStandardMaterial color="#b49a78" /></mesh>
		<ambientLight intensity={0.22} color="#ffd9b0" />
		<hemisphereLight args={['#ffe2bf', '#3b2614', 0.35]} />
		<directionalLight position={[2.5, 3.5, -5]} intensity={2.2} color="#ffd59c" castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-3} shadow-camera-right={3} shadow-camera-top={3} shadow-camera-bottom={-3} />
		<pointLight position={[0.1, 2.5, 0.4]} intensity={1.6} distance={6} color="#ffc98a" />
		<Glow position={[1.35, 1.2, -2.4]} size={3} color="#ffd9a0" opacity={0.35} />
	</group>
);

// ---------------- Scene 3: childhood (14.33s - 19.9s) ----------------
export const Scene3: React.FC = () => {
	const t = useCurrentFrame() / 30;
	const abs = t + 14.33;
	const sob = Math.max(0, Math.sin(abs * 9)) * 0.05 * (1 - tw(abs, 18.9, 19.3));
	let boy: Pose = {...BOY_HUG, x: 0, z: -1.05, spineX: BOY_HUG.spineX + sob, lShZ: BOY_HUG.lShZ + sob, rShZ: BOY_HUG.rShZ - sob};
	// flinch at "jangan nangis"
	boy = mixPose(boy, {...boy, headX: 0.05, spineX: 0.2, neckX: -0.05}, tw(abs, 17.85, 18.1) * (1 - tw(abs, 18.4, 18.8)));
	// wipe tears at "lo harus kuat"
	const wipe = tw(abs, 18.7, 19.05) * (1 - tw(abs, 19.5, 19.9));
	boy = mixPose(boy, {...boy, rShX: -1.45, rShZ: 0.35, rEl: -2.35, headX: 0.15}, wipe);
	boy = breathe(boy, abs, 1.5);
	const boyFace = {...NEUTRAL_FACE, smile: -0.8, brow: 1, blink: Math.max(0.35, blinkAt(abs, 2)), lookY: -0.7, mouthOpen: 0.15 + sob};

	const point = tw(abs, 17.7, 17.95) * (1 - tw(abs, 19.2, 19.6));
	const lecture = abs > 17.85 && abs < 19.4 ? Math.max(0, Math.sin(abs * 19)) * 0.45 : 0;
	let father: Pose = {...STAND, x: 0.28, z: 0.05, rotY: Math.PI + 0.12, headX: 0.32, neckX: 0.12, spineX: 0.06};
	father = mixPose(father, {...father, rShX: -1.15, rShZ: -0.05, rEl: -0.25, spineX: 0.12, headX: 0.4}, point);
	father = breathe(father, abs, 0.8);
	const fatherFace = {...NEUTRAL_FACE, smile: -0.35, brow: -0.6, lookY: -0.8, mouthOpen: lecture, blink: blinkAt(abs, 4)};

	// Shots
	let cam: V3;
	let target: V3;
	let fov = 34;
	let focus: V3;
	if (abs < 15.85) {
		cam = path3(abs, [[14.33, [0.1, 0.62, 0.15]], [15.85, [0.12, 0.6, -0.05]]]);
		target = [0, 0.4, -1.05];
		focus = [0, 0.45, -1.0];
	} else if (abs < 17.8) {
		cam = path3(abs, [[15.85, [1.55, 1.35, 1.25]], [17.8, [1.35, 1.25, 1.0]]]);
		target = [-0.05, 0.4, -1.0];
		focus = [0, 0.42, -1.0];
		fov = 32;
	} else if (abs < 18.75) {
		cam = path3(abs, [[17.8, [-0.08, 0.38, -0.92]], [18.75, [-0.05, 0.42, -0.85]]]);
		target = [0.25, 1.6, 0.05];
		focus = [0.28, 1.55, 0.05];
		fov = 38;
	} else {
		cam = path3(abs, [[18.75, [-0.35, 0.62, 0.0]], [19.9, [-0.28, 0.58, -0.2]]]);
		target = [0, 0.42, -1.05];
		focus = [0, 0.45, -1.0];
		fov = 32;
	}
	cam = add3(cam, shake(abs, 0.006));
	const sepia = 0.65;
	return (
		<AbsoluteFill style={{filter: `sepia(${sepia}) saturate(0.85) contrast(1.06) brightness(1.02)`}}>
			<Stage background="#2a1f16" fog={['#2a1f16', 5, 14]} focus={dist(cam, focus)} aperture={0.02} maxblur={0.014}>
				<Cam pos={cam} target={target} fov={fov} />
				<ChildRoom t={abs} />
				<SpotAt position={[-1.2, 1.6, 0.8]} target={[0, 0.4, -1.0]} color="#ffcf9a" intensity={5} angle={0.5} />
				<SpotAt position={[0.3, 0.3, -1.6]} target={[0.3, 1.5, 0.05]} color="#ffb070" intensity={3} angle={0.5} />
				<Character pose={boy} face={boyFace} look={RAKA} scale={BOY_SCALE} headScale={BOY_HEAD} tears={0.8} />
				<Character pose={father} face={fatherFace} look={FATHER} />
			</Stage>
		</AbsoluteFill>
	);
};
