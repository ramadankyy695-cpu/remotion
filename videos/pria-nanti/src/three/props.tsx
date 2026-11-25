import React, {useMemo} from 'react';
import * as THREE from 'three';
import {blob, box, cyl, lathe, mat, plane, rand, rbox, sphere, taper, torus} from './geo';
import {calendarTex, familyPhoto, glowTex, laptopScreen, posterTex, shaftTex, signTex, skyTex, windowsTex} from './textures';

type P3 = [number, number, number];

const texMats = new Map<string, THREE.Material>();
const texMat = (key: string, make: () => THREE.Material) => {
	const ex = texMats.get(key);
	if (ex) return ex;
	const m = make();
	texMats.set(key, m);
	return m;
};

// ------------------------------------------------------------------ desk items

export const Laptop: React.FC<{position?: P3; rotationY?: number; open: number; screen?: 'doc' | 'sheet' | 'chart'; glow?: number}> = ({
	position = [0, 0, 0],
	rotationY = 0,
	open,
	screen = 'doc',
	glow = 1,
}) => {
	const body = mat('#9aa0a8', {rough: 0.35, metal: 0.6});
	const dark = mat('#1a1c20', {rough: 0.5});
	const angle = -Math.PI / 2 + open * (Math.PI / 2 + 0.3); // 0 closed .. 1 open (~107deg)
	const scr = texMat(`scr-${screen}`, () => new THREE.MeshBasicMaterial({map: laptopScreen(screen), toneMapped: false}));
	return (
		<group position={position} rotation={[0, rotationY, 0]}>
			<mesh geometry={rbox(0.34, 0.016, 0.23, 0.006)} material={body} position={[0, 0.008, 0]} castShadow receiveShadow />
			<mesh geometry={rbox(0.3, 0.002, 0.11, 0.001)} material={dark} position={[0, 0.0165, -0.03]} />
			<mesh geometry={rbox(0.1, 0.002, 0.06, 0.001)} material={mat('#80868e', {rough: 0.4, metal: 0.5})} position={[0, 0.0165, 0.07]} />
			<group position={[0, 0.016, -0.113]} rotation={[-angle - Math.PI / 2 + Math.PI / 2, 0, 0]}>
				<group rotation={[0, 0, 0]}>
					<mesh geometry={rbox(0.34, 0.225, 0.008, 0.005)} material={body} position={[0, 0.1125, -0.004]} castShadow />
					<mesh geometry={plane(0.31, 0.195)} position={[0, 0.115, 0.0005]} material={dark} />
					{open > 0.05 ? (
						<mesh geometry={plane(0.3, 0.188)} position={[0, 0.115, 0.001]}>
							<meshBasicMaterial map={(scr as THREE.MeshBasicMaterial).map} toneMapped={false} color={new THREE.Color(glow, glow, glow)} />
						</mesh>
					) : null}
				</group>
			</group>
		</group>
	);
};

export const Mug: React.FC<{position?: P3; rotationY?: number; color?: string}> = ({position = [0, 0, 0], rotationY = 0, color = '#d8d2c6'}) => (
	<group position={position} rotation={[0, rotationY, 0]}>
		<mesh geometry={lathe('mug', [[0.001, 0], [0.038, 0], [0.042, 0.005], [0.042, 0.095], [0.038, 0.096], [0.036, 0.01], [0.001, 0.012]])} material={mat(color, {rough: 0.35})} castShadow />
		<mesh geometry={cyl(0.036, 0.036, 0.002, 20)} material={mat('#3b2418', {rough: 0.2})} position={[0, 0.082, 0]} />
		<mesh geometry={torus(0.025, 0.007, Math.PI, 8, 16)} material={mat(color, {rough: 0.35})} position={[0.042, 0.05, 0]} rotation={[0, 0, -Math.PI / 2]} />
	</group>
);

export const Books: React.FC<{position?: P3; rotationY?: number; count?: number; seed?: number}> = ({position = [0, 0, 0], rotationY = 0, count = 3, seed = 1}) => {
	const cols = ['#7a3b34', '#2f4a63', '#c9a24a', '#3f5d47', '#d9d2c3', '#5a4a6b'];
	let y = 0;
	return (
		<group position={position} rotation={[0, rotationY, 0]}>
			{new Array(count).fill(0).map((_, i) => {
				const h = 0.025 + rand(seed + i) * 0.02;
				const w = 0.17 + rand(seed * 2 + i) * 0.05;
				const d = 0.23 + rand(seed * 3 + i) * 0.04;
				const yy = y + h / 2;
				y += h;
				return (
					<group key={i} position={[0, yy, 0]} rotation={[0, (rand(seed + i * 5) - 0.5) * 0.3, 0]}>
						<mesh geometry={rbox(w, h, d, 0.004)} material={mat(cols[(seed + i) % cols.length], {rough: 0.7})} castShadow receiveShadow />
						<mesh geometry={box(w - 0.01, h - 0.006, 0.002)} material={mat('#f1ebdd', {rough: 0.9})} position={[0.004, 0, d / 2 + 0.0005]} />
					</group>
				);
			})}
		</group>
	);
};

export const DeskLamp: React.FC<{position?: P3; rotationY?: number; on?: number}> = ({position = [0, 0, 0], rotationY = 0, on = 1}) => {
	const m = mat('#2b2d31', {rough: 0.4, metal: 0.4});
	return (
		<group position={position} rotation={[0, rotationY, 0]}>
			<mesh geometry={cyl(0.07, 0.075, 0.02, 24)} material={m} position={[0, 0.01, 0]} castShadow />
			<mesh geometry={cyl(0.008, 0.008, 0.34, 8)} material={m} position={[0, 0.18, 0.02]} rotation={[0.12, 0, 0]} />
			<mesh geometry={cyl(0.008, 0.008, 0.26, 8)} material={m} position={[0, 0.39, 0.11]} rotation={[1.0, 0, 0]} />
			<group position={[0, 0.43, 0.22]} rotation={[0.9, 0, 0]}>
				<mesh geometry={lathe('lampshade', [[0.02, 0.05], [0.03, 0.04], [0.075, -0.04], [0.074, -0.042], [0.028, 0.038], [0.018, 0.048]])} material={m} castShadow />
				<mesh geometry={sphere(0.022)} position={[0, -0.02, 0]}>
					<meshBasicMaterial color={new THREE.Color('#ffd9a0').multiplyScalar(0.3 + on * 2.2)} toneMapped={false} />
				</mesh>
			</group>
		</group>
	);
};

export const PhotoFrame: React.FC<{position?: P3; rotation?: P3; scale?: number}> = ({position = [0, 0, 0], rotation = [0, 0, 0], scale = 1}) => {
	const pm = texMat('photo', () => new THREE.MeshStandardMaterial({map: familyPhoto(), roughness: 0.4}));
	return (
		<group position={position} rotation={rotation} scale={scale}>
			<mesh geometry={rbox(0.15, 0.19, 0.014, 0.004)} material={mat('#6b4a32', {rough: 0.5})} castShadow />
			<mesh geometry={plane(0.12, 0.155)} material={pm} position={[0, 0, 0.0075]} />
			<mesh geometry={box(0.012, 0.12, 0.01)} material={mat('#5a3e2a')} position={[0, -0.04, -0.04]} rotation={[0.45, 0, 0]} />
		</group>
	);
};

export const WallClock: React.FC<{position?: P3; rotationY?: number; seconds: number; r?: number}> = ({position = [0, 0, 0], rotationY = 0, seconds, r = 0.15}) => {
	const minute = (seconds / 3600) * Math.PI * 2;
	const hour = (seconds / 43200) * Math.PI * 2;
	const sec = (Math.floor(seconds) / 60) * Math.PI * 2;
	return (
		<group position={position} rotation={[0, rotationY, 0]}>
			<mesh geometry={cyl(r, r, 0.03, 40)} material={mat('#2b2724', {rough: 0.4})} rotation={[Math.PI / 2, 0, 0]} castShadow />
			<mesh geometry={cyl(r * 0.9, r * 0.9, 0.032, 40)} material={mat('#f3efe6', {rough: 0.6})} rotation={[Math.PI / 2, 0, 0]} />
			{new Array(12).fill(0).map((_, i) => (
				<mesh key={i} geometry={box(0.006, 0.02, 0.003)} material={mat('#333')} position={[Math.sin((i / 12) * Math.PI * 2) * r * 0.78, Math.cos((i / 12) * Math.PI * 2) * r * 0.78, 0.018]} rotation={[0, 0, -(i / 12) * Math.PI * 2]} />
			))}
			<group rotation={[0, 0, -hour]} position={[0, 0, 0.02]}>
				<mesh geometry={box(0.01, r * 0.5, 0.003)} material={mat('#222')} position={[0, r * 0.22, 0]} />
			</group>
			<group rotation={[0, 0, -minute]} position={[0, 0, 0.022]}>
				<mesh geometry={box(0.007, r * 0.75, 0.003)} material={mat('#222')} position={[0, r * 0.33, 0]} />
			</group>
			<group rotation={[0, 0, -sec]} position={[0, 0, 0.024]}>
				<mesh geometry={box(0.003, r * 0.8, 0.002)} material={mat('#b8453c')} position={[0, r * 0.3, 0]} />
			</group>
		</group>
	);
};

export const Chair: React.FC<{position?: P3; rotationY?: number}> = ({position = [0, 0, 0], rotationY = 0}) => {
	const wood = mat('#5e4330', {rough: 0.6});
	const seat = mat('#3a3f47', {rough: 0.9});
	return (
		<group position={position} rotation={[0, rotationY, 0]}>
			<mesh geometry={rbox(0.44, 0.05, 0.42, 0.02)} material={seat} position={[0, 0.405, 0]} castShadow receiveShadow />
			{[
				[-0.19, -0.18],
				[0.19, -0.18],
				[-0.19, 0.18],
				[0.19, 0.18],
			].map(([x, z], i) => (
				<mesh key={i} geometry={cyl(0.016, 0.014, 0.39, 10)} material={wood} position={[x, 0.195, z]} castShadow />
			))}
			{[-0.19, 0.19].map((x) => (
				<mesh key={x} geometry={cyl(0.015, 0.015, 0.5, 10)} material={wood} position={[x, 0.66, 0.19]} rotation={[-0.1, 0, 0]} castShadow />
			))}
			<mesh geometry={rbox(0.42, 0.16, 0.025, 0.012)} material={wood} position={[0, 0.83, 0.21]} rotation={[-0.1, 0, 0]} castShadow />
		</group>
	);
};

export const Desk: React.FC<{position?: P3; rotationY?: number; w?: number; d?: number; h?: number; color?: string}> = ({
	position = [0, 0, 0],
	rotationY = 0,
	w = 1.2,
	d = 0.6,
	h = 0.74,
	color = '#8b6447',
}) => {
	const wood = mat(color, {rough: 0.55});
	return (
		<group position={position} rotation={[0, rotationY, 0]}>
			<mesh geometry={rbox(w, 0.035, d, 0.008)} material={wood} position={[0, h - 0.0175, 0]} castShadow receiveShadow />
			{[
				[-w / 2 + 0.04, -d / 2 + 0.04],
				[w / 2 - 0.04, -d / 2 + 0.04],
				[-w / 2 + 0.04, d / 2 - 0.04],
				[w / 2 - 0.04, d / 2 - 0.04],
			].map(([x, z], i) => (
				<mesh key={i} geometry={box(0.04, h - 0.035, 0.04)} material={wood} position={[x, (h - 0.035) / 2, z]} castShadow />
			))}
			<mesh geometry={box(w - 0.1, 0.12, 0.02)} material={wood} position={[0, h - 0.1, -d / 2 + 0.05]} />
		</group>
	);
};

export const Bed: React.FC<{position?: P3; rotationY?: number}> = ({position = [0, 0, 0], rotationY = 0}) => {
	const frame = mat('#6b4c37', {rough: 0.6});
	const sheet = mat('#d8d4cc', {rough: 0.95});
	const blanket = mat('#5d6f86', {rough: 0.95});
	return (
		<group position={position} rotation={[0, rotationY, 0]}>
			<mesh geometry={rbox(1.0, 0.25, 2.0, 0.02)} material={frame} position={[0, 0.17, 0]} castShadow receiveShadow />
			<mesh geometry={rbox(0.96, 0.18, 1.94, 0.07)} material={sheet} position={[0, 0.37, 0]} castShadow receiveShadow />
			<mesh geometry={rbox(0.99, 0.08, 1.25, 0.04)} material={blanket} position={[0, 0.44, 0.35]} rotation={[0, 0.02, 0]} castShadow receiveShadow />
			<mesh geometry={rbox(0.55, 0.12, 0.34, 0.06)} material={mat('#efece6', {rough: 0.95})} position={[0, 0.5, -0.75]} rotation={[0.15, 0, 0]} castShadow />
			<mesh geometry={rbox(1.0, 0.75, 0.06, 0.02)} material={frame} position={[0, 0.42, -1.0]} castShadow />
		</group>
	);
};

export const Plant: React.FC<{position?: P3; scale?: number; seed?: number}> = ({position = [0, 0, 0], scale = 1, seed = 1}) => (
	<group position={position} scale={scale}>
		<mesh geometry={lathe('pot', [[0.001, 0], [0.09, 0], [0.12, 0.22], [0.125, 0.23], [0.001, 0.2]])} material={mat('#a5654a', {rough: 0.8})} castShadow />
		{new Array(7).fill(0).map((_, i) => {
			const a = (i / 7) * Math.PI * 2 + seed;
			return (
				<group key={i} position={[0, 0.2, 0]} rotation={[Math.cos(a) * 0.5, 0, Math.sin(a) * 0.5]}>
					<mesh geometry={sphere(0.06)} material={mat(i % 2 ? '#3d6b3f' : '#4d7d47', {rough: 0.7})} position={[0, 0.18 + rand(i + seed) * 0.12, 0]} scale={[0.6, 2.2, 0.25]} castShadow />
				</group>
			);
		})}
	</group>
);

export const Poster: React.FC<{position?: P3; rotationY?: number}> = ({position = [0, 0, 0], rotationY = 0}) => {
	const m = texMat('poster', () => new THREE.MeshStandardMaterial({map: posterTex(), roughness: 0.8}));
	return <mesh geometry={plane(0.5, 0.7)} material={m} position={position} rotation={[0, rotationY, 0]} />;
};

export const Calendar: React.FC<{position?: P3; rotationY?: number; day: number}> = ({position = [0, 0, 0], rotationY = 0, day}) => {
	const m = texMat(`cal-${day}`, () => new THREE.MeshStandardMaterial({map: calendarTex(day), roughness: 0.9}));
	return <mesh geometry={plane(0.3, 0.36)} material={m} position={position} rotation={[0, rotationY, 0]} />;
};

export const Backpack: React.FC<{position?: P3; rotation?: P3; color?: string}> = ({position = [0, 0, 0], rotation = [0, 0, 0], color = '#3d4a3f'}) => (
	<group position={position} rotation={rotation}>
		<mesh geometry={rbox(0.3, 0.42, 0.16, 0.07)} material={mat(color, {rough: 0.85})} castShadow />
		<mesh geometry={rbox(0.24, 0.18, 0.06, 0.04)} material={mat(color, {rough: 0.85})} position={[0, -0.08, 0.09]} />
		<mesh geometry={torus(0.06, 0.012, Math.PI, 8, 12)} material={mat('#2a2f2b')} position={[0, 0.21, 0]} />
	</group>
);

// ------------------------------------------------------------------ atmosphere

export const LightShaft: React.FC<{position: P3; rotation: P3; w: number; len: number; color: string; opacity: number}> = ({position, rotation, w, len, color, opacity}) => {
	const tex = shaftTex();
	return (
		<group position={position} rotation={rotation}>
			{[0, Math.PI / 2].map((r) => (
				<mesh key={r} geometry={plane(w, len)} position={[0, -len / 2, 0]} rotation={[0, r, 0]}>
					<meshBasicMaterial map={tex} color={color} transparent opacity={opacity} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} fog={false} />
				</mesh>
			))}
		</group>
	);
};

export const Dust: React.FC<{frame: number; center: P3; size: P3; count?: number; color?: string; opacity?: number; seed?: number}> = ({
	frame,
	center,
	size,
	count = 120,
	color = '#ffe8c0',
	opacity = 0.5,
	seed = 1,
}) => {
	const geo = useMemo(() => {
		const g = new THREE.BufferGeometry();
		g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(count * 3), 3));
		return g;
	}, [count]);
	const pos = geo.attributes.position as THREE.BufferAttribute;
	for (let i = 0; i < count; i++) {
		const t = frame / 30;
		const x = (rand(i + seed) - 0.5) * size[0] + Math.sin(t * 0.3 + i) * 0.05;
		const y = (((rand(i * 3 + seed) + t * 0.01 * (0.5 + rand(i))) % 1) - 0.5) * size[1];
		const z = (rand(i * 7 + seed) - 0.5) * size[2] + Math.cos(t * 0.25 + i * 2) * 0.05;
		pos.setXYZ(i, center[0] + x, center[1] + y, center[2] + z);
	}
	pos.needsUpdate = true;
	return (
		<points geometry={geo}>
			<pointsMaterial map={glowTex()} color={color} size={0.012} transparent opacity={opacity} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation toneMapped={false} />
		</points>
	);
};

export const Glow: React.FC<{position: P3; scale: number; color: string; opacity?: number}> = ({position, scale, color, opacity = 1}) => (
	<sprite position={position} scale={[scale, scale, scale]}>
		<spriteMaterial map={glowTex()} color={color} transparent opacity={opacity} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} fog={false} />
	</sprite>
);

export const SkyDome: React.FC<{top: string; mid: string; bottom: string; id: string; r?: number}> = ({top, mid, bottom, id, r = 90}) => {
	const tex = skyTex(top, mid, bottom, id);
	return (
		<mesh geometry={sphere(r, 32, 16)} scale={[1, 1, 1]}>
			<meshBasicMaterial map={tex} side={THREE.BackSide} fog={false} toneMapped={false} depthWrite={false} />
		</mesh>
	);
};

// ------------------------------------------------------------------ outdoors

export const Tree: React.FC<{position?: P3; scale?: number; seed?: number; color?: string}> = ({position = [0, 0, 0], scale = 1, seed = 1, color = '#4a6b3a'}) => {
	const c2 = new THREE.Color(color).multiplyScalar(0.8).getStyle();
	return (
		<group position={position} scale={scale}>
			<mesh geometry={taper(0.12, 0.08, 2.2, 10)} material={mat('#5a4434', {rough: 0.9})} position={[0, 2.2, 0]} castShadow />
			{[0, 1, 2, 3, 4].map((i) => (
				<mesh
					key={i}
					geometry={blob(seed * 10 + i, 1, 2, 0.22)}
					material={mat(i % 2 ? color : c2, {rough: 0.85})}
					position={[(rand(seed + i) - 0.5) * 1.4, 2.6 + rand(seed * 2 + i) * 1.1, (rand(seed * 3 + i) - 0.5) * 1.4]}
					scale={0.75 + rand(seed + i * 7) * 0.45}
					castShadow
					receiveShadow
				/>
			))}
		</group>
	);
};

export const Bush: React.FC<{position?: P3; scale?: number; seed?: number}> = ({position = [0, 0, 0], scale = 1, seed = 1}) => (
	<group position={position} scale={scale}>
		{[0, 1, 2].map((i) => (
			<mesh key={i} geometry={blob(seed * 7 + i, 0.35, 2, 0.25)} material={mat(i % 2 ? '#4f7340' : '#3e5f34', {rough: 0.85})} position={[(i - 1) * 0.35, 0.28 + rand(seed + i) * 0.1, rand(i) * 0.1]} castShadow receiveShadow />
		))}
	</group>
);

export const StreetLamp: React.FC<{position?: P3; rotationY?: number; on?: number; h?: number}> = ({position = [0, 0, 0], rotationY = 0, on = 0, h = 4.2}) => (
	<group position={position} rotation={[0, rotationY, 0]}>
		<mesh geometry={cyl(0.05, 0.07, h, 10)} material={mat('#5d6166', {rough: 0.5, metal: 0.4})} position={[0, h / 2, 0]} castShadow />
		<mesh geometry={cyl(0.03, 0.03, 0.9, 8)} material={mat('#5d6166', {rough: 0.5, metal: 0.4})} position={[0, h - 0.05, 0.42]} rotation={[Math.PI / 2, 0, 0]} />
		<mesh geometry={rbox(0.22, 0.08, 0.4, 0.03)} material={mat('#4a4d52', {rough: 0.5})} position={[0, h - 0.08, 0.85]} />
		<mesh geometry={plane(0.18, 0.34)} position={[0, h - 0.125, 0.85]} rotation={[Math.PI / 2, 0, 0]}>
			<meshBasicMaterial color={new THREE.Color('#ffd49a').multiplyScalar(0.25 + on * 2.5)} toneMapped={false} side={THREE.DoubleSide} />
		</mesh>
		{on > 0.05 ? <Glow position={[0, h - 0.2, 0.85]} scale={1.6} color="#ffcf8a" opacity={on * 0.55} /> : null}
	</group>
);

export const PowerPole: React.FC<{position?: P3; h?: number}> = ({position = [0, 0, 0], h = 7}) => (
	<group position={position}>
		<mesh geometry={cyl(0.08, 0.11, h, 8)} material={mat('#8a8a85', {rough: 0.8})} position={[0, h / 2, 0]} castShadow />
		<mesh geometry={box(1.2, 0.08, 0.08)} material={mat('#6a6a66', {rough: 0.7})} position={[0, h - 0.4, 0]} />
		<mesh geometry={cyl(0.14, 0.14, 0.4, 10)} material={mat('#7d7f80', {rough: 0.6})} position={[0.3, h - 1.0, 0.1]} />
	</group>
);

// A wire hanging between two points (catenary approx)
export const Wire: React.FC<{a: P3; b: P3; sag?: number}> = ({a, b, sag = 0.4}) => {
	const geo = useMemo(() => {
		const pts: THREE.Vector3[] = [];
		for (let i = 0; i <= 16; i++) {
			const t = i / 16;
			pts.push(new THREE.Vector3(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - Math.sin(t * Math.PI) * sag, a[2] + (b[2] - a[2]) * t));
		}
		return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.012, 4, false);
	}, [a, b, sag]);
	return <mesh geometry={geo} material={mat('#1d1d1d', {rough: 0.6})} />;
};

export type HouseStyle = {wall: string; roof: string; trim: string; door: string; w: number; d: number; h: number; lit: number; fence?: boolean; seed: number};

export const House: React.FC<{position?: P3; rotationY?: number; s: HouseStyle; dream?: number}> = ({position = [0, 0, 0], rotationY = 0, s, dream = 0}) => {
	const wall = mat(s.wall, {rough: 0.9});
	const roof = mat(s.roof, {rough: 0.75});
	const trim = mat(s.trim, {rough: 0.7});
	const winLit = s.lit;
	const winCol = new THREE.Color('#ffc983').multiplyScalar(0.15 + winLit * 2.0);
	const roofGeo = useMemo(() => {
		const shape = new THREE.Shape();
		shape.moveTo(-s.w / 2 - 0.35, 0);
		shape.lineTo(0, s.h * 0.45);
		shape.lineTo(s.w / 2 + 0.35, 0);
		shape.lineTo(-s.w / 2 - 0.35, 0);
		const g = new THREE.ExtrudeGeometry(shape, {depth: s.d + 0.6, bevelEnabled: false});
		g.translate(0, 0, -(s.d + 0.6) / 2);
		return g;
	}, [s.w, s.d, s.h]);
	const roofTop = mat(s.roof, {rough: 0.75});
	return (
		<group position={position} rotation={[0, rotationY, 0]}>
			{/* foundation */}
			<mesh geometry={box(s.w + 0.1, 0.25, s.d + 0.1)} material={mat('#8f8a82', {rough: 0.9})} position={[0, 0.125, 0]} receiveShadow castShadow />
			<mesh geometry={box(s.w, s.h, s.d)} material={wall} position={[0, 0.25 + s.h / 2, 0]} castShadow receiveShadow />
			<mesh geometry={roofGeo} material={roofTop} position={[0, 0.25 + s.h, 0]} castShadow receiveShadow />
			{/* fascia */}
			<mesh geometry={box(s.w + 0.75, 0.08, 0.06)} material={trim} position={[0, 0.25 + s.h + 0.02, s.d / 2 + 0.3]} />
			{/* door */}
			<mesh geometry={box(0.85, 1.95, 0.06)} material={mat(s.door, {rough: 0.6})} position={[-s.w * 0.18, 0.25 + 0.975, s.d / 2 + 0.02]} castShadow />
			<mesh geometry={sphere(0.025)} material={mat('#c9a65a', {metal: 0.8, rough: 0.3})} position={[-s.w * 0.18 + 0.32, 1.2, s.d / 2 + 0.06]} />
			{/* windows */}
			{[s.w * 0.22].map((x) => (
				<group key={x} position={[x, 1.45, s.d / 2 + 0.02]}>
					<mesh geometry={box(1.15, 1.0, 0.06)} material={trim} />
					<mesh geometry={plane(1.0, 0.86)} position={[0, 0, 0.035]}>
						<meshBasicMaterial color={winCol} toneMapped={false} />
					</mesh>
					<mesh geometry={box(0.04, 0.86, 0.02)} material={trim} position={[0, 0, 0.045]} />
					<mesh geometry={box(1.0, 0.04, 0.02)} material={trim} position={[0, 0.1, 0.045]} />
					{winLit > 0.2 ? <Glow position={[0, 0, 0.3]} scale={2.2} color="#ffb86b" opacity={winLit * 0.35 + dream * 0.3} /> : null}
				</group>
			))}
			{/* terrace roof */}
			<mesh geometry={box(s.w, 0.06, 1.2)} material={roof} position={[0, 2.45, s.d / 2 + 0.6]} rotation={[0.12, 0, 0]} castShadow />
			{[-s.w / 2 + 0.12, s.w / 2 - 0.12].map((x) => (
				<mesh key={x} geometry={cyl(0.06, 0.06, 2.2, 8)} material={trim} position={[x, 1.35, s.d / 2 + 1.1]} castShadow />
			))}
			{s.fence ? (
				<group position={[0, 0, s.d / 2 + 2.6]}>
					<mesh geometry={box(s.w + 0.6, 0.5, 0.18)} material={mat('#d9d2c4', {rough: 0.9})} position={[0, 0.25, 0]} castShadow receiveShadow />
					{new Array(Math.floor((s.w + 0.6) / 0.16)).fill(0).map((_, i) => (
						<mesh key={i} geometry={box(0.03, 0.6, 0.03)} material={mat('#2e3436', {rough: 0.5, metal: 0.4})} position={[-(s.w + 0.6) / 2 + 0.08 + i * 0.16, 0.8, 0]} />
					))}
					<mesh geometry={box(s.w + 0.6, 0.04, 0.04)} material={mat('#2e3436', {rough: 0.5, metal: 0.4})} position={[0, 1.08, 0]} />
				</group>
			) : null}
		</group>
	);
};

export const houseStyles: HouseStyle[] = [
	{wall: '#e3d6bf', roof: '#8c4a36', trim: '#f2ede4', door: '#6b4a34', w: 6, d: 6, h: 2.8, lit: 0, fence: true, seed: 1},
	{wall: '#c9d6cf', roof: '#5b5450', trim: '#eeeeea', door: '#4b5a62', w: 5.5, d: 6, h: 2.7, lit: 0, fence: true, seed: 2},
	{wall: '#ead7b0', roof: '#9a5638', trim: '#f4efe6', door: '#7a3b2f', w: 6.4, d: 6, h: 2.9, lit: 0, fence: true, seed: 3},
	{wall: '#d8c2b0', roof: '#6e4234', trim: '#efe9df', door: '#5a4636', w: 5.8, d: 6, h: 2.8, lit: 0, fence: true, seed: 4},
	{wall: '#bfc8d4', roof: '#7a4a3a', trim: '#f0ede6', door: '#3e4c5a', w: 6.0, d: 6, h: 2.75, lit: 0, fence: true, seed: 5},
];

export const Shop: React.FC<{position?: P3; rotationY?: number; w: number; wall: string; sign: string; signBg: string; signFg: string; awning: string; lit?: number}> = ({
	position = [0, 0, 0],
	rotationY = 0,
	w,
	wall,
	sign,
	signBg,
	signFg,
	awning,
	lit = 0,
}) => {
	const st = texMat(`sign-${sign}`, () => new THREE.MeshStandardMaterial({map: signTex(sign, signBg, signFg), roughness: 0.6, emissive: '#ffffff', emissiveMap: signTex(sign, signBg, signFg), emissiveIntensity: 0.15}));
	const upper = texMat(`upper-${sign}`, () => new THREE.MeshStandardMaterial({color: '#223', emissive: '#ffffff', emissiveMap: windowsTex(sign.length, 0.5), emissiveIntensity: 0.0, roughness: 0.4}));
	return (
		<group position={position} rotation={[0, rotationY, 0]}>
			<mesh geometry={box(w, 7, 5)} material={mat(wall, {rough: 0.9})} position={[0, 3.5, -2.5]} castShadow receiveShadow />
			{/* shopfront glass */}
			<mesh geometry={plane(w - 0.6, 2.4)} position={[0, 1.4, 0.01]}>
				<meshStandardMaterial color="#1b2430" roughness={0.15} metalness={0.6} emissive="#ffd9a0" emissiveIntensity={0.08 + lit * 0.6} />
			</mesh>
			<mesh geometry={box(w - 0.4, 0.1, 0.1)} material={mat('#3a3a3a')} position={[0, 2.62, 0.05]} />
			{/* sign */}
			<mesh geometry={plane(w * 0.8, w * 0.2)} material={st} position={[0, 3.4, 0.03]} />
			{/* awning */}
			<mesh geometry={box(w, 0.05, 1.3)} material={mat(awning, {rough: 0.8})} position={[0, 2.9, 0.6]} rotation={[0.25, 0, 0]} castShadow />
			{/* upper windows */}
			{[-w / 4, w / 4].map((x) => (
				<mesh key={x} geometry={plane(1.1, 1.3)} material={upper} position={[x, 5.0, 0.02]} />
			))}
		</group>
	);
};

export const Motorbike: React.FC<{position?: P3; rotationY?: number; color?: string}> = ({position = [0, 0, 0], rotationY = 0, color = '#a33a35'}) => {
	const dark = mat('#1c1c1e', {rough: 0.6});
	return (
		<group position={position} rotation={[0, rotationY, 0]}>
			{[-0.62, 0.62].map((z) => (
				<mesh key={z} geometry={torus(0.26, 0.06, Math.PI * 2, 10, 24)} material={dark} position={[0, 0.3, z]} rotation={[0, Math.PI / 2, 0]} castShadow />
			))}
			<mesh geometry={rbox(0.32, 0.3, 1.0, 0.12)} material={mat(color, {rough: 0.35, metal: 0.2})} position={[0, 0.58, -0.05]} castShadow />
			<mesh geometry={rbox(0.3, 0.1, 0.6, 0.05)} material={dark} position={[0, 0.78, -0.2]} />
			<mesh geometry={rbox(0.3, 0.55, 0.15, 0.06)} material={mat(color, {rough: 0.35, metal: 0.2})} position={[0, 0.75, 0.55]} rotation={[-0.3, 0, 0]} castShadow />
			<mesh geometry={cyl(0.015, 0.015, 0.6, 6)} material={mat('#888', {metal: 0.8, rough: 0.3})} position={[0, 1.05, 0.6]} rotation={[0, 0, Math.PI / 2]} />
		</group>
	);
};

export const BusStop: React.FC<{position?: P3; rotationY?: number}> = ({position = [0, 0, 0], rotationY = 0}) => {
	const metal = mat('#4c555c', {rough: 0.5, metal: 0.5});
	return (
		<group position={position} rotation={[0, rotationY, 0]}>
			{[-1.3, 1.3].map((x) => (
				<mesh key={x} geometry={cyl(0.04, 0.04, 2.5, 8)} material={metal} position={[x, 1.25, -0.4]} castShadow />
			))}
			<mesh geometry={box(3.0, 0.08, 1.3)} material={metal} position={[0, 2.52, -0.1]} rotation={[-0.08, 0, 0]} castShadow />
			<mesh geometry={plane(2.6, 1.6)} position={[0, 1.4, -0.45]}>
				<meshStandardMaterial color="#9fb3c2" transparent opacity={0.25} roughness={0.1} />
			</mesh>
			<mesh geometry={rbox(2.2, 0.06, 0.4, 0.02)} material={mat('#8b6447', {rough: 0.6})} position={[0, 0.46, -0.2]} castShadow receiveShadow />
			{[-0.9, 0.9].map((x) => (
				<mesh key={x} geometry={box(0.05, 0.45, 0.35)} material={metal} position={[x, 0.22, -0.2]} />
			))}
		</group>
	);
};

export const Ground: React.FC<{size?: number; color?: string; map?: THREE.Texture; position?: P3}> = ({size = 200, color = '#6d6a62', map, position = [0, 0, 0]}) => (
	<mesh geometry={plane(size, size)} rotation={[-Math.PI / 2, 0, 0]} position={position} receiveShadow>
		<meshStandardMaterial color={color} map={map ?? null} roughness={0.95} />
	</mesh>
);

// Phone held in the hand (attach via Character leftHand/rightHand). Screen faces the palm direction.
export const Phone: React.FC<{time: string; sub?: string; glow?: number}> = ({time, sub = 'Selasa, 25 November', glow = 1}) => (
	<group position={[0, -0.03, 0.012]}>
		<mesh geometry={rbox(0.072, 0.15, 0.009, 0.008)} material={mat('#1b1c20', {rough: 0.3, metal: 0.4})} />
		<mesh geometry={plane(0.064, 0.138)} position={[0, 0, 0.0051]}>
			<meshBasicMaterial map={phoneTexCached(time, sub)} toneMapped={false} color={new THREE.Color(glow, glow, glow)} />
		</mesh>
	</group>
);

import {phoneTex} from './textures';
const phoneTexCached = (t: string, s: string) => phoneTex(t, s);

// Backpack worn on the back with straps over the shoulders. Use in Character `back` slot.
export const BackpackWorn: React.FC<{color?: string}> = ({color = '#3d4a3f'}) => {
	const strap = useMemo(() => {
		return [1, -1].map((s) => {
			const pts = [
				[s * 0.1, 0.05, 0.08],
				[s * 0.1, 0.185, 0.17],
				[s * 0.105, 0.14, 0.31],
				[s * 0.11, -0.04, 0.335],
				[s * 0.12, -0.2, 0.32],
			].map((p) => new THREE.Vector3(p[0], p[1], p[2]));
			return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, 0.012, 6, false);
		});
	}, []);
	return (
		<group>
			<Backpack color={color} />
			{strap.map((g, i) => (
				<mesh key={i} geometry={g} material={mat('#2a2f2b', {rough: 0.8})} scale={[1, 1, 1]} castShadow />
			))}
		</group>
	);
};

// Plastic bag (kresek) with oranges, hanging from the hand.
export const GiftBag: React.FC = () => (
	<group position={[0, -0.04, 0.0]}>
		<mesh geometry={torus(0.035, 0.006, Math.PI, 6, 12)} material={mat('#f2efe8', {rough: 0.6})} rotation={[0, Math.PI / 2, 0]} position={[0, -0.03, 0]} />
		<mesh geometry={lathe('kresek', [[0.03, -0.06], [0.09, -0.12], [0.13, -0.22], [0.12, -0.32], [0.001, -0.34]], 18)} material={mat('#f4f1ea', {rough: 0.55, transparent: true, opacity: 0.88})} scale={[1, 1, 0.75]} castShadow />
		{[
			[0.03, -0.13, 0.02],
			[-0.04, -0.14, -0.01],
			[0.0, -0.12, -0.04],
		].map((p, i) => (
			<mesh key={i} geometry={sphere(0.04)} material={mat('#e98a2a', {rough: 0.55})} position={p as P3} />
		))}
	</group>
);

export const HeldMug: React.FC = () => (
	<group position={[0, -0.02, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
		<Mug position={[0, -0.05, 0]} />
	</group>
);
