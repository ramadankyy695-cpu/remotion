import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {dist, path1, shake, add3, tw} from '../anim';
import type {Look} from '../three/Character';
import {Character, RAKA} from '../three/Character';
import {City, Glow, rng, SpotAt, useWindowsTexture} from '../three/env';
import type {Pose} from '../three/pose';
import {blinkAt, breathe, mixPose, NEUTRAL_FACE, STAND, walkPose} from '../three/pose';
import type {V3} from '../three/Stage';
import {Cam, Stage} from '../three/Stage';
import {BOY_HEAD, BOY_SCALE} from './Flashback';

const CROWD_LOOKS: Look[] = [
	['#4b4f57', '#2e3138', '#9a9fa8'],
	['#5a4a44', '#2b2a2e', '#8d8478'],
	['#3f4a52', '#24272c', '#c2c2bd'],
	['#6a5f52', '#33302c', '#a8a39a'],
	['#474049', '#262329', '#d0ccc4'],
	['#52575c', '#1e2024', '#7a7f86'],
].map(([top, pants, shoes], i) => ({
	skin: ['#9a6a4c', '#b07a58', '#8a5d42', '#c08b66'][i % 4],
	top,
	topDark: pants,
	pants,
	shoes,
	hair: '#151110',
	hairStyle: (['buzz', 'long', 'beanie', 'buzz', 'long', 'beanie'] as const)[i],
	hood: i % 3 === 0,
}));

type Ped = {x0: number; z: number; v: number; look: Look; ph: number; stand?: boolean; rot?: number};

const makeCrowd = (): Ped[] => {
	const r = rng(21);
	const out: Ped[] = [];
	for (let i = 0; i < 16; i++) {
		const dir = i % 3 === 0 ? 1 : -1;
		out.push({
			x0: -6 + r() * 34,
			z: dir === 1 ? -0.95 + r() * 0.2 : 1.05 + r() * 0.25,
			v: dir * (0.9 + r() * 0.35),
			look: CROWD_LOOKS[i % CROWD_LOOKS.length],
			ph: r() * 6,
		});
	}
	// groups chatting in front of shops
	const groups: [number, number, number][] = [
		[6.5, -1.25, 0.2],
		[7.1, -1.15, -2.6],
		[6.85, -0.7, 3.1],
		[14.2, -1.3, 0.6],
		[14.8, -1.2, -2.2],
	];
	groups.forEach(([x, z, rot], i) => out.push({x0: x, z, v: 0, look: CROWD_LOOKS[(i + 2) % 6], ph: i, stand: true, rot}));
	return out;
};

const Shopfront: React.FC<{x: number; seed: number; side: 1 | -1; g: number}> = ({x, seed, side, g}) => {
	const cfg = useMemo(() => {
		const r = rng(seed);
		const neon = ['#2de0d0', '#ff3d8b', '#ffb03a', '#7a6bff'][Math.floor(r() * 4)];
		const shop = ['#ffd49a', '#ffe8c8', '#c9e6ff'][Math.floor(r() * 3)];
		return {neon, shop, h: 7 + r() * 8, facade: ['#2a2826', '#24272c', '#2e2a2a'][Math.floor(r() * 3)]};
	}, [seed]);
	const win = useWindowsTexture(seed, 0.75);
	const upper = useMemo(() => {
		const tex = win.clone();
		tex.repeat.set(2, Math.round(cfg.h / 4));
		tex.needsUpdate = true;
		return new THREE.MeshStandardMaterial({color: '#141519', emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.9, roughness: 0.9});
	}, [win, cfg.h]);
	const z = side === 1 ? -2.8 : 10.6;
	const face = side === 1 ? -1.3 : 9.1;
	return (
		<group position={[x, 0, 0]}>
			<mesh position={[0, 1.6, z]} receiveShadow>
				<boxGeometry args={[5.8, 3.2, 3]} />
				<meshStandardMaterial color={cfg.facade} roughness={0.85} />
			</mesh>
			<mesh position={[0, 3.2 + cfg.h / 2, z]} material={upper}>
				<boxGeometry args={[5.8, cfg.h, 3]} />
			</mesh>
			{/* lit shop window */}
			<mesh position={[0, 1.45, face + 0.01 * side]} rotation={[0, side === 1 ? 0 : Math.PI, 0]}>
				<planeGeometry args={[3.8, 2.0]} />
				<meshBasicMaterial color={new THREE.Color(cfg.shop).multiplyScalar(0.5)} fog />
			</mesh>
			{/* awning */}
			<mesh position={[0, 2.75, face + 0.45 * side]} rotation={[side * 0.35, 0, 0]} castShadow>
				<boxGeometry args={[4.4, 0.04, 1.0]} />
				<meshStandardMaterial color="#3c2a22" roughness={0.8} />
			</mesh>
			{/* neon sign */}
			<mesh position={[1.9, 3.05, face + 0.2 * side]}>
				<boxGeometry args={[1.3, 0.22, 0.06]} />
				<meshBasicMaterial color={cfg.neon} toneMapped={false} fog />
			</mesh>
			<Glow position={[1.9, 3.05, face + 0.3 * side]} size={2.2} color={cfg.neon} opacity={0.5 * g} />
			<Glow position={[0, 1.45, face + 0.4 * side]} size={4.2} color={cfg.shop} opacity={0.18 * g} />
		</group>
	);
};

const LAMPS = Array.from({length: 9}, (_, i) => -8 + i * 7);

const StreetSet: React.FC<{walkerX: number; g: number}> = ({walkerX, g}) => {
	const nearest = [...LAMPS].sort((a, b) => Math.abs(a - walkerX - 1) - Math.abs(b - walkerX - 1)).slice(0, 3);
	return (
		<group>
			{/* sidewalk + road (wet) */}
			<mesh position={[16, 0.06, 0.1]} receiveShadow>
				<boxGeometry args={[80, 0.12, 3.6]} />
				<meshStandardMaterial color="#3b3c40" roughness={0.45} metalness={0.1} />
			</mesh>
			<mesh position={[16, 0, 5.4]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
				<planeGeometry args={[80, 7.2]} />
				<meshStandardMaterial color="#141519" roughness={0.18} metalness={0.3} />
			</mesh>
			<mesh position={[16, 0.06, 10.0]} receiveShadow>
				<boxGeometry args={[80, 0.12, 2.0]} />
				<meshStandardMaterial color="#35363a" roughness={0.5} />
			</mesh>
			{/* lane markings */}
			{Array.from({length: 16}, (_, i) => (
				<mesh key={i} position={[-10 + i * 5, 0.005, 5.4]} rotation={[-Math.PI / 2, 0, 0]}>
					<planeGeometry args={[2.2, 0.12]} />
					<meshStandardMaterial color="#8d8a80" roughness={0.6} />
				</mesh>
			))}
			{Array.from({length: 11}, (_, i) => (
				<React.Fragment key={i}>
					<Shopfront x={-12 + i * 6} seed={100 + i} side={1} g={g} />
					<Shopfront x={-9 + i * 6} seed={200 + i} side={-1} g={g} />
				</React.Fragment>
			))}
			{LAMPS.map((x) => (
				<group key={x} position={[x, 0, 1.75]}>
					<mesh position={[0, 2.1, 0]} castShadow>
						<cylinderGeometry args={[0.04, 0.06, 4.2, 10]} />
						<meshStandardMaterial color="#1b1c1f" metalness={0.6} roughness={0.4} />
					</mesh>
					<mesh position={[0, 4.15, -0.3]}>
						<boxGeometry args={[0.3, 0.08, 0.6]} />
						<meshStandardMaterial color="#1b1c1f" />
					</mesh>
					<mesh position={[0, 4.1, -0.4]}>
						<boxGeometry args={[0.22, 0.02, 0.4]} />
						<meshBasicMaterial color="#ffd9a3" toneMapped={false} />
					</mesh>
					<Glow position={[0, 4.0, -0.4]} size={2.4} color="#ffc777" opacity={0.6 * g} />
					{/* reflection streak on wet road */}
					<mesh position={[0, 0.01, 1.4]} rotation={[-Math.PI / 2, 0, 0]}>
						<planeGeometry args={[0.35, 2.6]} />
						<meshBasicMaterial color="#ffb766" transparent opacity={0.16} depthWrite={false} blending={THREE.AdditiveBlending} />
					</mesh>
				</group>
			))}
			{nearest.map((x, i) => (
				<pointLight key={i} position={[x, 3.9, 1.4]} intensity={9} distance={11} decay={1.6} color="#ffc27a" />
			))}
			<City center={[20, -2, -40]} spread={[120, 20]} count={40} minH={12} maxH={45} brightness={0.7} seed={9} />
			<City center={[70, -2, 4]} spread={[20, 40]} count={18} minH={14} maxH={50} brightness={0.7} seed={13} />
			<mesh position={[30, 20, -80]}>
				<planeGeometry args={[300, 80]} />
				<meshBasicMaterial color="#141b2b" fog={false} />
			</mesh>
		</group>
	);
};

const fogColor = (k: number) => new THREE.Color('#4a3a2a').lerp(new THREE.Color('#0c111b'), k).getStyle();

// ---------------- Scene 4: growing up, walking alone through the crowd (19.6s - 30.2s) ----------------
export const Scene4: React.FC = () => {
	const t = useCurrentFrame() / 30;
	const abs = t + 19.6;
	const crowd = useMemo(makeCrowd, []);
	const grow = tw(abs, 19.9, 22.6);
	const speed = 1.05;
	// walker slows slightly while glancing at the laughing group
	const glance = tw(abs, 25.0, 25.6) * (1 - tw(abs, 26.8, 27.5));
	const wx = (abs - 19.6) * speed - glance * 0.15;
	const stride = 0.85 + grow * 0.15;
	const freq = 5.6 - grow * 0.9; // child steps faster
	let pose: Pose = walkPose((abs - 19.6) * freq, stride, {...STAND, spineX: 0.06 + grow * 0.1, headX: 0.12 + grow * 0.18});
	pose = {...pose, x: wx, z: 0.1, rotY: Math.PI / 2};
	pose = mixPose(pose, {...pose, headY: -0.75, headX: 0.05}, glance);
	pose = breathe(pose, abs, 0.6);
	const face = {...NEUTRAL_FACE, smile: -0.35, brow: 0.55, lookY: -0.3 + glance * 0.3, lookX: -glance * 0.6, blink: blinkAt(abs, 3)};
	const scale = BOY_SCALE + (1 - BOY_SCALE) * grow;
	const headScale = BOY_HEAD + (1 - BOY_HEAD) * grow;

	// orbiting tracking camera
	const theta = path1(abs, [[19.6, 0.05], [23.4, 0.18], [24.6, 1.42], [27.9, 1.5], [30.2, 1.3]]);
	const R = path1(abs, [[19.6, 2.5], [23.4, 2.7], [24.6, 3.2], [27.9, 3.0], [30.2, 5.4]]);
	const h = path1(abs, [[19.6, 0.75], [22.6, 1.2], [27.9, 1.45], [30.2, 3.4]]);
	const base: V3 = [wx, 0, 0.1];
	let cam: V3 = [base[0] + R * Math.sin(theta) + 0.2, h, base[2] + R * Math.cos(theta)];
	cam = add3(cam, shake(abs, 0.015));
	const tY = path1(abs, [[19.6, 0.55], [22.6, 1.25], [27.9, 1.3], [30.2, 0.8]]);
	const target: V3 = [wx + 0.15, tY, 0.1];
	const fogK = tw(abs, 20.4, 23.4);
	const fc = fogColor(fogK);
	const sepia = 0.65 * (1 - tw(abs, 20.6, 23.2));

	return (
		<AbsoluteFill style={{filter: `sepia(${sepia}) saturate(${0.85 + 0.15 * fogK})`}}>
			<Stage background={fc} fog={[fc, 2 + fogK * 6, 9 + fogK * 55]} focus={dist(cam, [wx, 1.2 * scale, 0.1])} aperture={0.012} maxblur={0.012}>
				<Cam pos={cam} target={target} fov={path1(abs, [[19.6, 40], [24.6, 34], [30.2, 42]])} />
				<ambientLight intensity={0.18} color="#8ea4cc" />
				<hemisphereLight args={['#425a82', '#2a1d14', 0.35]} />
				<directionalLight position={[wx - 6, 12, 8]} intensity={0.6} color="#8fa9d8" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={8} shadow-camera-bottom={-8} />
				<StreetSet walkerX={wx} g={fogK} />
				<SpotAt position={[wx + 2.6, 2.3, 1.4]} target={[wx, 1.2, 0.1]} color="#ffd2a0" intensity={7} angle={0.45} />
				<SpotAt position={[wx - 2.5, 2.6, -1.0]} target={[wx, 1.4, 0.1]} color="#3fe0d0" intensity={6} angle={0.4} />
				<Character pose={pose} face={face} look={RAKA} scale={scale} headScale={headScale} />
				{crowd.map((p, i) => {
					if (p.stand) {
						const laugh = Math.max(0, Math.sin(abs * 7 + p.ph)) * (abs > 24.5 && abs < 28 ? 1 : 0.3);
						const sp: Pose = breathe({...STAND, x: p.x0, z: p.z, rotY: p.rot ?? 0, headX: -0.15 * laugh, spineX: -0.04 * laugh, lShX: -0.3, lEl: -0.9, rShX: -0.1}, abs + p.ph, 1);
						return fogK > 0.02 ? <Character key={i} pose={sp} look={p.look} faceless castShadow={false} opacity={fogK} /> : null;
					}
					const x = p.x0 + p.v * (abs - 19.6);
					if (Math.abs(x - wx) > 18 || fogK < 0.02) return null;
					const wp = walkPose((abs + p.ph) * 4.8 * Math.abs(p.v), 0.95);
					return <Character key={i} pose={{...wp, x, z: p.z, rotY: p.v > 0 ? Math.PI / 2 : -Math.PI / 2}} look={p.look} faceless castShadow={false} opacity={fogK} />;
				})}
			</Stage>
		</AbsoluteFill>
	);
};

