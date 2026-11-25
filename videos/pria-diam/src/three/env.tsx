import React, {useLayoutEffect, useMemo, useRef} from 'react';
import * as THREE from 'three';
import type {V3} from './Stage';

export const rng = (seed: number) => {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
};

// ---------- Procedural textures ----------
const canvasTex = (w: number, h: number, draw: (c: CanvasRenderingContext2D) => void, repeat: [number, number] = [1, 1]) => {
	const cv = document.createElement('canvas');
	cv.width = w;
	cv.height = h;
	const c = cv.getContext('2d')!;
	draw(c);
	const tex = new THREE.CanvasTexture(cv);
	tex.colorSpace = THREE.SRGBColorSpace;
	tex.wrapS = THREE.RepeatWrapping;
	tex.wrapT = THREE.RepeatWrapping;
	tex.repeat.set(repeat[0], repeat[1]);
	tex.anisotropy = 4;
	return tex;
};

export const useWoodTexture = (base: string, repeat: [number, number] = [3, 3], seed = 3) =>
	useMemo(
		() =>
			canvasTex(
				512,
				512,
				(c) => {
					const r = rng(seed);
					c.fillStyle = base;
					c.fillRect(0, 0, 512, 512);
					const plankH = 64;
					for (let y = 0; y < 512; y += plankH) {
						const off = r() * 512;
						for (let x = -512; x < 1024; x += 256) {
							const shade = 0.82 + r() * 0.3;
							c.fillStyle = `rgba(${Math.floor(shade * 40)},${Math.floor(shade * 24)},${Math.floor(shade * 12)},${0.18 + r() * 0.2})`;
							c.fillRect(x + off, y, 256, plankH);
							c.fillStyle = 'rgba(0,0,0,0.45)';
							c.fillRect(x + off, y, 2, plankH);
						}
						c.fillStyle = 'rgba(0,0,0,0.5)';
						c.fillRect(0, y, 512, 2);
						for (let i = 0; i < 26; i++) {
							c.strokeStyle = `rgba(30,15,5,${0.06 + r() * 0.08})`;
							c.lineWidth = 1 + r() * 2;
							c.beginPath();
							const yy = y + r() * plankH;
							c.moveTo(0, yy);
							c.bezierCurveTo(170, yy + r() * 8 - 4, 340, yy + r() * 8 - 4, 512, yy);
							c.stroke();
						}
					}
				},
				repeat,
			),
		[base, repeat[0], repeat[1], seed],
	);

export const usePlasterTexture = (base: string, repeat: [number, number] = [2, 2]) =>
	useMemo(
		() =>
			canvasTex(
				256,
				256,
				(c) => {
					const r = rng(11);
					c.fillStyle = base;
					c.fillRect(0, 0, 256, 256);
					for (let i = 0; i < 2600; i++) {
						const v = r() > 0.5 ? 255 : 0;
						c.fillStyle = `rgba(${v},${v},${v},${0.02 + r() * 0.03})`;
						c.fillRect(r() * 256, r() * 256, 1 + r() * 3, 1 + r() * 3);
					}
				},
				repeat,
			),
		[base, repeat[0], repeat[1]],
	);

export const useWindowsTexture = (seed: number, warmth = 0.6) =>
	useMemo(
		() =>
			canvasTex(256, 512, (c) => {
				const r = rng(seed);
				c.fillStyle = '#07090d';
				c.fillRect(0, 0, 256, 512);
				for (let y = 8; y < 512; y += 24) {
					for (let x = 8; x < 256; x += 20) {
						const on = r();
						if (on < 0.33) {
							const warm = r() < warmth;
							const b = 0.5 + r() * 0.5;
							c.fillStyle = warm
								? `rgba(255,${Math.floor(170 + 60 * b)},${Math.floor(90 + 50 * b)},${b})`
								: `rgba(${Math.floor(140 + 60 * b)},${Math.floor(190 + 40 * b)},255,${b * 0.8})`;
						} else {
							c.fillStyle = 'rgba(30,38,50,0.9)';
						}
						c.fillRect(x, y, 12, 15);
					}
				}
			}),
		[seed, warmth],
	);

// ---------- Volumetric light cone ----------
const coneVert = /* glsl */ `
varying vec3 vN; varying vec3 vV; varying float vH;
uniform float uH;
void main(){
	vH = clamp(position.y / uH + 0.5, 0.0, 1.0);
	vec4 mv = modelViewMatrix * vec4(position,1.0);
	vN = normalize(normalMatrix * normal);
	vV = normalize(-mv.xyz);
	gl_Position = projectionMatrix * mv;
}`;
const coneFrag = /* glsl */ `
varying vec3 vN; varying vec3 vV; varying float vH;
uniform vec3 uColor; uniform float uIntensity;
void main(){
	float f = abs(dot(vN, vV));
	float a = pow(f, 2.2) * pow(vH, 1.6) * uIntensity;
	gl_FragColor = vec4(uColor * a, 1.0);
}`;

// Apex at `from`, pointing to `to`.
export const LightCone: React.FC<{
	readonly from: V3;
	readonly to: V3;
	readonly radius: number;
	readonly color?: string;
	readonly intensity?: number;
}> = ({from, to, radius, color = '#ffd6a0', intensity = 0.25}) => {
	const len = Math.hypot(to[0] - from[0], to[1] - from[1], to[2] - from[2]);
	const geo = useMemo(() => new THREE.ConeGeometry(radius, len, 40, 1, true), [radius, len]);
	const mat = useMemo(
		() =>
			new THREE.ShaderMaterial({
				vertexShader: coneVert,
				fragmentShader: coneFrag,
				uniforms: {uColor: {value: new THREE.Color(color)}, uIntensity: {value: intensity}, uH: {value: len}},
				transparent: true,
				depthWrite: false,
				blending: THREE.AdditiveBlending,
				side: THREE.DoubleSide,
			}),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[],
	);
	mat.uniforms.uIntensity.value = intensity;
	mat.uniforms.uH.value = len;
	(mat.uniforms.uColor.value as THREE.Color).set(color);
	const ref = useRef<THREE.Mesh>(null);
	useLayoutEffect(() => {
		const m = ref.current!;
		const a = new THREE.Vector3(...from);
		const b = new THREE.Vector3(...to);
		const dir = b.clone().sub(a).normalize();
		m.position.copy(a.clone().add(b).multiplyScalar(0.5));
		// Cone points +Y (apex at top); we want apex at `from` -> +Y should point toward `from`.
		m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().negate());
	});
	return <mesh ref={ref} geometry={geo} material={mat} renderOrder={10} />;
};

// ---------- Glow sprite (fake bloom around practical lights) ----------
const glowTex = (() => {
	let t: THREE.Texture | null = null;
	return () => {
		if (t) return t;
		t = canvasTex(128, 128, (c) => {
			const g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
			g.addColorStop(0, 'rgba(255,255,255,1)');
			g.addColorStop(0.2, 'rgba(255,255,255,0.45)');
			g.addColorStop(0.5, 'rgba(255,255,255,0.12)');
			g.addColorStop(1, 'rgba(255,255,255,0)');
			c.fillStyle = g;
			c.fillRect(0, 0, 128, 128);
		});
		return t;
	};
})();

export const Glow: React.FC<{readonly position: V3; readonly size: number; readonly color: string; readonly opacity?: number}> = ({
	position,
	size,
	color,
	opacity = 1,
}) => (
	<sprite position={position} scale={[size, size, 1]} renderOrder={11}>
		<spriteMaterial map={glowTex()} color={color} transparent opacity={opacity} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
	</sprite>
);

// ---------- Dust particles in the air ----------
export const Dust: React.FC<{
	readonly t: number;
	readonly count?: number;
	readonly center: V3;
	readonly size: V3;
	readonly color?: string;
	readonly opacity?: number;
	readonly pointSize?: number;
}> = ({t, count = 220, center, size, color = '#ffe7c4', opacity = 0.6, pointSize = 0.012}) => {
	const base = useMemo(() => {
		const r = rng(42);
		const arr = new Float32Array(count * 4);
		for (let i = 0; i < count; i++) {
			arr[i * 4] = r();
			arr[i * 4 + 1] = r();
			arr[i * 4 + 2] = r();
			arr[i * 4 + 3] = r() * 10;
		}
		return arr;
	}, [count]);
	const geo = useMemo(() => {
		const g = new THREE.BufferGeometry();
		g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
		return g;
	}, [count]);
	const pos = geo.getAttribute('position') as THREE.BufferAttribute;
	for (let i = 0; i < count; i++) {
		const ph = base[i * 4 + 3];
		const fx = (base[i * 4] + Math.sin(t * 0.21 + ph) * 0.04 + t * 0.006) % 1;
		const fy = (base[i * 4 + 1] + t * 0.012 + Math.sin(t * 0.33 + ph * 2) * 0.03) % 1;
		const fz = base[i * 4 + 2] + Math.cos(t * 0.17 + ph) * 0.03;
		pos.setXYZ(i, center[0] + (fx - 0.5) * size[0], center[1] + (fy - 0.5) * size[1], center[2] + (fz - 0.5) * size[2]);
	}
	pos.needsUpdate = true;
	return (
		<points geometry={geo} renderOrder={12}>
			<pointsMaterial map={glowTex()} color={color} size={pointSize} transparent opacity={opacity} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation />
		</points>
	);
};

// ---------- Rain streaks ----------
export const Rain: React.FC<{
	readonly t: number;
	readonly count?: number;
	readonly center: V3;
	readonly size: V3;
	readonly opacity?: number;
	readonly speed?: number;
	readonly color?: string;
}> = ({t, count = 500, center, size, opacity = 0.35, speed = 9, color = '#a9c4e8'}) => {
	const ref = useRef<THREE.InstancedMesh>(null);
	const seeds = useMemo(() => {
		const r = rng(7);
		return Array.from({length: count}, () => [r(), r(), r()]);
	}, [count]);
	useLayoutEffect(() => {
		const m = ref.current!;
		const o = new THREE.Object3D();
		for (let i = 0; i < count; i++) {
			const [a, b, c] = seeds[i];
			const fy = 1 - ((b + t * speed / size[1] * (0.8 + c * 0.4)) % 1);
			o.position.set(center[0] + (a - 0.5) * size[0], center[1] + (fy - 0.5) * size[1], center[2] + (c - 0.5) * size[2]);
			o.rotation.set(0, 0, 0.06);
			o.updateMatrix();
			m.setMatrixAt(i, o.matrix);
		}
		m.instanceMatrix.needsUpdate = true;
	});
	return (
		<instancedMesh ref={ref} args={[undefined, undefined, count]} frustumCulled={false}>
			<boxGeometry args={[0.004, 0.32, 0.004]} />
			<meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} fog />
		</instancedMesh>
	);
};

// ---------- Droplets sliding on window glass (in glass local space, plane XY) ----------
export const Droplets: React.FC<{readonly t: number; readonly w: number; readonly h: number; readonly count?: number}> = ({
	t,
	w,
	h,
	count = 140,
}) => {
	const ref = useRef<THREE.InstancedMesh>(null);
	const seeds = useMemo(() => {
		const r = rng(99);
		return Array.from({length: count}, () => [r(), r(), r(), r()]);
	}, [count]);
	useLayoutEffect(() => {
		const m = ref.current!;
		const o = new THREE.Object3D();
		for (let i = 0; i < count; i++) {
			const [a, b, c, d] = seeds[i];
			const moving = d < 0.25;
			const fy = moving ? 1 - ((b + t * (0.04 + c * 0.08)) % 1) : b;
			const s = 0.004 + c * 0.009;
			o.position.set((a - 0.5) * w, (fy - 0.5) * h, 0);
			o.scale.set(s, s * (moving ? 1.5 : 1.1), s * 0.4);
			o.updateMatrix();
			m.setMatrixAt(i, o.matrix);
		}
		m.instanceMatrix.needsUpdate = true;
	});
	return (
		<instancedMesh ref={ref} args={[undefined, undefined, count]} frustumCulled={false}>
			<sphereGeometry args={[1, 10, 8]} />
			<meshStandardMaterial color="#c9dcf2" roughness={0.02} metalness={0.4} transparent opacity={0.55} />
		</instancedMesh>
	);
};

// ---------- City skyline (instanced-ish boxes with lit windows) ----------
export const City: React.FC<{
	readonly seed?: number;
	readonly center: V3;
	readonly spread: [number, number];
	readonly count?: number;
	readonly minH?: number;
	readonly maxH?: number;
	readonly warmth?: number;
	readonly brightness?: number;
}> = ({seed = 5, center, spread, count = 40, minH = 6, maxH = 28, warmth = 0.6, brightness = 1}) => {
	const texA = useWindowsTexture(seed, warmth);
	const texB = useWindowsTexture(seed + 1, warmth);
	const items = useMemo(() => {
		const r = rng(seed);
		return Array.from({length: count}, () => {
			const w = 2 + r() * 4;
			const d = 2 + r() * 4;
			const h = minH + r() * (maxH - minH);
			return {
				x: center[0] + (r() - 0.5) * spread[0],
				z: center[2] + (r() - 0.5) * spread[1],
				w,
				d,
				h,
				b: r() < 0.5,
			};
		});
	}, [seed, count, center[0], center[2], spread[0], spread[1], minH, maxH]);
	const mats = useMemo(
		() =>
			[texA, texB].map(
				(tx) =>
					new THREE.MeshStandardMaterial({
						color: '#0b0e14',
						emissive: '#ffffff',
						emissiveMap: tx,
						emissiveIntensity: 1.2 * brightness,
						roughness: 0.9,
					}),
			),
		[texA, texB, brightness],
	);
	const itemMats = useMemo(
		() =>
			items.map((it) => {
				const m = mats[it.b ? 1 : 0].clone();
				const map = (m.emissiveMap as THREE.Texture).clone();
				map.repeat.set(Math.max(1, Math.round(it.w / 3)), Math.max(1, Math.round(it.h / 8)));
				map.needsUpdate = true;
				m.emissiveMap = map;
				return m;
			}),
		[items, mats],
	);
	return (
		<group>
			{items.map((it, i) => (
				<mesh key={i} position={[it.x, center[1] + it.h / 2, it.z]} material={itemMats[i]}>
					<boxGeometry args={[it.w, it.h, it.d]} />
				</mesh>
			))}
		</group>
	);
};

// ---------- Room shell with a window cut in the back wall ----------
export const Room: React.FC<{
	readonly w: number;
	readonly d: number;
	readonly h: number;
	readonly wall: string;
	readonly floor: string;
	readonly win?: {x: number; y: number; w: number; h: number};
	readonly floorRepeat?: [number, number];
}> = ({w, d, h, wall, floor, win, floorRepeat = [3, 3]}) => {
	const wood = useWoodTexture(floor, floorRepeat);
	const plaster = usePlasterTexture(wall, [3, 2]);
	const wallMat = useMemo(() => new THREE.MeshStandardMaterial({map: plaster, roughness: 0.95}), [plaster]);
	const z = -d / 2;
	const t = 0.1;
	const backWall = win ? (
		<group>
			{/* left of window */}
			<mesh position={[(-w / 2 + (win.x - win.w / 2)) / 2, h / 2, z]} material={wallMat} receiveShadow>
				<boxGeometry args={[win.x - win.w / 2 + w / 2, h, t]} />
			</mesh>
			{/* right */}
			<mesh position={[(w / 2 + (win.x + win.w / 2)) / 2, h / 2, z]} material={wallMat} receiveShadow>
				<boxGeometry args={[w / 2 - (win.x + win.w / 2), h, t]} />
			</mesh>
			{/* below */}
			<mesh position={[win.x, (win.y - win.h / 2) / 2, z]} material={wallMat} receiveShadow>
				<boxGeometry args={[win.w, win.y - win.h / 2, t]} />
			</mesh>
			{/* above */}
			<mesh position={[win.x, (h + win.y + win.h / 2) / 2, z]} material={wallMat} receiveShadow>
				<boxGeometry args={[win.w, h - (win.y + win.h / 2), t]} />
			</mesh>
		</group>
	) : (
		<mesh position={[0, h / 2, z]} material={wallMat} receiveShadow>
			<boxGeometry args={[w, h, t]} />
		</mesh>
	);
	return (
		<group>
			<mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
				<planeGeometry args={[w, d]} />
				<meshStandardMaterial map={wood} roughness={0.55} />
			</mesh>
			{backWall}
			<mesh position={[-w / 2, h / 2, 0]} material={wallMat} receiveShadow>
				<boxGeometry args={[t, h, d]} />
			</mesh>
			<mesh position={[w / 2, h / 2, 0]} material={wallMat} receiveShadow>
				<boxGeometry args={[t, h, d]} />
			</mesh>
			<mesh position={[0, h, 0]} rotation={[Math.PI / 2, 0, 0]}>
				<planeGeometry args={[w, d]} />
				<meshStandardMaterial color="#1a1816" roughness={1} />
			</mesh>
			{/* skirting */}
			<mesh position={[0, 0.05, z + 0.06]}>
				<boxGeometry args={[w, 0.1, 0.02]} />
				<meshStandardMaterial color="#d8d2c6" roughness={0.6} />
			</mesh>
		</group>
	);
};

// Window frame + glass + droplets, placed in back wall at (x, y, z)
export const WindowUnit: React.FC<{
	readonly x: number;
	readonly y: number;
	readonly z: number;
	readonly w: number;
	readonly h: number;
	readonly t: number;
	readonly frame?: string;
	readonly droplets?: boolean;
}> = ({x, y, z, w, h, t, frame = '#2b2622', droplets = true}) => {
	const fm = useMemo(() => new THREE.MeshStandardMaterial({color: frame, roughness: 0.6}), [frame]);
	const b = 0.05;
	return (
		<group position={[x, y, z]}>
			<mesh position={[0, h / 2, 0]} material={fm}><boxGeometry args={[w + b, b, 0.12]} /></mesh>
			<mesh position={[0, -h / 2, 0.05]} material={fm}><boxGeometry args={[w + 0.2, b, 0.26]} /></mesh>
			<mesh position={[-w / 2, 0, 0]} material={fm}><boxGeometry args={[b, h, 0.12]} /></mesh>
			<mesh position={[w / 2, 0, 0]} material={fm}><boxGeometry args={[b, h, 0.12]} /></mesh>
			<mesh position={[0, 0, 0]} material={fm}><boxGeometry args={[0.03, h, 0.08]} /></mesh>
			<mesh position={[0, h * 0.12, 0]} material={fm}><boxGeometry args={[w, 0.03, 0.08]} /></mesh>
			<mesh position={[0, 0, 0.01]}>
				<planeGeometry args={[w, h]} />
				<meshStandardMaterial color="#7f9bbf" roughness={0.05} metalness={0.6} transparent opacity={0.09} depthWrite={false} />
			</mesh>
			{droplets ? (
				<group position={[0, 0, 0.03]}>
					<Droplets t={t} w={w} h={h} />
				</group>
			) : null}
		</group>
	);
};

// ---------- Furniture ----------
const M = (color: string, roughness = 0.8, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
	new THREE.MeshStandardMaterial({color, roughness, ...extra});

export const Bed: React.FC<{readonly position: V3; readonly rotY?: number}> = ({position, rotY = 0}) => {
	const mats = useMemo(
		() => ({frame: M('#3a2a20', 0.6), sheet: M('#8a8f99', 0.95), blanket: M('#3d4656', 0.95), pillow: M('#c9c6bf', 0.95)}),
		[],
	);
	return (
		<group position={position} rotation={[0, rotY, 0]}>
			<mesh position={[0, 0.17, 0]} material={mats.frame} castShadow receiveShadow><boxGeometry args={[1.5, 0.3, 2.05]} /></mesh>
			<mesh position={[0, 0.4, 0]} material={mats.sheet} castShadow receiveShadow><boxGeometry args={[1.42, 0.18, 1.98]} /></mesh>
			<mesh position={[0, 0.5, 0.25]} rotation={[0.02, 0, 0.01]} material={mats.blanket} castShadow receiveShadow><boxGeometry args={[1.46, 0.06, 1.4]} /></mesh>
			<mesh position={[0, 0.8, -1.02]} material={mats.frame} castShadow receiveShadow><boxGeometry args={[1.56, 0.85, 0.08]} /></mesh>
			<mesh position={[-0.35, 0.56, -0.75]} rotation={[-0.25, 0, 0]} scale={[1, 0.4, 0.62]} material={mats.pillow} castShadow><sphereGeometry args={[0.32, 20, 14]} /></mesh>
			<mesh position={[0.35, 0.56, -0.75]} rotation={[-0.25, 0, 0]} scale={[1, 0.4, 0.62]} material={mats.pillow} castShadow><sphereGeometry args={[0.32, 20, 14]} /></mesh>
		</group>
	);
};

export const Nightstand: React.FC<{readonly position: V3; readonly lampOn?: number; readonly flicker?: number}> = ({position, lampOn = 1}) => {
	const mats = useMemo(() => ({wood: M('#4a3426', 0.55), base: M('#202020', 0.3, {metalness: 0.6})}), []);
	return (
		<group position={position}>
			<mesh position={[0, 0.27, 0]} material={mats.wood} castShadow receiveShadow><boxGeometry args={[0.45, 0.54, 0.4]} /></mesh>
			<mesh position={[0, 0.3, 0.205]} material={mats.base}><boxGeometry args={[0.12, 0.015, 0.01]} /></mesh>
			<mesh position={[0, 0.58, 0]} material={mats.base} castShadow><cylinderGeometry args={[0.07, 0.08, 0.04, 20]} /></mesh>
			<mesh position={[0, 0.72, 0]} material={mats.base}><cylinderGeometry args={[0.01, 0.01, 0.26, 8]} /></mesh>
			<mesh position={[0, 0.88, 0]}>
				<cylinderGeometry args={[0.09, 0.14, 0.2, 24, 1, true]} />
				<meshStandardMaterial color="#f3dfbd" emissive="#ffb560" emissiveIntensity={1.4 * lampOn} side={THREE.DoubleSide} roughness={0.9} transparent opacity={0.95} />
			</mesh>
			<Glow position={[0, 0.86, 0]} size={0.9} color="#ffb766" opacity={0.55 * lampOn} />
			<pointLight position={[0, 0.86, 0.05]} intensity={2.6 * lampOn} distance={6} decay={1.6} color="#ffad5c" castShadow shadow-mapSize={[512, 512]} shadow-bias={-0.002} />
		</group>
	);
};

export const Chair: React.FC<{readonly position: V3; readonly rotY?: number; readonly color?: string}> = ({position, rotY = 0, color = '#3b2b22'}) => {
	const m = useMemo(() => M(color, 0.6), [color]);
	return (
		<group position={position} rotation={[0, rotY, 0]}>
			<mesh position={[0, 0.42, 0]} material={m} castShadow receiveShadow><boxGeometry args={[0.46, 0.05, 0.44]} /></mesh>
			{[[-0.2, -0.19], [0.2, -0.19], [-0.2, 0.19], [0.2, 0.19]].map(([x, z], i) => (
				<mesh key={i} position={[x, 0.2, z]} material={m} castShadow><boxGeometry args={[0.04, 0.4, 0.04]} /></mesh>
			))}
			<mesh position={[0, 0.72, -0.2]} material={m} castShadow><boxGeometry args={[0.46, 0.5, 0.04]} /></mesh>
		</group>
	);
};

export const Mug: React.FC<{readonly position: V3; readonly color?: string; readonly steam?: number; readonly t?: number}> = ({position, color = '#d9d4ca'}) => (
	<group position={position}>
		<mesh castShadow position={[0, 0.05, 0]}>
			<cylinderGeometry args={[0.04, 0.035, 0.1, 20]} />
			<meshStandardMaterial color={color} roughness={0.35} />
		</mesh>
		<mesh position={[0.045, 0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
			<torusGeometry args={[0.025, 0.007, 8, 16]} />
			<meshStandardMaterial color={color} roughness={0.35} />
		</mesh>
		<mesh position={[0, 0.097, 0]} rotation={[-Math.PI / 2, 0, 0]}>
			<circleGeometry args={[0.036, 20]} />
			<meshStandardMaterial color="#3a2012" roughness={0.2} />
		</mesh>
	</group>
);

// ---------- Phone with chat screen drawn on a canvas ----------
export const Phone: React.FC<{
	readonly typed: string;
	readonly cursor: boolean;
	readonly screenOn?: number;
	readonly sentBubbles?: string[];
	readonly title?: string;
}> = ({typed, cursor, screenOn = 1, sentBubbles = [], title = 'Bima'}) => {
	const {tex, cv} = useMemo(() => {
		const c = document.createElement('canvas');
		c.width = 360;
		c.height = 760;
		const t = new THREE.CanvasTexture(c);
		t.colorSpace = THREE.SRGBColorSpace;
		return {tex: t, cv: c};
	}, []);
	const key = `${typed}|${cursor}|${sentBubbles.join('/')}`;
	useMemo(() => {
		const c = cv.getContext('2d')!;
		const g = c.createLinearGradient(0, 0, 0, 760);
		g.addColorStop(0, '#16202c');
		g.addColorStop(1, '#0c1118');
		c.fillStyle = g;
		c.fillRect(0, 0, 360, 760);
		// header
		c.fillStyle = '#1f2b3a';
		c.fillRect(0, 0, 360, 92);
		c.fillStyle = '#5f7fa3';
		c.beginPath();
		c.arc(52, 56, 22, 0, Math.PI * 2);
		c.fill();
		c.fillStyle = '#e8eef6';
		c.font = 'bold 26px sans-serif';
		c.fillText(title, 88, 54);
		c.fillStyle = '#8fa3b8';
		c.font = '18px sans-serif';
		c.fillText('online', 88, 78);
		// old incoming bubble
		const bubble = (txt: string, y: number, mine: boolean) => {
			c.font = '26px sans-serif';
			const w = Math.min(300, c.measureText(txt).width + 30);
			const x = mine ? 340 - w : 20;
			c.fillStyle = mine ? '#2f6d63' : '#263445';
			c.beginPath();
			c.roundRect(x, y, w, 50, 16);
			c.fill();
			c.fillStyle = '#eef3f7';
			c.fillText(txt, x + 15, y + 34);
		};
		bubble('Bro, aman kan?', 130, false);
		bubble('Udah lama ga kabar', 186, false);
		sentBubbles.forEach((b, i) => bubble(b, 250 + i * 56, true));
		// input bar
		c.fillStyle = '#1b2633';
		c.fillRect(0, 640, 360, 120);
		c.fillStyle = '#263445';
		c.beginPath();
		c.roundRect(16, 660, 270, 60, 28);
		c.fill();
		c.font = 'bold 30px sans-serif';
		c.fillStyle = typed ? '#f2f6fa' : '#6d8197';
		let shown = typed || 'Ketik pesan';
		while (c.measureText(shown).width > 236 && shown.length > 1) shown = shown.slice(1);
		c.fillText(shown, 34, 701);
		if (cursor) {
			const w = typed ? c.measureText(shown).width : 0;
			c.fillStyle = '#7fd1c0';
			c.fillRect(36 + w, 674, 4, 36);
		}
		c.fillStyle = '#2f8f7f';
		c.beginPath();
		c.arc(322, 690, 26, 0, Math.PI * 2);
		c.fill();
		tex.needsUpdate = true;
	}, [key, cv, tex, title]);
	return (
		<group>
			<mesh castShadow>
				<boxGeometry args={[0.075, 0.155, 0.009]} />
				<meshStandardMaterial color="#111316" roughness={0.3} metalness={0.5} />
			</mesh>
			<mesh position={[0, 0, 0.0047]}>
				<planeGeometry args={[0.068, 0.145]} />
				<meshBasicMaterial map={tex} color={new THREE.Color(screenOn, screenOn, screenOn)} toneMapped={false} />
			</mesh>
			<pointLight position={[0, 0, 0.12]} intensity={0.35 * screenOn} distance={0.9} decay={1.5} color="#9cc4ff" />
		</group>
	);
};

// Spot light that aims at a world-space target.
export const SpotAt: React.FC<{
	readonly position: V3;
	readonly target: V3;
	readonly color?: string;
	readonly intensity: number;
	readonly angle?: number;
	readonly penumbra?: number;
	readonly shadow?: boolean;
	readonly distance?: number;
}> = ({position, target, color = '#ffffff', intensity, angle = 0.5, penumbra = 0.9, shadow = false, distance = 0}) => {
	const obj = useMemo(() => new THREE.Object3D(), []);
	obj.position.set(target[0], target[1], target[2]);
	obj.updateMatrixWorld();
	return (
		<>
			<primitive object={obj} />
			<spotLight
				position={position}
				target={obj}
				color={color}
				intensity={intensity}
				angle={angle}
				penumbra={penumbra}
				distance={distance}
				decay={1.2}
				castShadow={shadow}
				shadow-mapSize={[1024, 1024]}
				shadow-bias={-0.0008}
			/>
		</>
	);
};
