import {useMemo} from 'react';
import * as THREE from 'three';
import {flicker, mulberry32} from '../lib/anim';
import {beamTex, glowTex} from '../lib/textures';

/*
 World layout (units ~ 0.8 m):
 - Tunnel along X: x -16..26, floor y=0, walls z = +-3.8, ceiling ~4.4
 - Door (stone slab) at x = -14, daylight beyond (x < -14)
 - Treasure chamber: x 26..46, z -8..8, ceiling ~9, chest at CHEST_POS
*/
export const CHEST_POS: [number, number, number] = [36, 0.42, -1.5];
export const DOOR_X = -14;
export const BEAMS_X = [-12, -6, 0, 6, 12, 18, 24];
export const LANTERNS: [number, number, number][] = [
	[-12, 2.6, -3.1],
	[-6, 2.6, 3.1],
	[0, 2.6, -3.1],
	[6, 2.6, 3.1],
	[12, 2.6, -3.1],
	[18, 2.6, 3.1],
	[24, 2.6, -3.1],
	[30, 3.0, -5.6],
	[42, 3.0, -5.2],
];

const CRYSTALS: {p: [number, number, number]; s: number; r: number; c: string}[] = (() => {
	const rnd = mulberry32(99);
	const out: {p: [number, number, number]; s: number; r: number; c: string}[] = [];
	const cols = ['#58e8ff', '#b06bff', '#6bffcf'];
	for (let i = 0; i < 46; i++) {
		const a = rnd() * Math.PI * 2;
		const onCeil = rnd() < 0.35;
		const rad = onCeil ? 2 + rnd() * 5 : 6.2 + rnd() * 0.8;
		const x = 36 + Math.cos(a) * rad * 1.15;
		const z = -1 + Math.sin(a) * rad * 0.9;
		if (z > 4.5 && !onCeil) continue;
		out.push({
			p: [x, onCeil ? 8.2 - rnd() * 0.6 : rnd() * 6, z],
			s: 0.25 + rnd() * 0.55,
			r: rnd() * Math.PI,
			c: cols[i % 3],
		});
	}
	return out;
})();

const buildRocks = () => {
	const rnd = mulberry32(7);
	const items: {p: THREE.Vector3; s: THREE.Vector3; r: THREE.Euler; c: THREE.Color}[] = [];
	const base = [new THREE.Color('#5a4636'), new THREE.Color('#4a3a30'), new THREE.Color('#665040'), new THREE.Color('#3e332c')];
	const add = (x: number, y: number, z: number, s: number) => {
		const c = base[Math.floor(rnd() * base.length)].clone().multiplyScalar(0.85 + rnd() * 0.3);
		items.push({
			p: new THREE.Vector3(x, y, z),
			s: new THREE.Vector3(s * (0.8 + rnd() * 0.5), s * (0.7 + rnd() * 0.5), s * (0.8 + rnd() * 0.5)),
			r: new THREE.Euler(rnd() * 3, rnd() * 3, rnd() * 3),
			c,
		});
	};
	// tunnel walls + ceiling
	for (let x = -22; x <= 27; x += 0.85) {
		for (const side of [-1, 1]) {
			for (let y = -0.2; y <= 4.6; y += 0.85) {
				add(x + rnd() * 0.4, y + rnd() * 0.3, side * (3.9 + rnd() * 0.6), 0.6 + rnd() * 0.45);
			}
		}
		for (let z = -3.6; z <= 3.6; z += 0.9) {
			add(x + rnd() * 0.4, 4.6 + rnd() * 0.5, z + rnd() * 0.3, 0.6 + rnd() * 0.4);
		}
	}
	// chamber dome
	for (let a = 0; a < Math.PI * 2; a += 0.11) {
		for (let y = -0.2; y <= 9; y += 0.95) {
			const k = 1 - Math.pow(Math.max(0, y - 4) / 6, 2) * 0.55;
			const x = 36 + Math.cos(a) * 9.6 * k;
			const z = -1 + Math.sin(a) * 7.8 * k;
			if (x < 27.5 && Math.abs(z) < 3.9 && y < 4.4) continue; // tunnel mouth
			add(x + rnd() * 0.5, y + rnd() * 0.4, z + rnd() * 0.5, 0.85 + rnd() * 0.6);
		}
	}
	for (let x = 27; x <= 46; x += 1.2) {
		for (let z = -8.5; z <= 7; z += 1.2) {
			const d = Math.hypot((x - 36) / 9.6, (z + 1) / 7.8);
			if (d > 1.05) continue;
			if (Math.abs(x - 36) < 1.2 && Math.abs(z + 1.5) < 1.2) continue; // skylight crack
			add(x + rnd() * 0.5, 9.2 + rnd() * 0.5 - d * 1.5, z + rnd() * 0.5, 0.9 + rnd() * 0.5);
		}
	}
	// floor pebbles + boulders
	for (let i = 0; i < 160; i++) {
		const x = -16 + rnd() * 58;
		const zl = x > 27 ? 7 : 3.4;
		const z = -zl + rnd() * zl * 2;
		if (Math.abs(z - 1.8) < 0.7 && x < 27) continue; // rails
		if (Math.abs(z + 1.1) < 1.4 && x < 27) continue; // walking path
		if (Math.hypot(x - 36, z + 1.5) < 2.6) continue; // chest area
		add(x, 0, z, 0.1 + rnd() * 0.25);
	}
	return items;
};

const Rocks = () => {
	const mesh = useMemo(() => {
		const items = buildRocks();
		const geo = new THREE.DodecahedronGeometry(1, 0);
		const mat = new THREE.MeshLambertMaterial({flatShading: true});
		const m = new THREE.InstancedMesh(geo, mat, items.length);
		const o = new THREE.Object3D();
		items.forEach((it, i) => {
			o.position.copy(it.p);
			o.scale.copy(it.s);
			o.rotation.copy(it.r);
			o.updateMatrix();
			m.setMatrixAt(i, o.matrix);
			m.setColorAt(i, it.c);
		});
		m.instanceMatrix.needsUpdate = true;
		if (m.instanceColor) m.instanceColor.needsUpdate = true;
		m.frustumCulled = false;
		return m;
	}, []);
	return <primitive object={mesh} />;
};

const WOOD = '#6e4527';
const WOOD_D = '#4c2f1b';

const Beams = () => (
	<group>
		{BEAMS_X.map((x) => (
			<group key={x} position={[x, 0, 0]}>
				<mesh position={[0, 1.9, -3.4]}>
					<boxGeometry args={[0.32, 3.8, 0.32]} />
					<meshLambertMaterial color={WOOD} />
				</mesh>
				<mesh position={[0, 1.9, 3.4]}>
					<boxGeometry args={[0.32, 3.8, 0.32]} />
					<meshLambertMaterial color={WOOD} />
				</mesh>
				<mesh position={[0, 3.95, 0]}>
					<boxGeometry args={[0.36, 0.36, 7.4]} />
					<meshLambertMaterial color={WOOD_D} />
				</mesh>
			</group>
		))}
		{/* foreground posts near the camera side for parallax */}
		{[-9, -3, 3, 9, 15, 21].map((x) => (
			<mesh key={x} position={[x, 1.9, 2.95]}>
				<boxGeometry args={[0.22, 3.8, 0.22]} />
				<meshLambertMaterial color={WOOD_D} />
			</mesh>
		))}
	</group>
);

const Rails = () => {
	const ties = useMemo(() => {
		const out: number[] = [];
		for (let x = -13.5; x < 27; x += 0.7) out.push(x);
		return out;
	}, []);
	return (
		<group>
			{[1.45, 2.15].map((z) => (
				<mesh key={z} position={[6.5, 0.1, z]}>
					<boxGeometry args={[41, 0.08, 0.07]} />
					<meshLambertMaterial color="#8d939c" />
				</mesh>
			))}
			{ties.map((x) => (
				<mesh key={x} position={[x, 0.04, 1.8]}>
					<boxGeometry args={[0.22, 0.07, 1.1]} />
					<meshLambertMaterial color={WOOD_D} />
				</mesh>
			))}
			{/* mine cart */}
			<group position={[9.5, 0, 1.8]}>
				<mesh position={[0, 0.65, 0]}>
					<boxGeometry args={[1.5, 0.75, 1.0]} />
					<meshLambertMaterial color="#5d636d" flatShading />
				</mesh>
				<mesh position={[0, 1.0, 0]}>
					<boxGeometry args={[1.3, 0.1, 0.8]} />
					<meshLambertMaterial color="#2c241c" />
				</mesh>
				{[-0.5, 0.5].map((x) =>
					[-0.5, 0.5].map((z) => (
						<mesh key={`${x}${z}`} position={[x, 0.2, z]} rotation-x={Math.PI / 2}>
							<cylinderGeometry args={[0.18, 0.18, 0.08, 12]} />
							<meshLambertMaterial color="#2b2b30" />
						</mesh>
					)),
				)}
			</group>
		</group>
	);
};

const Lanterns = ({frame}: {frame: number}) => (
	<group>
		{LANTERNS.map((p, i) => {
			const k = flicker(frame, i * 1.3);
			return (
				<group key={i} position={p}>
					<mesh>
						<boxGeometry args={[0.26, 0.36, 0.26]} />
						<meshLambertMaterial color="#2a2018" />
					</mesh>
					<mesh>
						<sphereGeometry args={[0.13, 10, 8]} />
						<meshBasicMaterial color="#ffd27a" />
					</mesh>
					<sprite scale={2.1 * k}>
						<spriteMaterial
							map={glowTex()}
							color="#ffae4a"
							transparent
							opacity={0.55}
							blending={THREE.AdditiveBlending}
							depthWrite={false}
						/>
					</sprite>
				</group>
			);
		})}
	</group>
);

const Crystals = ({frame}: {frame: number}) => (
	<group>
		{CRYSTALS.map((c, i) => (
			<group key={i} position={c.p} rotation={[c.r * 0.3, c.r, c.r * 0.5]}>
				<mesh scale={[c.s * 0.45, c.s * 1.5, c.s * 0.45]}>
					<octahedronGeometry args={[1, 0]} />
					<meshLambertMaterial color={c.c} emissive={c.c} emissiveIntensity={0.55 + 0.15 * Math.sin(frame * 0.08 + i)} flatShading />
				</mesh>
			</group>
		))}
		{CRYSTALS.filter((_, i) => i % 3 === 0).map((c, i) => (
			<sprite key={`g${i}`} position={c.p} scale={c.s * 3}>
				<spriteMaterial
					map={glowTex()}
					color={c.c}
					transparent
					opacity={0.35}
					blending={THREE.AdditiveBlending}
					depthWrite={false}
				/>
			</sprite>
		))}
	</group>
);

/** Camera-facing additive glow sprite. */
export const Glow = ({
	position,
	size,
	color,
	opacity,
}: {
	position: [number, number, number];
	size: number;
	color: string;
	opacity: number;
}) => (
	<sprite position={position} scale={size}>
		<spriteMaterial
			map={glowTex()}
			color={color}
			transparent
			opacity={opacity}
			blending={THREE.AdditiveBlending}
			depthWrite={false}
			fog={false}
		/>
	</sprite>
);

export const Cave = ({
	frame,
	doorOpen = 1,
	skyBeam = 1,
}: {
	frame: number;
	doorOpen?: number; // 1 = open (raised), 0 = closed
	skyBeam?: number;
}) => {
	const doorY = 2.2 + doorOpen * 4.4;
	return (
		<group>
			<mesh rotation-x={-Math.PI / 2} position={[14, 0, 0]}>
				<planeGeometry args={[80, 30]} />
				<meshLambertMaterial color="#3d2f25" />
			</mesh>
			{/* lighter dirt path */}
			<mesh rotation-x={-Math.PI / 2} position={[6, 0.005, -1.1]}>
				<planeGeometry args={[44, 2.6]} />
				<meshLambertMaterial color="#54402f" />
			</mesh>
			<Rocks />
			<Beams />
			<Rails />
			<Lanterns frame={frame} />
			<Crystals frame={frame} />
			{/* door frame + slab */}
			<group position={[DOOR_X, 0, 0]}>
				<mesh position={[0, 5.2, 0]}>
					<boxGeometry args={[1.0, 1.6, 8.4]} />
					<meshLambertMaterial color="#3f352e" flatShading />
				</mesh>
				<mesh position={[0.05, doorY, 0]}>
					<boxGeometry args={[0.55, 4.4, 7.6]} />
					<meshLambertMaterial color="#6d6158" flatShading />
				</mesh>
				{[-2.4, 0, 2.4].map((z) => (
					<mesh key={z} position={[0.36, doorY, z]}>
						<boxGeometry args={[0.1, 4.2, 0.12]} />
						<meshLambertMaterial color="#4a413b" />
					</mesh>
				))}
			</group>
			{/* daylight outside */}
			<mesh position={[DOOR_X - 4, 2.5, 0]} rotation-y={Math.PI / 2}>
				<planeGeometry args={[12, 8]} />
				<meshBasicMaterial color="#fff0cf" fog={false} />
			</mesh>
			{/* chamber skylight beam */}
			<mesh position={[CHEST_POS[0], 4.6, CHEST_POS[2]]}>
				<cylinderGeometry args={[0.55, 1.7, 9.2, 20, 1, true]} />
				<meshBasicMaterial
					map={beamTex()}
					color="#bfe6ff"
					transparent
					opacity={0.16 * skyBeam}
					blending={THREE.AdditiveBlending}
					depthWrite={false}
					side={THREE.DoubleSide}
				/>
			</mesh>
			{/* rock pedestal */}
			<mesh position={[CHEST_POS[0], 0.2, CHEST_POS[2]]}>
				<cylinderGeometry args={[0.9, 1.1, 0.42, 9]} />
				<meshLambertMaterial color="#5c4a3c" flatShading />
			</mesh>
		</group>
	);
};

export type LightSpec = {p: [number, number, number]; c: string; i: number; d?: number};

/** Exactly 4 point lights every shot (constant count = no shader recompiles). */
export const ShotLights = ({
	lights,
	hemi = 0.55,
	sky = '#56607e',
	ground = '#2b2018',
}: {
	lights: LightSpec[];
	hemi?: number;
	sky?: string;
	ground?: string;
}) => {
	const L = [...lights];
	while (L.length < 4) L.push({p: [0, -50, 0], c: '#000000', i: 0});
	return (
		<>
			<hemisphereLight args={[sky, ground, hemi]} />
			{L.slice(0, 4).map((l, i) => (
				<pointLight key={i} position={l.p} color={l.c} intensity={l.i} distance={l.d ?? 14} decay={1.4} />
			))}
		</>
	);
};
