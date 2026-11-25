import React, {useMemo} from 'react';
import {useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {add3, dist, path1, path3, shake, talk, tw} from '../anim';
import type {Look} from '../three/Character';
import {Character, FRIEND_ARYA, FRIEND_BAYU, FRIEND_DIMAS, RAKA} from '../three/Character';
import {Chair, City, Dust, Glow, LightCone, Mug, Room, SpotAt, WindowUnit} from '../three/env';
import type {Face, Pose} from '../three/pose';
import {blinkAt, breathe, mixPose, NEUTRAL_FACE, SIT} from '../three/pose';
import type {V3} from '../three/Stage';
import {Cam, Stage} from '../three/Stage';

const SEAT: Pose = {...SIT, y: -0.43, spineX: 0.05, lShX: -0.55, rShX: -0.55, lEl: -1.15, rEl: -1.15, lShZ: -0.05, rShZ: 0.05};

const at = (p: Pose, x: number, z: number, rotY: number): Pose => ({...p, x, z, rotY});

// laughing body motion
const laughPose = (p: Pose, t: number, amt: number, ph: number): Pose => {
	const b = Math.max(0, Math.sin(t * 8.5 + ph)) * amt;
	return {
		...p,
		spineX: p.spineX - 0.12 * amt - 0.05 * b,
		headX: p.headX - 0.22 * amt - 0.08 * b,
		headZ: p.headZ + 0.06 * Math.sin(t * 3 + ph) * amt,
		lShZ: p.lShZ + 0.05 * b,
		rShZ: p.rShZ - 0.05 * b,
	};
};

const laughFace = (amt: number, t: number, ph: number): Face => ({
	...NEUTRAL_FACE,
	smile: amt,
	mouthOpen: amt * (0.35 + 0.25 * Math.max(0, Math.sin(t * 8.5 + ph))),
	blink: Math.max(blinkAt(t, ph), amt * 0.45),
	brow: -0.1 * amt,
	lookY: 0.1,
});

const CafeTable: React.FC = () => {
	const wood = useMemo(() => new THREE.MeshStandardMaterial({color: '#5b3a26', roughness: 0.45}), []);
	const metal = useMemo(() => new THREE.MeshStandardMaterial({color: '#1d1d1f', roughness: 0.4, metalness: 0.7}), []);
	return (
		<group>
			<mesh position={[0, 0.74, 0]} material={wood} castShadow receiveShadow>
				<cylinderGeometry args={[0.62, 0.62, 0.04, 40]} />
			</mesh>
			<mesh position={[0, 0.37, 0]} material={metal} castShadow>
				<cylinderGeometry args={[0.04, 0.04, 0.72, 12]} />
			</mesh>
			<mesh position={[0, 0.02, 0]} material={metal} receiveShadow>
				<cylinderGeometry args={[0.28, 0.3, 0.03, 24]} />
			</mesh>
		</group>
	);
};

// Peripheral patrons (soft, out of focus silhouettes)
const PATRONS: {x: number; z: number; r: number; look: Look}[] = [
	{x: -2.2, z: -2.0, r: 0.6, look: FRIEND_BAYU},
	{x: -1.5, z: -2.3, r: -2.4, look: FRIEND_ARYA},
	{x: 2.3, z: -1.7, r: -0.7, look: FRIEND_DIMAS},
];

export const CafeSet: React.FC<{t: number; light: number; others: number}> = ({t, light, others}) => {
	return (
		<group>
			<Room w={7} d={7} h={3.0} wall="#4b3a30" floor="#4e3626" win={{x: 0.6, y: 1.55, w: 3.6, h: 1.9}} floorRepeat={[5, 5]} />
			<WindowUnit x={0.6} y={1.55} z={-3.5} w={3.6} h={1.9} t={t} droplets={false} />
			<City center={[0, -6, -30]} spread={[60, 10]} count={26} brightness={0.8} seed={31} />
			{[-1.2, 0.2, 1.6, 2.6].map((x, i) => (
				<Glow key={i} position={[x, 1.2 + (i % 2) * 0.4, -6]} size={1.6} color={['#ffb35c', '#ff5f8a', '#56d6c9', '#ffd27a'][i]} opacity={0.45} />
			))}
			<mesh position={[0, 12, -45]}>
				<planeGeometry args={[120, 50]} />
				<meshBasicMaterial color="#121a2a" fog={false} />
			</mesh>
			{/* string lights along the back wall */}
			{Array.from({length: 14}, (_, i) => {
				const x = -3.2 + i * 0.5;
				const y = 2.65 - Math.sin((i / 13) * Math.PI) * 0.25;
				return (
					<group key={i}>
						<mesh position={[x, y, -3.35]}>
							<sphereGeometry args={[0.03, 8, 6]} />
							<meshBasicMaterial color="#ffd8a0" toneMapped={false} />
						</mesh>
						<Glow position={[x, y, -3.3]} size={0.45} color="#ffc070" opacity={0.6 * light} />
					</group>
				);
			})}
			{/* counter on the left */}
			<mesh position={[-3.0, 0.55, 0.2]} castShadow receiveShadow>
				<boxGeometry args={[0.8, 1.1, 3.2]} />
				<meshStandardMaterial color="#2d211a" roughness={0.6} />
			</mesh>
			{[0, 1, 2].map((i) => (
				<mesh key={i} position={[-3.3, 1.5 + i * 0.45, 0.2]}>
					<boxGeometry args={[0.3, 0.03, 3]} />
					<meshStandardMaterial color="#3a2a20" />
				</mesh>
			))}
			{Array.from({length: 12}, (_, i) => (
				<mesh key={i} position={[-3.3, 1.62 + Math.floor(i / 4) * 0.45, -1.0 + (i % 4) * 0.7]} castShadow>
					<cylinderGeometry args={[0.05, 0.05, 0.2, 10]} />
					<meshStandardMaterial color={['#6b2f22', '#2b4f3f', '#7a6036', '#3a3a3a'][i % 4]} roughness={0.3} />
				</mesh>
			))}
			{/* pendant lamp */}
			<mesh position={[0, 2.6, 0]}>
				<cylinderGeometry args={[0.006, 0.006, 0.8, 6]} />
				<meshStandardMaterial color="#111" />
			</mesh>
			<mesh position={[0, 2.12, 0]}>
				<coneGeometry args={[0.24, 0.2, 28, 1, true]} />
				<meshStandardMaterial color="#1b1b1b" side={THREE.DoubleSide} roughness={0.4} metalness={0.5} />
			</mesh>
			<mesh position={[0, 2.04, 0]}>
				<sphereGeometry args={[0.06, 16, 10]} />
				<meshBasicMaterial color={new THREE.Color('#ffd9a8').multiplyScalar(light)} toneMapped={false} />
			</mesh>
			<Glow position={[0, 2.02, 0]} size={1.2} color="#ffbf73" opacity={0.7 * light} />
			<LightCone from={[0, 2.08, 0]} to={[0, 0.74, 0]} radius={0.8} color="#ffc488" intensity={0.12 * light} />
			<SpotAt position={[0, 2.05, 0]} target={[0, 0, 0]} color="#ffc489" intensity={16 * light} angle={0.95} penumbra={0.6} shadow />
			<ambientLight intensity={0.15} color="#ffd9b8" />
			<hemisphereLight args={['#6d5a52', '#20150e', 0.3]} />
			<pointLight position={[0.6, 1.6, -3.0]} intensity={2.5} distance={6} color="#6f8fd0" />
			<Dust t={t} center={[0, 1.4, 0]} size={[2.2, 1.6, 2.2]} color="#ffdcb0" opacity={0.5 * light} />
			<CafeTable />
			<Mug position={[0.05, 0.76, -0.38]} />
			<Mug position={[0.4, 0.76, 0.05]} color="#3c5b6b" />
			<Mug position={[-0.38, 0.76, 0.12]} color="#a5553d" />
			<Mug position={[0.05, 0.76, 0.42]} color="#e1d6c0" />
			<Chair position={[0, 0, -0.95]} rotY={0} />
			<Chair position={[0.98, 0, 0.3]} rotY={-Math.PI / 2 - 0.3} />
			<Chair position={[-0.98, 0, 0.3]} rotY={Math.PI / 2 + 0.3} />
			<Chair position={[0, 0, 0.98]} rotY={Math.PI} />
			{/* other tables in the background */}
			{PATRONS.map((p, i) => (
				<group key={i}>
					<group position={[p.x + Math.sin(p.r) * 0.7, 0, p.z + Math.cos(p.r) * 0.7]}>
						<mesh position={[0, 0.74, 0]} castShadow>
							<cylinderGeometry args={[0.45, 0.45, 0.04, 28]} />
							<meshStandardMaterial color="#4a3020" roughness={0.5} />
						</mesh>
						<mesh position={[0, 0.37, 0]}>
							<cylinderGeometry args={[0.04, 0.04, 0.72, 10]} />
							<meshStandardMaterial color="#1d1d1f" />
						</mesh>
					</group>
					{others > 0.01 ? (
						<Character pose={breathe(at(SEAT, p.x, p.z, p.r), t + i, 1)} look={p.look} faceless opacity={others} castShadow={false} />
					) : null}
				</group>
			))}
		</group>
	);
};

const RAKA_SEAT: V3 = [0, 0, -0.82];
const FRIENDS: {look: Look; pos: V3; rot: number; ph: number}[] = [
	{look: FRIEND_DIMAS, pos: [0.86, 0, 0.3], rot: -Math.PI / 2 - 0.35, ph: 0.3},
	{look: FRIEND_ARYA, pos: [-0.86, 0, 0.3], rot: Math.PI / 2 + 0.35, ph: 1.7},
	{look: FRIEND_BAYU, pos: [0, 0, 0.86], rot: Math.PI, ph: 2.9},
];

const CafeCast: React.FC<{abs: number; rakaLaugh: number; friendsLaugh: number; friendsOpacity: number; rakaPose?: (p: Pose) => Pose; rakaFace?: Face}> = ({
	abs,
	rakaLaugh,
	friendsLaugh,
	friendsOpacity,
	rakaPose,
	rakaFace,
}) => {
	let rp = laughPose(at(SEAT, RAKA_SEAT[0], RAKA_SEAT[2], 0), abs, rakaLaugh, 0.9);
	rp = breathe(rp, abs, 1);
	if (rakaPose) rp = rakaPose(rp);
	return (
		<group>
			<Character pose={rp} face={rakaFace ?? laughFace(rakaLaugh, abs, 0.9)} look={RAKA} />
			{friendsOpacity > 0.01
				? FRIENDS.map((f, i) => {
						let p = laughPose(at(SEAT, f.pos[0], f.pos[2], f.rot), abs, friendsLaugh, f.ph);
						// Bayu slaps the table while laughing
						if (i === 2) p = {...p, rShX: -0.9 - Math.max(0, Math.sin(abs * 8.5)) * 0.35 * friendsLaugh, rEl: -0.5};
						if (i === 0) p = {...p, lShX: -1.0, lEl: -1.6 * friendsLaugh - 0.6};
						p = breathe(p, abs + f.ph, 1);
						const face = friendsLaugh > 0.05 ? laughFace(friendsLaugh, abs, f.ph) : {...NEUTRAL_FACE, smile: 0.4, mouthOpen: talk(abs + f.ph, 0.6), blink: blinkAt(abs, i + 5)};
						return <Character key={i} pose={p} face={face} look={f.look} opacity={friendsOpacity} castShadow={friendsOpacity > 0.9} />;
					})
				: null}
		</group>
	);
};

// ---------------- Scene 5a: laughing with friends (30.0s - 31.8s) ----------------
export const Scene5a: React.FC = () => {
	const t = useCurrentFrame() / 30;
	const abs = t + 30.0;
	const cam = add3(path3(abs, [[30.0, [2.05, 1.8, 2.55]], [31.8, [1.55, 1.7, 2.75]]]), shake(abs, 0.01));
	const target: V3 = [0, 0.95, -0.2];
	return (
		<Stage background="#120d0b" fog={['#120d0b', 7, 30]} focus={dist(cam, [0, 1.1, -0.6])} aperture={0.006}>
			<Cam pos={cam} target={target} fov={36} />
			<CafeSet t={abs} light={1} others={1} />
			<CafeCast abs={abs} rakaLaugh={1} friendsLaugh={1} friendsOpacity={1} />
		</Stage>
	);
};

// ---------------- Scene 5c + 6: smiling, then alone (32.87s - 38.5s) ----------------
export const Scene56: React.FC = () => {
	const t = useCurrentFrame() / 30;
	const abs = t + 32.87;
	const fade = 1 - tw(abs, 34.4, 35.5);
	const smileK = 1 - tw(abs, 35.0, 36.4);
	const look = tw(abs, 36.4, 37.4);
	const face: Face = {
		...NEUTRAL_FACE,
		smile: 0.75 * smileK - 0.5 * (1 - smileK),
		brow: 0.85 * (1 - smileK),
		mouthOpen: abs < 34.0 ? 0.12 : 0,
		blink: blinkAt(abs, 2) + (abs > 37.6 && abs < 37.9 ? 0.6 : 0),
		lookX: 0,
		lookY: -0.75 * look,
	};
	const cam = add3(path3(abs, [[32.87, [0.42, 1.3, 1.55]], [34.4, [0.36, 1.28, 1.3]], [38.5, [0.12, 1.02, 0.3]]]), shake(abs, 0.005));
	const target = path3(abs, [[32.87, [0, 1.12, -0.82]], [38.5, [0, 1.24, -0.8]]]);
	const nod = abs < 34.3 ? Math.sin(abs * 6) * 0.06 : 0;
	return (
		<Stage background="#120d0b" fog={['#120d0b', 7, 30]} focus={dist(cam, [0, 1.25, -0.72])} aperture={path1(abs, [[32.87, 0.02], [38.5, 0.035]])} maxblur={0.014}>
			<Cam pos={cam} target={target} fov={path1(abs, [[32.87, 34], [38.5, 30]])} />
			<CafeSet t={abs} light={0.55 + 0.45 * fade} others={fade} />
			<CafeCast
				abs={abs}
				rakaLaugh={0}
				friendsLaugh={abs < 34.3 ? 0.9 : 0}
				friendsOpacity={fade}
				rakaFace={face}
				rakaPose={(p) => mixPose({...p, headX: p.headX + nod - 0.05}, {...p, spineX: 0.25, headX: 0.38, neckX: 0.12, lShX: -0.7, rShX: -0.7}, look)}
			/>
		</Stage>
	);
};

// ---------------- Scene 5b: working late (31.67s - 33.0s) ----------------
export const Scene5b: React.FC = () => {
	const t = useCurrentFrame() / 30;
	const abs = t + 31.67;
	const tap = (ph: number) => Math.max(0, Math.sin(abs * 24 + ph)) * 0.06;
	let p: Pose = {...SEAT, x: 0, z: 0.62, rotY: Math.PI, y: -0.4, spineX: 0.18, headX: 0.12, lShX: -0.7, rShX: -0.7, lEl: -0.95, rEl: -0.95, lShZ: -0.12, rShZ: 0.12};
	p = {...p, lWr: tap(0), rWr: tap(1.7)};
	p = breathe(p, abs, 1);
	const face: Face = {...NEUTRAL_FACE, smile: -0.2, brow: 0.45, blink: Math.max(blinkAt(abs, 6), 0.3), lookY: -0.2};
	const cam = add3(path3(abs, [[31.67, [1.45, 1.45, -0.85]], [33.0, [1.2, 1.4, -0.7]]]), shake(abs, 0.004));
	const target: V3 = [0, 1.15, 0.55];
	return (
		<Stage background="#070a10" fog={['#070a10', 6, 40]} focus={dist(cam, [0, 1.25, 0.55])} aperture={0.02} maxblur={0.012}>
			<Cam pos={cam} target={target} fov={34} />
			<Room w={8} d={7} h={2.9} wall="#262b33" floor="#2a2d33" win={{x: 1.0, y: 1.6, w: 4.5, h: 1.8}} floorRepeat={[6, 6]} />
			<City center={[0, -10, -30]} spread={[70, 14]} count={30} brightness={0.9} seed={44} />
			<mesh position={[0, 12, -50]}><planeGeometry args={[150, 60]} /><meshBasicMaterial color="#0e1626" fog={false} /></mesh>
			<ambientLight intensity={0.08} color="#8ea4cc" />
			<hemisphereLight args={['#33445f', '#0d0a08', 0.25]} />
			{/* desk */}
			<mesh position={[0, 0.74, 0]} castShadow receiveShadow><boxGeometry args={[1.5, 0.04, 0.8]} /><meshStandardMaterial color="#d7d4cd" roughness={0.6} /></mesh>
			<mesh position={[-0.7, 0.37, 0]}><boxGeometry args={[0.04, 0.74, 0.75]} /><meshStandardMaterial color="#9a9a9a" metalness={0.5} /></mesh>
			<mesh position={[0.7, 0.37, 0]}><boxGeometry args={[0.04, 0.74, 0.75]} /><meshStandardMaterial color="#9a9a9a" metalness={0.5} /></mesh>
			{/* monitor */}
			<group position={[0, 1.08, -0.18]}>
				<mesh castShadow><boxGeometry args={[0.78, 0.46, 0.03]} /><meshStandardMaterial color="#111" roughness={0.4} /></mesh>
				<mesh position={[0, 0, 0.017]}>
					<planeGeometry args={[0.74, 0.42]} />
					<meshBasicMaterial color="#bcd6ff" toneMapped={false} />
				</mesh>
				{Array.from({length: 9}, (_, i) => (
					<mesh key={i} position={[-0.25 + (i % 3) * 0.06, 0.15 - i * 0.032, 0.018]}>
						<planeGeometry args={[0.2 + ((i * 37) % 5) * 0.05, 0.012]} />
						<meshBasicMaterial color="#5a7cb3" />
					</mesh>
				))}
				<mesh position={[0, -0.3, -0.02]}><boxGeometry args={[0.05, 0.2, 0.05]} /><meshStandardMaterial color="#222" /></mesh>
				<Glow position={[0, 0, 0.1]} size={1.6} color="#9fc2ff" opacity={0.45} />
			</group>
			<SpotAt position={[0, 1.1, -0.1]} target={[0, 1.3, 0.62]} color="#a9c8ff" intensity={3.5} angle={0.7} shadow />
			<mesh position={[0, 0.77, 0.12]}><boxGeometry args={[0.45, 0.015, 0.14]} /><meshStandardMaterial color="#222" roughness={0.5} /></mesh>
			<Mug position={[0.5, 0.76, 0.1]} color="#1f3b4d" />
			{/* stack of papers */}
			<mesh position={[-0.5, 0.79, 0.05]} rotation={[0, 0.2, 0]}><boxGeometry args={[0.22, 0.06, 0.3]} /><meshStandardMaterial color="#e8e4da" /></mesh>
			{/* desk lamp */}
			<group position={[-0.55, 0.76, -0.2]}>
				<mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.01, 0.01, 0.4, 6]} /><meshStandardMaterial color="#222" /></mesh>
				<mesh position={[0.06, 0.4, 0.05]} rotation={[0.4, 0, -0.5]}><coneGeometry args={[0.07, 0.1, 16, 1, true]} /><meshStandardMaterial color="#222" side={THREE.DoubleSide} /></mesh>
				<Glow position={[0.08, 0.36, 0.08]} size={0.5} color="#ffc078" opacity={0.7} />
				<pointLight position={[0.08, 0.34, 0.1]} intensity={1.5} distance={2.5} color="#ffb870" />
			</group>
			{/* empty desks in the dark */}
			{[[-2.2, -1.2], [2.3, -1.4], [-2.4, 1.6], [2.4, 1.5]].map(([x, z], i) => (
				<group key={i} position={[x, 0, z]}>
					<mesh position={[0, 0.74, 0]} receiveShadow><boxGeometry args={[1.4, 0.04, 0.75]} /><meshStandardMaterial color="#5c5c5c" roughness={0.7} /></mesh>
					<mesh position={[0, 1.05, -0.2]}><boxGeometry args={[0.7, 0.42, 0.03]} /><meshStandardMaterial color="#0d0d0f" roughness={0.3} /></mesh>
				</group>
			))}
			{/* clock */}
			<group position={[-1.6, 2.2, -3.44]}>
				<mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.2, 0.2, 0.03, 32]} /><meshStandardMaterial color="#e9e5dc" /></mesh>
				<mesh position={[0, 0.05, 0.02]} rotation={[0, 0, -0.3]}><boxGeometry args={[0.015, 0.11, 0.005]} /><meshBasicMaterial color="#111" /></mesh>
				<mesh position={[0.05, -0.03, 0.022]} rotation={[0, 0, 2.2 - abs * 0.1]}><boxGeometry args={[0.012, 0.16, 0.005]} /><meshBasicMaterial color="#111" /></mesh>
			</group>
			<Chair position={[0, 0, 0.66]} rotY={Math.PI} color="#1c1d21" />
			<Character pose={p} face={face} look={RAKA} />
		</Stage>
	);
};
