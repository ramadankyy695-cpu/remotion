import {RoundedBox} from '@react-three/drei';
import {useThree} from '@react-three/fiber';
import React, {useMemo} from 'react';
import {random, useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {
	asphaltRoughness,
	asphaltTexture,
	billTexture,
	buildingTexture,
	chatTexture,
	glowTexture,
	moneyTexture,
	photoTexture,
	plasterTexture,
	posterTexture,
	signTexture,
	skyTexture,
	streakTexture,
	tileTexture,
	woodTexture,
} from './textures';

export type Vec3 = [number, number, number];

/** Lets a debug composition look at a scene from an arbitrary camera. */
export const DebugCamContext = React.createContext<{
	position: Vec3;
	target: Vec3;
	fov: number;
	roll?: number;
} | null>(null);

/** Sets the default camera from frame-driven values. */
export const CameraRig: React.FC<{
	readonly position: Vec3;
	readonly target: Vec3;
	readonly fov: number;
	readonly roll?: number;
	/** soft "cinematographer" fill light that travels with the camera */
	readonly fill?: {intensity: number; color: string; distance?: number};
}> = (props) => {
	const override = React.useContext(DebugCamContext);
	const {position, target, fov, roll = 0} = override ?? props;
	const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
	camera.position.set(...position);
	camera.up.set(Math.sin(roll), Math.cos(roll), 0);
	camera.lookAt(...target);
	if (camera.fov !== fov) {
		camera.fov = fov;
	}

	camera.near = 0.02;
	camera.far = 200;
	camera.updateProjectionMatrix();
	if (!props.fill) {
		return null;
	}

	// place the fill a bit above and to the side of the camera, toward the target
	const dir = new THREE.Vector3(...target).sub(camera.position).normalize();
	const side = new THREE.Vector3()
		.crossVectors(dir, new THREE.Vector3(0, 1, 0))
		.normalize();
	const p = camera.position
		.clone()
		.add(side.multiplyScalar(0.6))
		.add(new THREE.Vector3(0, 0.45, 0))
		.add(dir.multiplyScalar(0.2));
	return (
		<pointLight
			position={[p.x, p.y, p.z]}
			intensity={props.fill.intensity}
			color={props.fill.color}
			distance={props.fill.distance ?? 6}
			decay={1.5}
		/>
	);
};

/** Gentle handheld shake, deterministic. */
export const handheld = (frame: number, amount: number): Vec3 => {
	const t = frame / 30;
	return [
		(Math.sin(t * 1.3) * 0.6 + Math.sin(t * 2.9 + 1) * 0.4) * amount,
		(Math.sin(t * 1.7 + 2) * 0.6 + Math.sin(t * 3.3) * 0.4) * amount,
		Math.sin(t * 1.1 + 4) * amount * 0.5,
	];
};

export const SceneSetup: React.FC<{
	readonly bg: string;
	readonly fog: [string, number];
	readonly exposure: number;
}> = ({bg, fog, exposure}) => {
	const gl = useThree((s) => s.gl);
	gl.toneMapping = THREE.ACESFilmicToneMapping;
	gl.toneMappingExposure = exposure;
	gl.shadowMap.enabled = true;
	gl.shadowMap.type = THREE.PCFSoftShadowMap;
	return (
		<>
			<color attach="background" args={[bg]} />
			<fogExp2 attach="fog" args={fog} />
		</>
	);
};

// ---------------------------------------------------------------- Rain

const rainVertex = /* glsl */ `
  attribute float aEnd;
  attribute float aSeed;
  uniform float uTime;
  uniform float uHeight;
  uniform float uSpeed;
  uniform float uLen;
  uniform vec3 uCenter;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    float y = mod(p.y - uTime * uSpeed * (0.85 + aSeed * 0.3), uHeight);
    p.y = y + uCenter.y - uHeight * 0.3;
    p.x += uCenter.x;
    p.z += uCenter.z;
    p.y += aEnd * uLen;
    p.x += aEnd * uLen * 0.08;
    vAlpha = aEnd > 0.5 ? 0.0 : 1.0;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    vAlpha *= clamp(1.0 - (-mv.z) / 30.0, 0.0, 1.0);
  }
`;

const rainFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vAlpha;
  void main() {
    gl_FragColor = vec4(uColor, vAlpha * uOpacity);
  }
`;

export const Rain: React.FC<{
	readonly count?: number;
	readonly center: Vec3;
	readonly size: Vec3;
	readonly opacity?: number;
	readonly color?: string;
}> = ({count = 4000, center, size, opacity = 0.55, color = '#bcd3ff'}) => {
	const frame = useCurrentFrame();
	const {geometry, material} = useMemo(() => {
		const pos = new Float32Array(count * 6);
		const end = new Float32Array(count * 2);
		const seed = new Float32Array(count * 2);
		for (let i = 0; i < count; i++) {
			const x = (random(`rx${i}`) - 0.5) * size[0];
			const y = random(`ry${i}`) * size[1];
			const z = (random(`rz${i}`) - 0.5) * size[2];
			pos.set([x, y, z, x, y, z], i * 6);
			end.set([0, 1], i * 2);
			const s = random(`rs${i}`);
			seed.set([s, s], i * 2);
		}

		const g = new THREE.BufferGeometry();
		g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
		g.setAttribute('aEnd', new THREE.BufferAttribute(end, 1));
		g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
		const m = new THREE.ShaderMaterial({
			vertexShader: rainVertex,
			fragmentShader: rainFragment,
			transparent: true,
			depthWrite: false,
			blending: THREE.AdditiveBlending,
			uniforms: {
				uTime: {value: 0},
				uHeight: {value: size[1]},
				uSpeed: {value: 9},
				uLen: {value: 0.32},
				uCenter: {value: new THREE.Vector3()},
				uColor: {value: new THREE.Color(color)},
				uOpacity: {value: opacity},
			},
		});
		return {geometry: g, material: m};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [count, size.join(','), color, opacity]);
	material.uniforms.uTime.value = frame / 30;
	(material.uniforms.uCenter.value as THREE.Vector3).set(...center);
	return (
		<lineSegments
			geometry={geometry}
			material={material}
			frustumCulled={false}
		/>
	);
};

/** Expanding ripple rings on wet ground. */
export const Ripples: React.FC<{
	readonly area: [number, number, number, number];
	readonly count?: number;
}> = ({area, count = 70}) => {
	const frame = useCurrentFrame();
	const mats = useMemo(
		() =>
			new Array(count).fill(0).map(
				() =>
					new THREE.MeshBasicMaterial({
						color: '#cfe0ff',
						transparent: true,
						opacity: 0.25,
						depthWrite: false,
						blending: THREE.AdditiveBlending,
					}),
			),
		[count],
	);
	const geo = useMemo(() => new THREE.RingGeometry(0.85, 1, 24), []);
	return (
		<group>
			{new Array(count).fill(0).map((_, i) => {
				const period = 14 + Math.floor(random(`rp${i}`) * 16);
				const off = Math.floor(random(`ro${i}`) * period);
				const life = ((frame + off) % period) / period;
				const cycle = Math.floor((frame + off) / period);
				const x = area[0] + random(`rxx${i}-${cycle}`) * (area[1] - area[0]);
				const z = area[2] + random(`rzz${i}-${cycle}`) * (area[3] - area[2]);
				const s = 0.02 + life * 0.13;
				const m = mats[i];
				m.opacity = (1 - life) * 0.35;
				return (
					<mesh
						key={i}
						geometry={geo}
						material={m}
						position={[x, 0.006, z]}
						rotation={[-Math.PI / 2, 0, 0]}
						scale={[s, s, s]}
					/>
				);
			})}
		</group>
	);
};

// ---------------------------------------------------------------- Props

export const Phone: React.FC<{
	readonly screen: 'photo' | 'chat';
	readonly brightness?: number;
	readonly light?: number;
}> = ({screen, brightness = 1, light = 0.6}) => {
	const tex = screen === 'photo' ? photoTexture() : chatTexture();
	return (
		<group>
			<RoundedBox
				args={[0.072, 0.15, 0.009]}
				radius={0.006}
				smoothness={2}
				castShadow
			>
				<meshStandardMaterial color="#111216" roughness={0.3} metalness={0.6} />
			</RoundedBox>
			<mesh position={[0, 0, 0.0047]}>
				<planeGeometry args={[0.064, 0.138]} />
				<meshBasicMaterial
					map={tex}
					color={new THREE.Color(brightness, brightness, brightness)}
					toneMapped={false}
				/>
			</mesh>
			{light > 0 ? (
				<pointLight
					position={[0, -0.02, 0.2]}
					intensity={light * 0.35}
					distance={1.4}
					decay={1.2}
					color={screen === 'photo' ? '#ffd2b0' : '#bfe3ff'}
				/>
			) : null}
		</group>
	);
};

export const Banknote: React.FC<{
	readonly value: string;
	readonly color: string;
	readonly position: Vec3;
	readonly rotation?: Vec3;
	readonly bend?: number;
}> = ({value, color, position, rotation = [0, 0, 0], bend = 0}) => (
	<mesh
		position={position}
		rotation={[-Math.PI / 2 + rotation[0], rotation[1], rotation[2]]}
		castShadow
		receiveShadow
	>
		<planeGeometry args={[0.15, 0.07, 6, 1]} />
		<meshStandardMaterial
			map={moneyTexture(value, color)}
			side={THREE.DoubleSide}
			roughness={0.8}
			onBeforeCompile={(s) => {
				if (bend === 0) {
					return;
				}

				s.vertexShader = s.vertexShader.replace(
					'#include <begin_vertex>',
					`#include <begin_vertex>\n transformed.z += ${bend.toFixed(3)} * transformed.x * transformed.x * 20.0;`,
				);
			}}
		/>
	</mesh>
);

export const Bill: React.FC<{
	readonly title: string;
	readonly amount: string;
	readonly position: Vec3;
	readonly rot: number;
}> = ({title, amount, position, rot}) => (
	<mesh position={position} rotation={[-Math.PI / 2, 0, rot]} receiveShadow>
		<planeGeometry args={[0.15, 0.21]} />
		<meshStandardMaterial map={billTexture(title, amount)} roughness={0.9} />
	</mesh>
);

export const Wallet: React.FC<{
	readonly position: Vec3;
	readonly rot: number;
}> = ({position, rot}) => (
	<group position={position} rotation={[0, rot, 0]}>
		<RoundedBox
			args={[0.11, 0.012, 0.09]}
			radius={0.004}
			smoothness={2}
			castShadow
		>
			<meshStandardMaterial color="#4a2e1c" roughness={0.55} />
		</RoundedBox>
		<mesh position={[0, 0.0065, 0]} rotation={[-Math.PI / 2, 0, 0]}>
			<planeGeometry args={[0.1, 0.08]} />
			<meshStandardMaterial color="#3a2214" roughness={0.6} />
		</mesh>
	</group>
);

export const Coin: React.FC<{readonly position: Vec3}> = ({position}) => (
	<mesh position={position} castShadow>
		<cylinderGeometry args={[0.012, 0.012, 0.002, 18]} />
		<meshStandardMaterial color="#c9b37a" metalness={0.85} roughness={0.3} />
	</mesh>
);

/** Billboard glow sprite (fake bloom around lights). */
export const Glow: React.FC<{
	readonly position: Vec3;
	readonly color: string;
	readonly size: number;
	readonly opacity?: number;
}> = ({position, color, size, opacity = 0.8}) => (
	<sprite position={position} scale={[size, size, size]}>
		<spriteMaterial
			map={glowTexture()}
			color={color}
			transparent
			opacity={opacity}
			depthWrite={false}
			blending={THREE.AdditiveBlending}
			toneMapped={false}
		/>
	</sprite>
);

// ---------------------------------------------------------------- Room

export const Room: React.FC<{
	readonly morning: boolean;
	readonly lampOn: boolean;
	readonly dust?: boolean;
	readonly chair: {x: number; z: number; rotY: number};
}> = ({morning, lampOn, dust = false, chair}) => {
	const frame = useCurrentFrame();
	const wall = plasterTexture(morning ? '#d9cbb0' : '#bfb197');
	const W = 3.6;
	const D = 3.4;
	const H = 2.7;
	return (
		<group>
			{/* floor */}
			<mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
				<planeGeometry args={[W, D]} />
				<meshStandardMaterial map={tileTexture()} roughness={0.5} />
			</mesh>
			{/* back wall (with window cut-out made from 4 pieces) */}
			<group position={[0, 0, -D / 2]}>
				<mesh position={[-1.25, H / 2, 0]} receiveShadow>
					<planeGeometry args={[1.1, H]} />
					<meshStandardMaterial map={wall} roughness={0.95} />
				</mesh>
				<mesh position={[1.25, H / 2, 0]} receiveShadow>
					<planeGeometry args={[1.1, H]} />
					<meshStandardMaterial map={wall} roughness={0.95} />
				</mesh>
				<mesh position={[0, 0.45, 0]} receiveShadow>
					<planeGeometry args={[1.4, 0.9]} />
					<meshStandardMaterial map={wall} roughness={0.95} />
				</mesh>
				<mesh position={[0, 2.35, 0]} receiveShadow>
					<planeGeometry args={[1.4, 0.7]} />
					<meshStandardMaterial map={wall} roughness={0.95} />
				</mesh>
				{/* window frame + bars */}
				{[
					[0, 0.9, 1.44, 0.06],
					[0, 2.0, 1.44, 0.06],
					[-0.7, 1.45, 0.06, 1.16],
					[0.7, 1.45, 0.06, 1.16],
					[0, 1.45, 0.05, 1.1],
					[0, 1.45, 1.4, 0.04],
				].map(([x, y, w, h]) => (
					<mesh key={`${x}-${y}-${w}`} position={[x, y, 0.03]} castShadow>
						<boxGeometry args={[w, h, 0.06]} />
						<meshStandardMaterial color="#5b4636" roughness={0.7} />
					</mesh>
				))}
				{/* outside: sky + rooftops */}
				<mesh position={[0, 1.6, -3]}>
					<planeGeometry args={[9, 6]} />
					<meshBasicMaterial map={skyTexture(morning)} toneMapped={!morning} />
				</mesh>
				{[-2.2, -1.1, 0.2, 1.3, 2.4].map((x, i) => (
					<mesh
						key={x}
						position={[x, 0.6 + (i % 2) * 0.25, -2.5]}
						rotation={[0, 0, Math.PI / 4]}
					>
						<boxGeometry args={[1.1, 1.1, 0.4]} />
						<meshStandardMaterial
							color={morning ? '#7a5141' : '#0b0d12'}
							roughness={0.9}
							emissive={morning ? '#3a2015' : '#000'}
						/>
					</mesh>
				))}
				{/* curtain */}
				<mesh position={[-0.6, 1.5, 0.08]} castShadow>
					<boxGeometry args={[0.3, 1.3, 0.03]} />
					<meshStandardMaterial
						color={morning ? '#9fb7a8' : '#5d6e66'}
						roughness={1}
					/>
				</mesh>
				<mesh position={[0, 2.12, 0.08]}>
					<cylinderGeometry args={[0.012, 0.012, 1.6, 8]} />
					<meshStandardMaterial color="#888" metalness={0.8} roughness={0.3} />
				</mesh>
			</group>
			{/* left & right walls, ceiling */}
			<mesh
				position={[-W / 2, H / 2, 0]}
				rotation={[0, Math.PI / 2, 0]}
				receiveShadow
			>
				<planeGeometry args={[D, H]} />
				<meshStandardMaterial map={wall} roughness={0.95} />
			</mesh>
			<mesh
				position={[W / 2, H / 2, 0]}
				rotation={[0, -Math.PI / 2, 0]}
				receiveShadow
			>
				<planeGeometry args={[D, H]} />
				<meshStandardMaterial map={wall} roughness={0.95} />
			</mesh>
			<mesh position={[0, H, 0]} rotation={[Math.PI / 2, 0, 0]}>
				<planeGeometry args={[W, D]} />
				<meshStandardMaterial color="#9c937f" roughness={1} />
			</mesh>
			{/* poster */}
			<mesh
				position={[-W / 2 + 0.01, 1.6, -0.2]}
				rotation={[0, Math.PI / 2, 0]}
			>
				<planeGeometry args={[0.42, 0.58]} />
				<meshStandardMaterial map={posterTexture()} roughness={0.8} />
			</mesh>
			{/* mattress on the floor */}
			<group position={[-1.05, 0, 0.3]}>
				<RoundedBox
					args={[1.2, 0.18, 1.95]}
					radius={0.06}
					smoothness={3}
					position={[0, 0.09, 0]}
					castShadow
					receiveShadow
				>
					<meshStandardMaterial color="#6f7f99" roughness={1} />
				</RoundedBox>
				<RoundedBox
					args={[0.6, 0.12, 0.35]}
					radius={0.05}
					smoothness={3}
					position={[0, 0.23, -0.72]}
					castShadow
				>
					<meshStandardMaterial color="#d8d2c4" roughness={1} />
				</RoundedBox>
				<RoundedBox
					args={[1.1, 0.05, 0.9]}
					radius={0.02}
					smoothness={2}
					position={[0.03, 0.2, 0.45]}
					rotation={[0, 0.08, 0.02]}
					castShadow
				>
					<meshStandardMaterial color="#8b4a4a" roughness={1} />
				</RoundedBox>
			</group>
			{/* desk + chair */}
			<group position={[0.85, 0, -0.65]}>
				<mesh position={[0, 0.74, 0]} castShadow receiveShadow>
					<boxGeometry args={[1.1, 0.04, 0.6]} />
					<meshStandardMaterial
						map={woodTexture('#6b4a2f', 'desk')}
						roughness={0.6}
					/>
				</mesh>
				{[
					[-0.5, -0.25],
					[0.5, -0.25],
					[-0.5, 0.25],
					[0.5, 0.25],
				].map(([x, z]) => (
					<mesh key={`${x}${z}`} position={[x, 0.36, z]} castShadow>
						<boxGeometry args={[0.04, 0.72, 0.04]} />
						<meshStandardMaterial color="#4a3220" />
					</mesh>
				))}
				{/* desk lamp */}
				<group position={[0.4, 0.76, -0.15]}>
					<mesh position={[0, 0.01, 0]}>
						<cylinderGeometry args={[0.07, 0.08, 0.02, 16]} />
						<meshStandardMaterial color="#222" />
					</mesh>
					<mesh position={[0, 0.2, 0]} rotation={[0, 0, 0.2]}>
						<cylinderGeometry args={[0.008, 0.008, 0.4, 8]} />
						<meshStandardMaterial color="#333" metalness={0.6} />
					</mesh>
					<mesh position={[-0.06, 0.39, 0]} rotation={[0, 0, -0.9]}>
						<coneGeometry args={[0.07, 0.11, 18, 1, true]} />
						<meshStandardMaterial color="#2f4d3c" side={THREE.DoubleSide} />
					</mesh>
					{lampOn ? (
						<>
							<Glow position={[-0.09, 0.36, 0]} color="#ffbf73" size={0.22} />
							<pointLight
								position={[-0.12, 0.33, 0.02]}
								intensity={2.2}
								distance={4}
								decay={1.6}
								color="#ffb867"
								castShadow
								shadow-mapSize={[1024, 1024]}
								shadow-bias={-0.002}
							/>
						</>
					) : null}
				</group>
				{/* clutter */}
				<mesh position={[-0.35, 0.8, -0.1]} castShadow>
					<cylinderGeometry args={[0.04, 0.035, 0.1, 16]} />
					<meshStandardMaterial color="#e8e1d1" roughness={0.3} />
				</mesh>
				<mesh position={[-0.42, 0.77, -0.16]} rotation={[0, 0.3, 0]} castShadow>
					<boxGeometry args={[0.22, 0.03, 0.15]} />
					<meshStandardMaterial color="#2e5a88" />
				</mesh>
			</group>
			{/* plastic chair */}
			<group position={[chair.x, 0, chair.z]} rotation={[0, chair.rotY, 0]}>
				<mesh position={[0, 0.45, 0]} castShadow receiveShadow>
					<boxGeometry args={[0.44, 0.04, 0.42]} />
					<meshStandardMaterial color="#2f6b9a" roughness={0.45} />
				</mesh>
				<mesh position={[0, 0.72, 0.2]} rotation={[-0.08, 0, 0]} castShadow>
					<boxGeometry args={[0.44, 0.5, 0.03]} />
					<meshStandardMaterial color="#2f6b9a" roughness={0.45} />
				</mesh>
				{[
					[-0.19, -0.18],
					[0.19, -0.18],
					[-0.19, 0.18],
					[0.19, 0.18],
				].map(([x, z]) => (
					<mesh key={`${x}${z}`} position={[x, 0.22, z]} castShadow>
						<cylinderGeometry args={[0.018, 0.022, 0.45, 8]} />
						<meshStandardMaterial color="#2f6b9a" roughness={0.45} />
					</mesh>
				))}
			</group>
			{/* clothes hanging + bucket */}
			<mesh
				position={[1.45, 1.3, 1.1]}
				rotation={[0, -Math.PI / 2, 0.05]}
				castShadow
			>
				<boxGeometry args={[0.45, 0.6, 0.03]} />
				<meshStandardMaterial color="#7d6a52" roughness={1} />
			</mesh>
			<mesh position={[1.4, 0.15, 1.3]} castShadow>
				<cylinderGeometry args={[0.16, 0.13, 0.3, 18]} />
				<meshStandardMaterial color="#c9473b" roughness={0.5} />
			</mesh>
			{/* ceiling bulb (off at night) */}
			<mesh position={[0, H - 0.12, 0.2]}>
				<sphereGeometry args={[0.05, 12, 10]} />
				<meshStandardMaterial
					color="#f3efe5"
					emissive={morning ? '#000' : '#000'}
				/>
			</mesh>
			{/* lighting */}
			{morning ? (
				<>
					<ambientLight intensity={0.35} color="#ffe6c9" />
					<hemisphereLight args={['#cfe6ff', '#6b4a2f', 0.45]} />
					<directionalLight
						position={[0.8, 3.4, -5]}
						intensity={6}
						color="#ffd29a"
						castShadow
						shadow-mapSize={[2048, 2048]}
						shadow-camera-left={-3}
						shadow-camera-right={3}
						shadow-camera-top={3}
						shadow-camera-bottom={-3}
						shadow-bias={-0.0006}
					/>
					{/* god rays through the window */}
					{[-0.35, 0.35].map((x, i) => (
						<mesh
							key={x}
							position={[x * 0.7, 1.05, -0.4]}
							rotation={[-0.62, 0, 0]}
						>
							<planeGeometry args={[0.62, 3.2]} />
							<meshBasicMaterial
								color="#ffd9a3"
								transparent
								opacity={0.08 + 0.02 * Math.sin(frame / 25 + i)}
								depthWrite={false}
								blending={THREE.AdditiveBlending}
								side={THREE.DoubleSide}
								toneMapped={false}
							/>
						</mesh>
					))}
					<pointLight
						position={[0, 1.45, -1.3]}
						intensity={2.5}
						distance={5}
						decay={1.5}
						color="#ffe1b5"
					/>
				</>
			) : (
				<>
					<ambientLight intensity={0.06} color="#7d8db8" />
					<hemisphereLight args={['#223355', '#120c08', 0.12]} />
					{/* moonlight / street light through window */}
					<directionalLight
						position={[-1, 3, -5]}
						intensity={0.7}
						color="#8fb0ff"
						castShadow
						shadow-mapSize={[1024, 1024]}
						shadow-camera-left={-3}
						shadow-camera-right={3}
						shadow-camera-top={3}
						shadow-camera-bottom={-3}
					/>
				</>
			)}
			{dust ? <Dust frame={frame} /> : null}
		</group>
	);
};

const Dust: React.FC<{readonly frame: number}> = ({frame}) => {
	const geo = useMemo(() => new THREE.SphereGeometry(1, 5, 4), []);
	return (
		<group>
			{new Array(70).fill(0).map((_, i) => {
				const t = frame / 30;
				const x = (random(`dx${i}`) - 0.5) * 1.3 + Math.sin(t * 0.3 + i) * 0.05;
				const y =
					0.4 + random(`dy${i}`) * 1.6 + Math.sin(t * 0.2 + i * 2) * 0.08;
				const z = -1.4 + random(`dz${i}`) * 1.8;
				const s = 0.0025 + random(`ds${i}`) * 0.003;
				return (
					<mesh key={i} geometry={geo} position={[x, y, z]} scale={[s, s, s]}>
						<meshBasicMaterial
							color="#fff1d6"
							transparent
							opacity={0.6}
							toneMapped={false}
						/>
					</mesh>
				);
			})}
		</group>
	);
};

// ---------------------------------------------------------------- Street

const LampSpot: React.FC<{
	readonly position: Vec3;
	readonly intensity: number;
	readonly shadow: boolean;
}> = ({position, intensity, shadow}) => {
	const light = useMemo(() => {
		const l = new THREE.SpotLight('#ffb870', intensity, 14, 0.75, 0.7, 1.4);
		l.castShadow = shadow;
		l.shadow.mapSize.set(1024, 1024);
		l.shadow.bias = -0.0008;
		l.target.position.set(0, -5, 0.4);
		l.add(l.target);
		return l;
	}, [intensity, shadow]);
	return <primitive object={light} position={position} />;
};

export const StreetLamp: React.FC<{
	readonly position: Vec3;
	readonly side: 1 | -1;
	readonly shadow?: boolean;
	readonly intensity?: number;
}> = ({position, side, shadow = false, intensity = 18}) => (
	<group position={position}>
		<mesh position={[0, 2.5, 0]} castShadow>
			<cylinderGeometry args={[0.05, 0.07, 5, 10]} />
			<meshStandardMaterial color="#3b3f46" metalness={0.6} roughness={0.4} />
		</mesh>
		<mesh position={[-0.55 * side, 4.95, 0]} rotation={[0, 0, Math.PI / 2]}>
			<cylinderGeometry args={[0.03, 0.03, 1.1, 8]} />
			<meshStandardMaterial color="#3b3f46" metalness={0.6} roughness={0.4} />
		</mesh>
		<mesh position={[-1.05 * side, 4.88, 0]}>
			<boxGeometry args={[0.4, 0.08, 0.18]} />
			<meshStandardMaterial color="#2b2e33" />
		</mesh>
		<mesh position={[-1.05 * side, 4.83, 0]}>
			<boxGeometry args={[0.32, 0.02, 0.12]} />
			<meshBasicMaterial color="#ffd7a0" toneMapped={false} />
		</mesh>
		<Glow
			position={[-1.05 * side, 4.8, 0]}
			color="#ffb766"
			size={1.6}
			opacity={0.85}
		/>
		<LampSpot
			position={[-1.05 * side, 4.8, 0]}
			intensity={intensity}
			shadow={shadow}
		/>
	</group>
);

export const Street: React.FC<{
	readonly lamps: Vec3[];
	readonly shadowLamp?: number;
	readonly length?: number;
}> = ({lamps, shadowLamp = 0, length = 60}) => {
	const asphalt = useMemo(() => {
		const t = asphaltTexture();
		return t;
	}, []);
	const rough = asphaltRoughness();
	return (
		<group>
			<ambientLight intensity={0.05} color="#6e86c2" />
			<hemisphereLight args={['#2a3c66', '#0a0a0a', 0.18]} />
			{/* road */}
			<mesh
				rotation={[-Math.PI / 2, 0, 0]}
				position={[0, 0, -length / 2 + 6]}
				receiveShadow
			>
				<planeGeometry args={[14, length]} />
				<meshStandardMaterial
					map={asphalt}
					roughnessMap={rough}
					roughness={0.55}
					metalness={0.35}
					color="#8a8f9a"
				/>
			</mesh>
			{/* lane markings */}
			{new Array(12).fill(0).map((_, i) => (
				<mesh
					key={i}
					rotation={[-Math.PI / 2, 0, 0]}
					position={[-1.6, 0.004, 4 - i * 5]}
				>
					<planeGeometry args={[0.12, 2.2]} />
					<meshStandardMaterial color="#9c9a88" roughness={0.6} />
				</mesh>
			))}
			{/* sidewalk + curb */}
			<mesh position={[2.6, 0.08, -length / 2 + 6]} receiveShadow castShadow>
				<boxGeometry args={[3.2, 0.16, length]} />
				<meshStandardMaterial color="#4a4c52" roughness={0.6} metalness={0.2} />
			</mesh>
			{/* buildings both sides */}
			{new Array(14).fill(0).map((_, i) => {
				const left = i % 2 === 0;
				const k = Math.floor(i / 2);
				const h = 6 + random(`bh${i}`) * 9;
				const w = 4 + random(`bw${i}`) * 2;
				const x = left ? -8 - random(`bx${i}`) : 6.2 + w / 2;
				const z = 6 - k * 8 - random(`bz${i}`) * 2;
				return (
					<mesh key={i} position={[x, h / 2, z]} castShadow={false}>
						<boxGeometry args={[w, h, 6]} />
						<meshStandardMaterial
							map={buildingTexture(`${i}`, 0.35)}
							emissiveMap={buildingTexture(`${i}`, 0.35)}
							emissive="#ffffff"
							emissiveIntensity={0.55}
							roughness={0.9}
						/>
					</mesh>
				);
			})}
			{/* a lit shop window spilling warm light on the sidewalk */}
			{[-11, -27].map((z) => (
				<group key={z}>
					<mesh position={[4.14, 1.4, z]} rotation={[0, -Math.PI / 2, 0]}>
						<planeGeometry args={[2.2, 1.5]} />
						<meshBasicMaterial color="#c48a4c" toneMapped={false} />
					</mesh>
					<pointLight
						position={[3.4, 1.5, z]}
						intensity={2.2}
						distance={6}
						decay={1.5}
						color="#ffbf78"
					/>
				</group>
			))}
			{/* shop shutters on sidewalk side */}
			{new Array(5).fill(0).map((_, i) => (
				<mesh
					key={i}
					position={[4.15, 1.3, 1 - i * 7.6]}
					rotation={[0, -Math.PI / 2, 0]}
				>
					<planeGeometry args={[3.5, 2.6]} />
					<meshStandardMaterial
						color="#5d636b"
						metalness={0.5}
						roughness={0.5}
					/>
				</mesh>
			))}
			{lamps.map((p, i) => (
				<StreetLamp
					key={`${p[0]}${p[2]}`}
					position={p}
					side={p[0] > 0 ? 1 : -1}
					shadow={i === shadowLamp}
				/>
			))}
			{/* fake wet reflections of the lamps */}
			{lamps.map((p) => (
				<mesh
					key={`r${p[0]}${p[2]}`}
					position={[p[0] - 1.05 * (p[0] > 0 ? 1 : -1), 0.01, p[2] + 1.8]}
					rotation={[-Math.PI / 2, 0, 0]}
				>
					<planeGeometry args={[0.9, 5]} />
					<meshBasicMaterial
						map={streakTexture()}
						color="#ffae5c"
						transparent
						opacity={0.38}
						depthWrite={false}
						blending={THREE.AdditiveBlending}
						toneMapped={false}
					/>
				</mesh>
			))}
			{/* distant bokeh lights (cars / signs) */}
			{new Array(24).fill(0).map((_, i) => (
				<Glow
					key={i}
					position={[
						(random(`gx${i}`) - 0.5) * 16,
						0.6 + random(`gy${i}`) * 5,
						-30 - random(`gz${i}`) * 25,
					]}
					color={
						random(`gc${i}`) > 0.6
							? '#ff5b4a'
							: random(`gc${i}`) > 0.3
								? '#ffd38a'
								: '#7fb4ff'
					}
					size={1 + random(`gs${i}`) * 1.5}
					opacity={0.55}
				/>
			))}
		</group>
	);
};

// ---------------------------------------------------------------- Warung

export const Warung: React.FC = () => {
	const frame = useCurrentFrame();
	const flicker =
		1 +
		Math.sin(frame * 0.9) * 0.02 +
		(random(`fl${Math.floor(frame / 3)}`) - 0.5) * 0.04;
	const wood = woodTexture('#7a5534', 'warungwood');
	return (
		<group>
			<ambientLight intensity={0.07} color="#6e86c2" />
			<hemisphereLight args={['#2a3c66', '#140c06', 0.15]} />
			{/* ground: wet concrete */}
			<mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
				<planeGeometry args={[30, 30]} />
				<meshStandardMaterial
					map={asphaltTexture()}
					roughnessMap={asphaltRoughness()}
					roughness={0.6}
					metalness={0.3}
					color="#9a9a9a"
				/>
			</mesh>
			{/* tarp roof */}
			<mesh position={[0, 2.35, 0]} rotation={[0.12, 0, 0]} castShadow>
				<boxGeometry args={[3.6, 0.03, 2.8]} />
				<meshStandardMaterial
					color="#1f5fa8"
					roughness={0.7}
					side={THREE.DoubleSide}
				/>
			</mesh>
			{[
				[-1.7, -1.3],
				[1.7, -1.3],
				[-1.7, 1.3],
				[1.7, 1.3],
			].map(([x, z]) => (
				<mesh key={`${x}${z}`} position={[x, 1.15, z]} castShadow>
					<cylinderGeometry args={[0.04, 0.04, 2.4, 8]} />
					<meshStandardMaterial color="#6d5a45" roughness={0.8} />
				</mesh>
			))}
			{/* back wall / gerobak (food cart) */}
			<group position={[0, 0, -1.25]}>
				<mesh position={[0, 0.5, 0]} castShadow receiveShadow>
					<boxGeometry args={[2.2, 1.0, 0.6]} />
					<meshStandardMaterial map={wood} roughness={0.7} />
				</mesh>
				<mesh position={[0, 1.35, 0.05]} castShadow>
					<boxGeometry args={[2.2, 0.7, 0.5]} />
					<meshPhysicalMaterial
						color="#cfe7ff"
						transparent
						opacity={0.25}
						roughness={0.05}
						transmission={0.2}
					/>
				</mesh>
				<mesh position={[0, 1.95, 0.32]}>
					<planeGeometry args={[2.2, 0.55]} />
					<meshStandardMaterial
						map={signTexture('WARUNG', 'NASI • MIE • KOPI')}
						roughness={0.8}
						emissiveMap={signTexture('WARUNG', 'NASI • MIE • KOPI')}
						emissive="#ffffff"
						emissiveIntensity={0.25}
					/>
				</mesh>
				{/* jars and pots */}
				{[-0.8, -0.4, 0, 0.4, 0.8].map((x, i) => (
					<mesh key={x} position={[x, 1.12, 0.05]}>
						<cylinderGeometry args={[0.1, 0.1, 0.22, 16]} />
						<meshStandardMaterial
							color={['#e3b04b', '#c0392b', '#f5e6c8', '#8e5a2b', '#e67e22'][i]}
							roughness={0.5}
						/>
					</mesh>
				))}
			</group>
			{/* table */}
			<group position={[0, 0, 0.1]}>
				<mesh position={[0, 0.74, 0]} castShadow receiveShadow>
					<boxGeometry args={[1.6, 0.05, 0.7]} />
					<meshStandardMaterial map={wood} roughness={0.55} />
				</mesh>
				{[
					[-0.72, -0.3],
					[0.72, -0.3],
					[-0.72, 0.3],
					[0.72, 0.3],
				].map(([x, z]) => (
					<mesh key={`${x}${z}`} position={[x, 0.36, z]} castShadow>
						<boxGeometry args={[0.05, 0.72, 0.05]} />
						<meshStandardMaterial color="#5a3e26" />
					</mesh>
				))}
				{/* tablecloth plastic */}
				<mesh
					position={[0, 0.768, 0]}
					rotation={[-Math.PI / 2, 0, 0]}
					receiveShadow
				>
					<planeGeometry args={[1.5, 0.62]} />
					<meshStandardMaterial color="#c7514d" roughness={0.35} />
				</mesh>
				{/* two glasses of es teh */}
				{[-0.25, 0.25].map((x) => (
					<group key={x} position={[x, 0.77, 0.12]}>
						<mesh position={[0, 0.07, 0]} castShadow>
							<cylinderGeometry args={[0.035, 0.03, 0.14, 16, 1, true]} />
							<meshPhysicalMaterial
								color="#ffffff"
								transparent
								opacity={0.3}
								roughness={0.05}
								side={THREE.DoubleSide}
							/>
						</mesh>
						<mesh position={[0, 0.055, 0]}>
							<cylinderGeometry args={[0.031, 0.028, 0.11, 16]} />
							<meshStandardMaterial
								color="#8a3d0f"
								transparent
								opacity={0.85}
								roughness={0.1}
							/>
						</mesh>
					</group>
				))}
				{/* plates */}
				{[-0.25, 0.25].map((x) => (
					<mesh key={x} position={[x, 0.775, -0.08]} receiveShadow>
						<cylinderGeometry args={[0.11, 0.09, 0.015, 24]} />
						<meshStandardMaterial color="#f1efe8" roughness={0.3} />
					</mesh>
				))}
				<mesh position={[0, 0.8, -0.24]}>
					<cylinderGeometry args={[0.05, 0.05, 0.08, 12]} />
					<meshStandardMaterial color="#d32f2f" roughness={0.4} />
				</mesh>
			</group>
			{/* benches */}
			{[-0.62, 0.82].map((z) => (
				<mesh key={z} position={[0, 0.44, z]} castShadow receiveShadow>
					<boxGeometry args={[1.7, 0.05, 0.3]} />
					<meshStandardMaterial map={wood} roughness={0.6} />
				</mesh>
			))}
			{/* hanging bulb + string lights */}
			<mesh position={[0, 2.0, 0.1]}>
				<sphereGeometry args={[0.05, 12, 10]} />
				<meshBasicMaterial color="#ffd9a0" toneMapped={false} />
			</mesh>
			<mesh position={[0, 2.18, 0.1]}>
				<cylinderGeometry args={[0.004, 0.004, 0.3, 4]} />
				<meshStandardMaterial color="#111" />
			</mesh>
			<Glow position={[0, 2.0, 0.1]} color="#ffb05c" size={0.9} opacity={0.9} />
			<pointLight
				position={[0, 1.95, 0.1]}
				intensity={6 * flicker}
				distance={7}
				decay={1.7}
				color="#ffb265"
				castShadow
				shadow-mapSize={[1024, 1024]}
				shadow-bias={-0.001}
			/>
			{new Array(11).fill(0).map((_, i) => {
				const x = -1.7 + i * 0.34;
				const y = 2.22 - Math.sin((i / 10) * Math.PI) * 0.18;
				return (
					<group key={i}>
						<mesh position={[x, y, 1.35]}>
							<sphereGeometry args={[0.02, 8, 6]} />
							<meshBasicMaterial
								color={['#ffcf6e', '#ff7b6e', '#8fd3ff'][i % 3]}
								toneMapped={false}
							/>
						</mesh>
						<Glow
							position={[x, y, 1.35]}
							color={['#ffcf6e', '#ff7b6e', '#8fd3ff'][i % 3]}
							size={0.18}
							opacity={0.7}
						/>
					</group>
				);
			})}
			{/* background street with bokeh */}
			{new Array(30).fill(0).map((_, i) => (
				<Glow
					key={i}
					position={[
						(random(`wgx${i}`) - 0.5) * 22,
						0.5 + random(`wgy${i}`) * 4,
						-6 - random(`wgz${i}`) * 14,
					]}
					color={random(`wgc${i}`) > 0.5 ? '#ffc078' : '#ff6a5a'}
					size={0.8 + random(`wgs${i}`) * 1.2}
					opacity={0.5}
				/>
			))}
			{new Array(6).fill(0).map((_, i) => (
				<mesh key={i} position={[-12 + i * 5, 4, -16]}>
					<boxGeometry args={[4.2, 8 + (i % 3) * 3, 3]} />
					<meshStandardMaterial
						map={buildingTexture(`w${i}`, 0.3)}
						emissiveMap={buildingTexture(`w${i}`, 0.3)}
						emissive="#fff"
						emissiveIntensity={0.4}
					/>
				</mesh>
			))}
		</group>
	);
};
