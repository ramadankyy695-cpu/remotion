import {useMemo} from 'react';
import * as THREE from 'three';
import {mulberry32, type V3} from '../lib/anim';
import {glowTex, nightSkyTex, phoneTex, type PhoneMode, posterTex, woodTex} from '../lib/textures';
import {MESSAGE_TEXT} from '../timeline';

const GOLD = '#ffc531';

/** Treasure chest. open: 0..1 lid angle, glow: 0..1 inner light. */
export const Chest = ({
	position,
	open,
	glow,
	scale = 1,
	yaw = 0,
	tilt = 0,
}: {
	position: V3;
	open: number;
	glow: number;
	scale?: number;
	yaw?: number;
	tilt?: number;
}) => {
	const coins = useMemo(() => {
		const r = mulberry32(5);
		return new Array(26).fill(0).map(() => ({
			p: [(r() - 0.5) * 0.7, 0.42 + r() * 0.1, (r() - 0.5) * 0.4] as V3,
			rot: r() * 3,
			gem: r() < 0.28,
			c: ['#ff3b6b', '#38e1ff', '#7dff6a'][Math.floor(r() * 3)],
		}));
	}, []);
	return (
		<group position={position} rotation={[0, yaw, tilt]} scale={scale}>
			<mesh position={[0, 0.22, 0]}>
				<boxGeometry args={[0.95, 0.44, 0.6]} />
				<meshLambertMaterial color="#7a4421" flatShading />
			</mesh>
			{[-0.36, 0.36].map((x) => (
				<mesh key={x} position={[x, 0.22, 0]}>
					<boxGeometry args={[0.07, 0.46, 0.62]} />
					<meshLambertMaterial color={GOLD} emissive={GOLD} emissiveIntensity={0.25} />
				</mesh>
			))}
			{glow > 0
				? coins.map((c, i) => (
						<mesh key={i} position={c.p} rotation={[c.rot, c.rot * 2, 0]}>
							{c.gem ? <octahedronGeometry args={[0.07, 0]} /> : <cylinderGeometry args={[0.06, 0.06, 0.02, 10]} />}
							<meshBasicMaterial color={c.gem ? c.c : GOLD} />
						</mesh>
					))
				: null}
			{/* lid hinged at back edge */}
			<group position={[0, 0.44, -0.3]} rotation-x={-open * 1.9}>
				<mesh position={[0, 0.06, 0.3]} rotation-z={Math.PI / 2}>
					<cylinderGeometry args={[0.3, 0.3, 0.95, 12, 1, false, 0, Math.PI]} />
					<meshLambertMaterial color="#8a4d25" flatShading side={THREE.DoubleSide} />
				</mesh>
				<mesh position={[0, 0.02, 0.6]}>
					<boxGeometry args={[0.18, 0.2, 0.05]} />
					<meshLambertMaterial color={GOLD} emissive={GOLD} emissiveIntensity={0.3} />
				</mesh>
			</group>
			{glow > 0 ? (
				<sprite position={[0, 0.7, 0]} scale={1.5 * glow}>
					<spriteMaterial
						map={glowTex()}
						color="#ffcf5a"
						transparent
						opacity={0.85 * glow}
						blending={THREE.AdditiveBlending}
						depthWrite={false}
					/>
				</sprite>
			) : null}
		</group>
	);
};

export const Gem = ({position, s = 1, spin = 0}: {position: V3; s?: number; spin?: number}) => (
	<group position={position} rotation-y={spin} scale={s}>
		<mesh scale={[0.11, 0.16, 0.11]}>
			<octahedronGeometry args={[1, 0]} />
			<meshLambertMaterial color="#3ae3ff" emissive="#3ae3ff" emissiveIntensity={0.9} flatShading />
		</mesh>
		<sprite scale={0.9}>
			<spriteMaterial
				map={glowTex()}
				color="#5feaff"
				transparent
				opacity={0.7}
				blending={THREE.AdditiveBlending}
				depthWrite={false}
			/>
		</sprite>
	</group>
);

/** Floating dust / sparkle particles, fully deterministic from frame. */
export const Particles = ({
	frame,
	center,
	size,
	count = 140,
	color = '#ffd9a0',
	speed = 0.004,
	pointSize = 0.05,
	opacity = 0.7,
	seed = 1,
	rise = 0,
}: {
	frame: number;
	center: V3;
	size: V3;
	count?: number;
	color?: string;
	speed?: number;
	pointSize?: number;
	opacity?: number;
	seed?: number;
	rise?: number;
}) => {
	const base = useMemo(() => {
		const r = mulberry32(seed);
		return new Array(count).fill(0).map(() => [r(), r(), r(), r() * 6.28]);
	}, [count, seed]);
	const geo = useMemo(() => new THREE.BufferGeometry(), []);
	const pos = new Float32Array(count * 3);
	base.forEach(([a, b, c, ph], i) => {
		const y = (((b + frame * (speed + rise * (0.5 + a))) % 1) + 1) % 1;
		pos[i * 3] = center[0] + (a - 0.5) * size[0] + Math.sin(frame * 0.03 + ph) * 0.15;
		pos[i * 3 + 1] = center[1] + (y - 0.5) * size[1];
		pos[i * 3 + 2] = center[2] + (c - 0.5) * size[2] + Math.cos(frame * 0.025 + ph) * 0.15;
	});
	geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
	return (
		<points geometry={geo} frustumCulled={false}>
			<pointsMaterial
				map={glowTex()}
				color={color}
				size={pointSize}
				transparent
				opacity={opacity}
				blending={THREE.AdditiveBlending}
				depthWrite={false}
			/>
		</points>
	);
};

export const Phone = ({
	position,
	rotation = [0, 0, 0],
	mode,
	step,
	scale = 1,
	hands = false,
}: {
	position: V3;
	rotation?: V3;
	mode: PhoneMode;
	step: number;
	scale?: number;
	hands?: boolean;
}) => (
	<group position={position} rotation={rotation} scale={scale}>
		<mesh>
			<boxGeometry args={[0.21, 0.42, 0.022]} />
			<meshLambertMaterial color="#15161c" />
		</mesh>
		<mesh position={[0, 0, 0.0115]}>
			<planeGeometry args={[0.19, 0.38]} />
			<meshBasicMaterial map={phoneTex(mode, step, MESSAGE_TEXT)} toneMapped={false} />
		</mesh>
		{hands
			? [-1, 1].map((sd) => (
					<group key={sd} position={[sd * 0.1, -0.08, -0.02]} rotation-z={sd * 0.18}>
						<mesh>
							<boxGeometry args={[0.06, 0.16, 0.03]} />
							<meshLambertMaterial color="#e9b98a" emissive="#f6c995" emissiveIntensity={0.15} />
						</mesh>
						<mesh position={[-sd * 0.035, 0.03, 0.025]} rotation-z={-sd * 0.5}>
							<boxGeometry args={[0.032, 0.075, 0.025]} />
							<meshLambertMaterial color="#e9b98a" emissive="#f6c995" emissiveIntensity={0.15} />
						</mesh>
					</group>
				))
			: null}
	</group>
);

/** Night bedroom: x -3..3, z -3..3, y 0..3.2. Window on back wall (z=-3). */
export const Bedroom = () => {
	const floor = woodTex();
	return (
		<group>
			<mesh rotation-x={-Math.PI / 2}>
				<planeGeometry args={[6, 6]} />
				<meshLambertMaterial map={floor} />
			</mesh>
			<mesh position={[0, 3.2, 0]} rotation-x={Math.PI / 2}>
				<planeGeometry args={[6, 6]} />
				<meshLambertMaterial color="#2a2d46" />
			</mesh>
			{/* walls */}
			<mesh position={[0, 1.6, -3]}>
				<planeGeometry args={[6, 3.2]} />
				<meshLambertMaterial color="#3f4670" />
			</mesh>
			<mesh position={[-3, 1.6, 0]} rotation-y={Math.PI / 2}>
				<planeGeometry args={[6, 3.2]} />
				<meshLambertMaterial color="#383e64" />
			</mesh>
			<mesh position={[3, 1.6, 0]} rotation-y={-Math.PI / 2}>
				<planeGeometry args={[6, 3.2]} />
				<meshLambertMaterial color="#383e64" />
			</mesh>
			<mesh position={[0, 1.6, 3]} rotation-y={Math.PI}>
				<planeGeometry args={[6, 3.2]} />
				<meshLambertMaterial color="#383e64" />
			</mesh>
			{/* window */}
			<group position={[-1.4, 1.9, -2.98]}>
				<mesh>
					<planeGeometry args={[1.5, 1.2]} />
					<meshBasicMaterial map={nightSkyTex()} toneMapped={false} />
				</mesh>
				{[
					[0, 0.62, 1.66, 0.08],
					[0, -0.62, 1.66, 0.08],
					[-0.79, 0, 0.08, 1.3],
					[0.79, 0, 0.08, 1.3],
					[0, 0, 0.05, 1.2],
					[0, 0, 1.5, 0.05],
				].map(([x, y, w, h], i) => (
					<mesh key={i} position={[x, y, 0.03]}>
						<boxGeometry args={[w, h, 0.06]} />
						<meshLambertMaterial color="#d9d4c7" />
					</mesh>
				))}
				{/* curtains */}
				{[-1.05, 1.05].map((x) => (
					<mesh key={x} position={[x, -0.05, 0.08]}>
						<boxGeometry args={[0.34, 1.6, 0.05]} />
						<meshLambertMaterial color="#7d3b4e" />
					</mesh>
				))}
			</group>
			{/* poster */}
			<mesh position={[1.9, 2.0, -2.97]}>
				<planeGeometry args={[0.7, 0.93]} />
				<meshLambertMaterial map={posterTex()} />
			</mesh>
			{/* bed */}
			<group position={[0.4, 0, -1.9]}>
				<mesh position={[0, 0.2, 0]}>
					<boxGeometry args={[2.4, 0.4, 1.9]} />
					<meshLambertMaterial color="#5a3a24" />
				</mesh>
				<mesh position={[0, 0.48, 0]}>
					<boxGeometry args={[2.3, 0.16, 1.8]} />
					<meshLambertMaterial color="#e3e6f2" />
				</mesh>
				<mesh position={[0.3, 0.6, 0.05]}>
					<boxGeometry args={[1.7, 0.1, 1.78]} />
					<meshLambertMaterial color="#3a63b8" />
				</mesh>
				<mesh position={[-0.85, 0.65, -0.55]}>
					<boxGeometry args={[0.5, 0.16, 0.6]} />
					<meshLambertMaterial color="#f4f4f8" />
				</mesh>
				<mesh position={[0, 0.8, -0.98]}>
					<boxGeometry args={[2.4, 1.6, 0.12]} />
					<meshLambertMaterial color="#4c311f" />
				</mesh>
			</group>
			{/* desk + lamp */}
			<group position={[2.2, 0, -0.6]}>
				<mesh position={[0, 0.78, 0]}>
					<boxGeometry args={[1.0, 0.08, 1.4]} />
					<meshLambertMaterial color="#6a4a30" />
				</mesh>
				{[
					[-0.42, -0.62],
					[0.42, -0.62],
					[-0.42, 0.62],
					[0.42, 0.62],
				].map(([x, z], i) => (
					<mesh key={i} position={[x, 0.38, z]}>
						<boxGeometry args={[0.07, 0.76, 0.07]} />
						<meshLambertMaterial color="#4a321f" />
					</mesh>
				))}
				<mesh position={[0.1, 0.95, -0.4]}>
					<cylinderGeometry args={[0.03, 0.08, 0.3, 8]} />
					<meshLambertMaterial color="#2b2b33" />
				</mesh>
				<mesh position={[0.1, 1.15, -0.4]}>
					<coneGeometry args={[0.17, 0.2, 12, 1, true]} />
					<meshBasicMaterial color="#ffd48a" side={THREE.DoubleSide} />
				</mesh>
				<sprite position={[0.1, 1.12, -0.4]} scale={0.9}>
					<spriteMaterial map={glowTex()} color="#ffb860" transparent opacity={0.6} blending={THREE.AdditiveBlending} depthWrite={false} />
				</sprite>
				{/* books */}
				{[0, 1, 2].map((i) => (
					<mesh key={i} position={[-0.1, 0.92, 0.2 + i * 0.12]}>
						<boxGeometry args={[0.35, 0.22, 0.09]} />
						<meshLambertMaterial color={['#c0392b', '#2e86de', '#27ae60'][i]} />
					</mesh>
				))}
			</group>
			{/* rug */}
			<mesh rotation-x={-Math.PI / 2} position={[0.2, 0.01, 0.4]}>
				<circleGeometry args={[1.3, 28]} />
				<meshLambertMaterial color="#8a5a7a" />
			</mesh>
		</group>
	);
};
