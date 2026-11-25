import React, {useMemo} from 'react';
import * as THREE from 'three';
import {box, mat, plane, rand, rbox, cyl} from './geo';
import {BusStop, Bush, Dust, Glow, House, houseStyles, Motorbike, PowerPole, Shop, SkyDome, StreetLamp, Tree, Wire} from './props';
import {asphalt, paving, tileFloor} from './textures';
import {Character, pedLook} from './Character';
import {cycleLength, walkPose, withPose} from './pose';

export type Light = 'afternoon' | 'dusk' | 'night' | 'morning' | 'golden' | 'noon';

type P3 = [number, number, number];

// Lighting presets shared by outdoor sets.
export const SkyLight: React.FC<{preset: Light; sunDir?: P3; shadowCenter?: P3; preset2?: Light; t?: number}> = ({preset, sunDir, shadowCenter = [0, 0, 0], preset2, t = 0}) => {
	const all = {
		noon: {sun: '#fff4e2', si: 3.0, dir: [2, 10, 3], hemiS: '#cfe3ff', hemiG: '#7a6d5c', hi: 0.9, sky: ['#5d8fd0', '#a9c9ec', '#e8eef2']},
		afternoon: {sun: '#ffe2b8', si: 2.4, dir: [6, 6, 4], hemiS: '#c3d6f0', hemiG: '#6d604f', hi: 0.8, sky: ['#6a93c9', '#b8cfe6', '#f1e3cc']},
		golden: {sun: '#ffb46b', si: 2.6, dir: [10, 3, 3], hemiS: '#e8c7a4', hemiG: '#5b4636', hi: 0.6, sky: ['#5a74a8', '#e7a77a', '#ffd29a']},
		dusk: {sun: '#ff9a6b', si: 0.9, dir: [-10, 1.6, -3], hemiS: '#6c6fa0', hemiG: '#3a2c2a', hi: 0.55, sky: ['#232a52', '#8a5a7a', '#f2a070']},
		night: {sun: '#8fa8de', si: 0.35, dir: [-4, 8, 6], hemiS: '#2a3658', hemiG: '#151012', hi: 0.35, sky: ['#04060c', '#0d1428', '#1f2a44']},
		morning: {sun: '#ffc98e', si: 3.2, dir: [12, 2.6, 1], hemiS: '#bcd2ee', hemiG: '#6a5948', hi: 0.75, sky: ['#7fa6d6', '#f0cfa6', '#ffe2b4']},
	};
	const a = all[preset];
	const b = all[preset2 ?? preset];
	const lc = (x: string, y: string) => `#${new THREE.Color(x).lerp(new THREE.Color(y), t).getHexString()}`;
	const cfg = {
		sun: lc(a.sun, b.sun),
		si: a.si + (b.si - a.si) * t,
		dir: a.dir.map((v, i) => v + (b.dir[i] - v) * t),
		hemiS: lc(a.hemiS, b.hemiS),
		hemiG: lc(a.hemiG, b.hemiG),
		hi: a.hi + (b.hi - a.hi) * t,
		sky: [lc(a.sky[0], b.sky[0]), lc(a.sky[1], b.sky[1]), lc(a.sky[2], b.sky[2])],
	};
	const d = sunDir ?? (cfg.dir as P3);
	const target = useMemo(() => new THREE.Object3D(), []);
	target.position.set(...shadowCenter);
	return (
		<>
			<hemisphereLight args={[cfg.hemiS, cfg.hemiG, cfg.hi]} />
			<primitive object={target} />
			<directionalLight
				position={[shadowCenter[0] + d[0] * 3, shadowCenter[1] + d[1] * 3, shadowCenter[2] + d[2] * 3]}
				target={target}
				intensity={cfg.si}
				color={cfg.sun}
				castShadow
				shadow-mapSize={[2048, 2048]}
				shadow-camera-left={-14}
				shadow-camera-right={14}
				shadow-camera-top={14}
				shadow-camera-bottom={-14}
				shadow-camera-near={1}
				shadow-camera-far={120}
				shadow-bias={-0.0006}
				shadow-normalBias={0.02}
			/>
			<SkyDomeDyn top={cfg.sky[0]} mid={cfg.sky[1]} bottom={cfg.sky[2]} />
		</>
	);
};

const SkyDomeDyn: React.FC<{top: string; mid: string; bottom: string}> = ({top, mid, bottom}) => {
	const geo = useMemo(() => new THREE.SphereGeometry(150, 32, 16), []);
	const matl = useMemo(
		() =>
			new THREE.ShaderMaterial({
				side: THREE.BackSide,
				depthWrite: false,
				uniforms: {top: {value: new THREE.Color()}, mid: {value: new THREE.Color()}, bottom: {value: new THREE.Color()}},
				vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
				fragmentShader:
					'uniform vec3 top; uniform vec3 mid; uniform vec3 bottom; varying vec3 vP; void main(){ float h = vP.y; vec3 c = h > 0.08 ? mix(mid, top, smoothstep(0.08, 0.6, h)) : mix(bottom, mid, smoothstep(-0.05, 0.08, h)); gl_FragColor = vec4(c, 1.0); }',
			}),
		[],
	);
	matl.uniforms.top.value.set(top);
	matl.uniforms.mid.value.set(mid);
	matl.uniforms.bottom.value.set(bottom);
	return <mesh geometry={geo} material={matl} frustumCulled={false} />;
};

// ------------------------------------------------------------ neighborhood street
// Road runs along X at z in [-2.5, 2.5]. Sidewalk (north) z in [-4.5,-2.5]. Fences at z=-5.4, houses front at z=-8.

export const Neighborhood: React.FC<{frame: number; light: Light; x0?: number; x1?: number; lit?: number; lampsOn?: number; skipHouse?: number; extraNear?: boolean; sunDir?: P3; shadowCenter?: P3; light2?: Light; lightT?: number}> = ({
	frame,
	light,
	sunDir,
	shadowCenter,
	light2,
	lightT,
	x0 = -40,
	x1 = 60,
	lit = 0,
	lampsOn = 0,
	skipHouse,
}) => {
	const asp = useMemo(() => {
		const t = asphalt().clone();
		t.needsUpdate = true;
		t.repeat.set(30, 1.5);
		return new THREE.MeshStandardMaterial({map: t, roughness: 0.9, color: '#9a9aa0'});
	}, []);
	const walk = useMemo(() => {
		const t = tileFloor('#b3aa9b', 'walktile').clone();
		t.needsUpdate = true;
		t.repeat.set(60, 3);
		return new THREE.MeshStandardMaterial({map: t, roughness: 0.95});
	}, []);
	const houses: React.ReactNode[] = [];
	let i = 0;
	for (let x = Math.floor(x0 / 8) * 8; x < x1; x += 8, i++) {
		const st = houseStyles[(i + 100) % houseStyles.length];
		const l = lit * (rand(i * 3.1) > 0.35 ? 1 : 0.15);
		if (skipHouse !== x) {
			houses.push(<House key={`n${x}`} position={[x, 0, -11]} s={{...st, lit: l}} />);
		}
		const st2 = houseStyles[(i + 2) % houseStyles.length];
		houses.push(<House key={`s${x}`} position={[x + 4, 0, 11]} rotationY={Math.PI} s={{...st2, lit: lit * (rand(i * 7.3) > 0.4 ? 1 : 0.1)}} />);
		if (rand(i * 1.7) > 0.4) houses.push(<Tree key={`t${x}`} position={[x + 3.6, 0, -6.6]} scale={0.9 + rand(i) * 0.4} seed={i + 1} />);
		if (rand(i * 2.3) > 0.5) houses.push(<Tree key={`ts${x}`} position={[x + 1, 0, 6.8]} scale={0.8 + rand(i * 5) * 0.4} seed={i + 30} />);
		houses.push(<Bush key={`b${x}`} position={[x - 2.5, 0, -6.2]} scale={0.9} seed={i + 3} />);
		if (rand(i * 4.1) > 0.6) houses.push(<Motorbike key={`m${x}`} position={[x + 1.5, 0, -6.3]} rotationY={Math.PI / 2 + 0.2} color={['#a33a35', '#2f4f7a', '#222'][i % 3]} />);
	}
	const poles: React.ReactNode[] = [];
	for (let x = Math.floor(x0 / 16) * 16; x < x1; x += 16) {
		poles.push(<PowerPole key={`p${x}`} position={[x, 0, -4.8]} />);
		poles.push(<Wire key={`w${x}`} a={[x - 0.5, 6.6, -4.8]} b={[x + 15.5, 6.6, -4.8]} sag={0.5} />);
		poles.push(<Wire key={`w2${x}`} a={[x + 0.5, 6.6, -4.8]} b={[x + 16.5, 6.6, -4.8]} sag={0.6} />);
		poles.push(<StreetLamp key={`l${x}`} position={[x + 8, 0, -4.6]} on={lampsOn} />);
	}
	return (
		<group>
			<SkyLight preset={light} sunDir={sunDir} shadowCenter={shadowCenter} preset2={light2} t={lightT} />
			<mesh geometry={plane(400, 5)} material={asp} rotation={[-Math.PI / 2, 0, 0]} receiveShadow />
			{/* road markings */}
			{new Array(40).fill(0).map((_, k) => (
				<mesh key={k} geometry={plane(1.6, 0.1)} material={mat('#d9d4c2', {rough: 0.8})} rotation={[-Math.PI / 2, 0, 0]} position={[x0 + k * 4, 0.005, 0]} />
			))}
			{/* curbs + sidewalks */}
			{[-1, 1].map((s) => (
				<group key={s}>
					<mesh geometry={box(400, 0.15, 0.2)} material={mat('#9c968c', {rough: 0.9})} position={[0, 0.075, s * 2.55]} receiveShadow />
					<mesh geometry={plane(400, 2)} material={walk} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.15, s * 3.6]} receiveShadow />
					{/* gutter */}
					<mesh geometry={box(400, 0.1, 0.35)} material={mat('#5b5952', {rough: 0.9})} position={[0, 0.1, s * 4.75]} receiveShadow />
					<mesh geometry={plane(400, 10)} material={mat('#7c7a6e', {rough: 1})} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, s * 10]} receiveShadow />
				</group>
			))}
			{houses}
			{poles}
			<Dust frame={frame} center={[(x0 + x1) / 2, 1.5, -2]} size={[30, 3, 6]} count={160} color={light === 'night' || light === 'dusk' ? '#ffd9a0' : '#fff2d0'} opacity={0.35} seed={9} />
		</group>
	);
};

// ------------------------------------------------------------ pedestrians

export type Ped = {x0: number; z: number; dir: 1 | -1; speed: number; idx: number};

export const Pedestrians: React.FC<{frame: number; peds: Ped[]; timeScale?: number}> = ({frame, peds, timeScale = 1}) => (
	<>
		{peds.map((p, i) => {
			const t = (frame / 30) * timeScale;
			const x = p.x0 + p.dir * p.speed * t;
			const amp = 0.36;
			const phase = ((p.speed * t) / cycleLength(amp)) * Math.PI * 2 + i;
			const pose = withPose(walkPose(phase, amp, 0.7), {face: {blink: 0}});
			return <Character key={i} pose={pose} look={pedLook(p.idx)} position={[x, 0.15, p.z]} rotationY={p.dir === 1 ? Math.PI / 2 : -Math.PI / 2} />;
		})}
	</>
);

// ------------------------------------------------------------ city sidewalk with shops
// Shops face +z at z=-6. Sidewalk z in [-6,-2.5]. Road z in [-2.5, 5].

const shopDefs = [
	{w: 6, wall: '#d9cbb5', sign: 'WARUNG KOPI', signBg: '#3b2a22', signFg: '#f3d9a6', awning: '#9a3b2f'},
	{w: 5, wall: '#c3ccd2', sign: 'APOTEK', signBg: '#2f6b4f', signFg: '#ffffff', awning: '#2f6b4f'},
	{w: 7, wall: '#e3d3b8', sign: 'TOKO SEMBAKO', signBg: '#d9b34a', signFg: '#3a2a12', awning: '#c9502f'},
	{w: 5, wall: '#b9b2c9', sign: 'LAUNDRY', signBg: '#3e5a8a', signFg: '#ffffff', awning: '#3e5a8a'},
	{w: 6, wall: '#d4c0a8', sign: 'BAKSO', signBg: '#a12f2a', signFg: '#ffe9c2', awning: '#e0a43a'},
	{w: 6, wall: '#cfd5c6', sign: 'FOTOKOPI', signBg: '#283848', signFg: '#e8f0f7', awning: '#55708a'},
];

export const CityStreet: React.FC<{frame: number; light: Light; sunDir?: P3; x0?: number; x1?: number; shadowCenter?: P3; traffic?: number; timeScale?: number; light2?: Light; lightT?: number}> = ({
	frame,
	light,
	light2,
	lightT,
	sunDir,
	x0 = -30,
	x1 = 60,
	shadowCenter,
	traffic = 1,
	timeScale = 1,
}) => {
	const pav = useMemo(() => {
		const t = paving().clone();
		t.needsUpdate = true;
		t.repeat.set(60, 3);
		return new THREE.MeshStandardMaterial({map: t, roughness: 0.9});
	}, []);
	const asp = useMemo(() => {
		const t = asphalt().clone();
		t.needsUpdate = true;
		t.repeat.set(30, 2);
		return new THREE.MeshStandardMaterial({map: t, roughness: 0.85, color: '#8e8f95'});
	}, []);
	const shops: React.ReactNode[] = [];
	let x = x0;
	let k = 0;
	while (x < x1) {
		const d = shopDefs[k % shopDefs.length];
		shops.push(<Shop key={k} position={[x + d.w / 2, 0.15, -6]} {...d} />);
		x += d.w;
		k++;
	}
	const t = (frame / 30) * timeScale;
	const vehicles = [0, 1, 2, 3, 4, 5].map((i) => {
		const dir = i % 2 ? 1 : -1;
		const lane = dir === 1 ? -0.9 : 1.6;
		const speed = 7 + (i % 3) * 2.5;
		const span = x1 - x0 + 40;
		const vx = x0 - 20 + ((((i * 37) % span) + dir * speed * t) % span + span) % span;
		return <Motorbike key={i} position={[vx, 0, lane]} rotationY={dir === 1 ? Math.PI / 2 : -Math.PI / 2} color={['#a33a35', '#2f4f7a', '#d0d0d0', '#222', '#5a7a3a', '#d9b34a'][i]} />;
	});
	return (
		<group>
			<SkyLight preset={light} sunDir={sunDir} shadowCenter={shadowCenter} preset2={light2} t={lightT} />
			<mesh geometry={plane(400, 3.5)} material={pav} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.15, -4.25]} receiveShadow />
			<mesh geometry={box(400, 0.15, 0.25)} material={mat('#8f8a80', {rough: 0.9})} position={[0, 0.075, -2.5]} receiveShadow />
			<mesh geometry={plane(400, 12)} material={asp} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 3.5]} receiveShadow />
			{new Array(40).fill(0).map((_, j) => (
				<mesh key={j} geometry={plane(2, 0.12)} material={mat('#e6e0cc')} rotation={[-Math.PI / 2, 0, 0]} position={[x0 + j * 5, 0.005, 0.5]} />
			))}
			{shops}
			{/* street trees & lamps along curb */}
			{new Array(Math.ceil((x1 - x0) / 10)).fill(0).map((_, j) => (
				<group key={j}>
					<Tree position={[x0 + j * 10 + 3, 0.15, -2.9]} scale={0.85} seed={j + 50} color="#557a3f" />
					<mesh geometry={cyl(0.5, 0.5, 0.05, 16)} material={mat('#5a4a3a')} position={[x0 + j * 10 + 3, 0.16, -2.9]} />
					<StreetLamp position={[x0 + j * 10 + 8, 0.15, -2.75]} on={0} />
				</group>
			))}
			{/* far side buildings */}
			{new Array(Math.ceil((x1 - x0) / 9)).fill(0).map((_, j) => (
				<mesh key={j} geometry={box(8.5, 6 + rand(j) * 6, 5)} material={mat(['#cbbfa9', '#b3b9bf', '#d6c8b0', '#a9a197'][j % 4], {rough: 0.9})} position={[x0 + j * 9, 3 + rand(j) * 3, 13]} castShadow receiveShadow />
			))}
			{vehicles}
			{traffic ? null : null}
		</group>
	);
};

// A street clock on a post — time symbol.
export const StreetClock: React.FC<{position: P3; seconds: number}> = ({position, seconds}) => {
	const minute = (seconds / 3600) * Math.PI * 2;
	const hour = (seconds / 43200) * Math.PI * 2;
	return (
		<group position={position}>
			<mesh geometry={cyl(0.07, 0.09, 3.2, 10)} material={mat('#2c3a33', {rough: 0.5, metal: 0.5})} position={[0, 1.6, 0]} castShadow />
			<group position={[0, 3.45, 0]}>
				<mesh geometry={cyl(0.42, 0.42, 0.16, 32)} material={mat('#2c3a33', {rough: 0.5, metal: 0.5})} rotation={[Math.PI / 2, 0, 0]} castShadow />
				{[1, -1].map((s) => (
					<group key={s} rotation={[0, s === 1 ? 0 : Math.PI, 0]}>
						<mesh geometry={cyl(0.36, 0.36, 0.01, 32)} material={mat('#f2eee3', {rough: 0.5, emissive: '#fff3d6', ei: 0.05})} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.085]} />
						<group position={[0, 0, 0.095]} rotation={[0, 0, -hour]}>
							<mesh geometry={box(0.03, 0.2, 0.01)} material={mat('#1a1a1a')} position={[0, 0.09, 0]} />
						</group>
						<group position={[0, 0, 0.1]} rotation={[0, 0, -minute]}>
							<mesh geometry={box(0.02, 0.3, 0.01)} material={mat('#1a1a1a')} position={[0, 0.13, 0]} />
						</group>
						{new Array(12).fill(0).map((_, i) => (
							<mesh key={i} geometry={box(0.015, 0.05, 0.01)} material={mat('#333')} position={[Math.sin((i / 12) * Math.PI * 2) * 0.3, Math.cos((i / 12) * Math.PI * 2) * 0.3, 0.092]} rotation={[0, 0, -(i / 12) * Math.PI * 2]} />
						))}
					</group>
				))}
			</group>
		</group>
	);
};

// ------------------------------------------------------------ office

export const Office: React.FC<{frame: number}> = ({frame}) => {
	const floor = useMemo(() => {
		const t = tileFloor('#8d9196', 'officefloor').clone();
		t.needsUpdate = true;
		t.repeat.set(10, 10);
		return new THREE.MeshStandardMaterial({map: t, roughness: 0.6});
	}, []);
	const desks: React.ReactNode[] = [];
	for (let r = 0; r < 3; r++) {
		for (let c = 0; c < 4; c++) {
			const x = -3 + c * 2;
			const z = -1.5 - r * 2.2;
			desks.push(
				<group key={`${r}-${c}`} position={[x, 0, z]}>
					<mesh geometry={rbox(1.6, 0.04, 0.8, 0.01)} material={mat('#d9d5cc', {rough: 0.5})} position={[0, 0.74, 0]} castShadow receiveShadow />
					<mesh geometry={box(0.05, 0.72, 0.7)} material={mat('#6d7278', {metal: 0.5, rough: 0.4})} position={[-0.75, 0.36, 0]} />
					<mesh geometry={box(0.05, 0.72, 0.7)} material={mat('#6d7278', {metal: 0.5, rough: 0.4})} position={[0.75, 0.36, 0]} />
					<mesh geometry={rbox(1.6, 0.45, 0.04, 0.01)} material={mat('#56636e', {rough: 0.9})} position={[0, 0.97, -0.42]} castShadow />
					{(r + c) % 3 !== 0 ? (
						<>
							<mesh geometry={rbox(0.5, 0.32, 0.03, 0.01)} material={mat('#1c1e22', {rough: 0.4})} position={[0.1, 1.05, -0.25]} />
							<mesh geometry={box(0.05, 0.15, 0.05)} material={mat('#333')} position={[0.1, 0.83, -0.25]} />
						</>
					) : null}
					{c % 2 === 0 ? <mesh geometry={rbox(0.45, 0.08, 0.45, 0.03)} material={mat('#2e3238', {rough: 0.8})} position={[0, 0.5, 0.55]} castShadow /> : null}
				</group>,
			);
		}
	}
	return (
		<group>
			<mesh geometry={plane(16, 16)} material={floor} rotation={[-Math.PI / 2, 0, 0]} receiveShadow />
			<mesh geometry={plane(16, 4)} material={mat('#c9cdd1', {rough: 0.9})} position={[0, 2, -8]} receiveShadow />
			<mesh geometry={plane(16, 16)} material={mat('#e6e8ea', {rough: 1})} position={[0, 3.2, 0]} rotation={[Math.PI / 2, 0, 0]} />
			{/* windows wall (night city) */}
			<group position={[-6, 1.7, 0]} rotation={[0, Math.PI / 2, 0]}>
				<mesh geometry={plane(16, 3.4)}>
					<meshBasicMaterial color="#0c1424" toneMapped={false} />
				</mesh>
				{new Array(30).fill(0).map((_, i) => (
					<mesh key={i} geometry={plane(0.12, 0.08)} position={[(rand(i) - 0.5) * 15, (rand(i * 3) - 0.6) * 2.4, 0.01]}>
						<meshBasicMaterial color={rand(i * 7) > 0.5 ? '#ffd9a0' : '#cfe0ff'} toneMapped={false} />
					</mesh>
				))}
				{new Array(8).fill(0).map((_, i) => (
					<mesh key={`m${i}`} geometry={box(0.08, 3.4, 0.1)} material={mat('#3a3f45')} position={[-7 + i * 2, 0, 0.05]} />
				))}
			</group>
			{desks}
			{/* fluorescent panels */}
			{[-2, 1].map((x) =>
				[-1, -4].map((z) => (
					<group key={`${x}${z}`}>
						<mesh geometry={plane(1.2, 0.3)} position={[x, 3.18, z]} rotation={[Math.PI / 2, 0, 0]}>
							<meshBasicMaterial color="#f2f6ff" toneMapped={false} side={THREE.DoubleSide} />
						</mesh>
					</group>
				)),
			)}
			<hemisphereLight args={['#dfe8f5', '#4a4c52', 0.6]} />
			<pointLight position={[-1, 3.0, -1]} intensity={3} distance={9} decay={1.4} color="#e9f0ff" castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.002} />
			<pointLight position={[2, 3.0, -4]} intensity={1.5} distance={8} decay={1.4} color="#e9f0ff" />
			<Dust frame={frame} center={[-1, 1.4, -1.5]} size={[3, 2, 2]} count={60} color="#e6eeff" opacity={0.3} />
		</group>
	);
};

export const BusStopSet: React.FC<{position: P3}> = ({position}) => <BusStop position={position} />;
