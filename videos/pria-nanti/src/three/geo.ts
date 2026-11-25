import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

// Shared geometry cache so we never rebuild meshes every frame.
const cache = new Map<string, THREE.BufferGeometry>();

const cached = <T extends THREE.BufferGeometry>(key: string, make: () => T): T => {
	const existing = cache.get(key);
	if (existing) {
		return existing as T;
	}
	const g = make();
	cache.set(key, g);
	return g;
};

// A smooth tapered capsule pointing down (-Y) from the origin, length `len`.
export const taper = (r1: number, r2: number, len: number, seg = 20, topCap = 0.55) =>
	cached(`taper-${r1}-${r2}-${len}-${seg}-${topCap}`, () => {
		const pts: THREE.Vector2[] = [];
		const steps = 8;
		// top cap (flattened so it hides inside the parent segment's cap)
		for (let i = 0; i <= steps; i++) {
			const a = (Math.PI / 2) * (i / steps);
			pts.push(new THREE.Vector2(Math.sin(a) * r1, Math.cos(a) * r1 * topCap));
		}
		// slight muscle bulge in the middle
		const mids = 8;
		for (let i = 1; i < mids; i++) {
			const t = i / mids;
			const r = r1 + (r2 - r1) * t + Math.sin(t * Math.PI) * 0.06 * (r1 + r2) * 0.5;
			pts.push(new THREE.Vector2(r, -len * t));
		}
		for (let i = 0; i <= steps; i++) {
			const a = (Math.PI / 2) * (i / steps);
			pts.push(new THREE.Vector2(Math.cos(a) * r2, -len - Math.sin(a) * r2));
		}
		pts[pts.length - 1].x = 0.0001;
		pts[0].x = 0.0001;
		const g = new THREE.LatheGeometry(pts, seg);
		g.computeVertexNormals();
		return g;
	});

export const lathe = (key: string, profile: [number, number][], seg = 28) =>
	cached(`lathe-${key}`, () => {
		const g = new THREE.LatheGeometry(
			profile.map(([r, y]) => new THREE.Vector2(Math.max(r, 0.0001), y)),
			seg,
		);
		g.computeVertexNormals();
		return g;
	});

export const sphere = (r = 1, w = 28, h = 20) =>
	cached(`sphere-${r}-${w}-${h}`, () => new THREE.SphereGeometry(r, w, h));

export const partSphere = (r: number, thetaStart: number, thetaLength: number, phiStart = 0, phiLength = Math.PI * 2) =>
	cached(`psphere-${r}-${thetaStart}-${thetaLength}-${phiStart}-${phiLength}`, () =>
		new THREE.SphereGeometry(r, 32, 20, phiStart, phiLength, thetaStart, thetaLength),
	);

export const rbox = (w: number, h: number, d: number, r = 0.02, s = 3) =>
	cached(`rbox-${w}-${h}-${d}-${r}-${s}`, () => new RoundedBoxGeometry(w, h, d, s, Math.min(r, w / 2 - 0.0001, h / 2 - 0.0001, d / 2 - 0.0001)));

export const box = (w: number, h: number, d: number) => cached(`box-${w}-${h}-${d}`, () => new THREE.BoxGeometry(w, h, d));

export const cyl = (rt: number, rb: number, h: number, seg = 24, open = false) =>
	cached(`cyl-${rt}-${rb}-${h}-${seg}-${open}`, () => new THREE.CylinderGeometry(rt, rb, h, seg, 1, open));

export const torus = (r: number, tube: number, arc = Math.PI * 2, rs = 12, ts = 32) =>
	cached(`torus-${r}-${tube}-${arc}`, () => new THREE.TorusGeometry(r, tube, rs, ts, arc));

export const plane = (w: number, h: number, sw = 1, sh = 1) => cached(`plane-${w}-${h}-${sw}-${sh}`, () => new THREE.PlaneGeometry(w, h, sw, sh));

// Organic blob (for foliage, bushes) - displaced icosphere, smooth shaded.
export const blob = (seed: number, r = 1, detail = 3, amp = 0.18) =>
	cached(`blob-${seed}-${r}-${detail}-${amp}`, () => {
		const g = new THREE.IcosahedronGeometry(r, detail);
		const pos = g.attributes.position;
		const v = new THREE.Vector3();
		for (let i = 0; i < pos.count; i++) {
			v.fromBufferAttribute(pos, i);
			const n =
				Math.sin(v.x * 3.1 + seed) * Math.cos(v.y * 2.7 + seed * 1.3) * 0.5 +
				Math.sin(v.z * 4.3 + seed * 2.1) * 0.3 +
				Math.sin((v.x + v.y + v.z) * 6.0 + seed) * 0.2;
			v.multiplyScalar(1 + n * amp);
			pos.setXYZ(i, v.x, v.y, v.z);
		}
		g.deleteAttribute('normal');
		const merged = mergeVerts(g);
		merged.computeVertexNormals();
		return merged;
	});

// Merge vertices of a non-indexed geometry so normals become smooth.
const mergeVerts = (g: THREE.BufferGeometry) => {
	const pos = g.attributes.position;
	const map = new Map<string, number>();
	const verts: number[] = [];
	const index: number[] = [];
	for (let i = 0; i < pos.count; i++) {
		const key = `${pos.getX(i).toFixed(4)},${pos.getY(i).toFixed(4)},${pos.getZ(i).toFixed(4)}`;
		let idx = map.get(key);
		if (idx === undefined) {
			idx = verts.length / 3;
			verts.push(pos.getX(i), pos.getY(i), pos.getZ(i));
			map.set(key, idx);
		}
		index.push(idx);
	}
	const out = new THREE.BufferGeometry();
	out.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
	out.setIndex(index);
	return out;
};

// Material cache
const mats = new Map<string, THREE.Material>();
export const mat = (
	color: string,
	opts: {rough?: number; metal?: number; emissive?: string; ei?: number; transparent?: boolean; opacity?: number; side?: THREE.Side} = {},
) => {
	const key = `${color}-${JSON.stringify(opts)}`;
	const ex = mats.get(key);
	if (ex) {
		return ex as THREE.MeshStandardMaterial;
	}
	const m = new THREE.MeshStandardMaterial({
		color,
		roughness: opts.rough ?? 0.8,
		metalness: opts.metal ?? 0,
		emissive: opts.emissive ?? '#000000',
		emissiveIntensity: opts.ei ?? 1,
		transparent: opts.transparent ?? false,
		opacity: opts.opacity ?? 1,
		side: opts.side ?? THREE.FrontSide,
	});
	mats.set(key, m);
	return m;
};

// Deterministic pseudo random
export const rand = (seed: number) => {
	const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
	return x - Math.floor(x);
};

// Loft along Y: rings of [y, halfWidth(x), halfDepth(z), squareness n, zOffset]
export const loft = (key: string, rings: [number, number, number, number?, number?][], seg = 36) =>
	cached(`loft-${key}`, () => {
		const verts: number[] = [];
		const idx: number[] = [];
		const cols = seg + 1;
		rings.forEach(([y, w, d, n = 2.2, zo = 0]) => {
			for (let i = 0; i <= seg; i++) {
				const a = (i / seg) * Math.PI * 2;
				const c = Math.cos(a);
				const s = Math.sin(a);
				const e = 2 / n;
				const x = Math.sign(c) * Math.pow(Math.abs(c), e) * w;
				const z = Math.sign(s) * Math.pow(Math.abs(s), e) * d + zo;
				verts.push(x, y, z);
			}
		});
		for (let r = 0; r < rings.length - 1; r++) {
			for (let i = 0; i < seg; i++) {
				const a = r * cols + i;
				const b = a + cols;
				idx.push(a, b, a + 1, b, b + 1, a + 1);
			}
		}
		const g = new THREE.BufferGeometry();
		g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
		g.setIndex(idx);
		g.computeVertexNormals();
		// make seam normals continuous
		const nrm = g.attributes.normal;
		for (let r = 0; r < rings.length; r++) {
			const a = r * cols;
			const b = a + seg;
			const nx = (nrm.getX(a) + nrm.getX(b)) / 2;
			const ny = (nrm.getY(a) + nrm.getY(b)) / 2;
			const nz = (nrm.getZ(a) + nrm.getZ(b)) / 2;
			nrm.setXYZ(a, nx, ny, nz);
			nrm.setXYZ(b, nx, ny, nz);
		}
		g.normalizeNormals();
		return g;
	});

// Stylized human head: a deformed sphere with jaw taper, cheekbones and flatter sides.
export const headGeo = () =>
	cached('head', () => {
		const g = new THREE.SphereGeometry(0.1, 64, 48);
		const p = g.attributes.position;
		const v = new THREE.Vector3();
		for (let i = 0; i < p.count; i++) {
			v.fromBufferAttribute(p, i);
			const ny = v.y / 0.1; // -1..1
			const nz = v.z / 0.1;
			let x = v.x * 0.86;
			let y = v.y * 1.18;
			let z = v.z * 1.0;
			// jaw taper below the cheekbones
			if (ny < 0.05) {
				const t = Math.min(1, (0.05 - ny) / 1.05);
				x *= 1 - 0.24 * t * t * (0.6 + 0.4 * Math.abs(nz));
				z *= 1 - 0.1 * t;
				// push chin/jaw slightly forward
				if (nz > 0) {
					z += 0.012 * t;
				}
				y -= 0.012 * t;
			}
			// flatten face front a little and back of the skull rounder
			if (nz > 0.6) {
				z -= (nz - 0.6) * 0.012;
			}
			if (nz < -0.2) {
				z *= 1.06;
			}
			// cheekbones
			const cheek = Math.exp(-Math.pow((ny + 0.05) / 0.2, 2)) * Math.max(0, nz - 0.2);
			x *= 1 + cheek * 0.06;
			// eye sockets (shallow)
			const socket = Math.exp(-Math.pow((ny - 0.1) / 0.13, 2)) * Math.exp(-Math.pow((Math.abs(v.x / 0.1) - 0.36) / 0.2, 2)) * Math.max(0, nz);
			z -= socket * 0.009;
			p.setXYZ(i, x, y, z);
		}
		g.computeVertexNormals();
		return g;
	});
