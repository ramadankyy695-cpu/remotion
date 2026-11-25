import React, {useMemo} from 'react';
import * as THREE from 'three';
import type {Face, Pose} from './pose';
import {NEUTRAL_FACE} from './pose';

export type Look = {
	skin: string;
	top: string;
	topDark: string;
	pants: string;
	shoes: string;
	hair: string;
	hairStyle: 'short' | 'buzz' | 'long' | 'beanie';
	hood: boolean;
};

// The protagonist. Same look everywhere so his identity stays consistent.
export const RAKA: Look = {
	skin: '#b67d58',
	top: '#2f5b5c',
	topDark: '#244848',
	pants: '#262c38',
	shoes: '#e9e6df',
	hair: '#140f0c',
	hairStyle: 'short',
	hood: true,
};

export const FRIEND_DIMAS: Look = {
	skin: '#a26b47',
	top: '#b9893a',
	topDark: '#8f6a2c',
	pants: '#3b3a36',
	shoes: '#2b2b2b',
	hair: '#1b1410',
	hairStyle: 'buzz',
	hood: false,
};

export const FRIEND_ARYA: Look = {
	skin: '#c48e68',
	top: '#7a2f36',
	topDark: '#5d242a',
	pants: '#2d3442',
	shoes: '#d8d4cc',
	hair: '#20170f',
	hairStyle: 'long',
	hood: false,
};

export const FRIEND_BAYU: Look = {
	skin: '#9a6644',
	top: '#55606e',
	topDark: '#434c57',
	pants: '#1f2229',
	shoes: '#ece9e2',
	hair: '#111',
	hairStyle: 'beanie',
	hood: false,
};

// Deterministic hair tufts scattered over the scalp for a textured silhouette.
const HAIR_TUFTS: number[][] = (() => {
	const out: number[][] = [];
	let seed = 7;
	const r = () => {
		seed = (seed * 16807) % 2147483647;
		return seed / 2147483647;
	};
	// front quiff
	out.push([0.0, 0.098, 0.06, 1.3, 0.55, 0.95, -0.5, 0]);
	out.push([0.035, 0.094, 0.058, 0.95, 0.5, 0.8, -0.55, 0.3]);
	out.push([-0.038, 0.092, 0.055, 0.95, 0.5, 0.8, -0.45, -0.3]);
	for (let i = 0; i < 22; i++) {
		const th = r() * Math.PI * 2;
		const ph = 0.15 + r() * 0.95;
		const R = 0.105;
		const x = Math.sin(ph) * Math.cos(th) * R * 0.92;
		const z = Math.sin(ph) * Math.sin(th) * R - 0.01;
		const y = Math.cos(ph) * R * 1.03 + 0.012;
		if (z > 0.06 && y < 0.07) continue;
		out.push([x, y, z, 0.7 + r() * 0.4, 0.38 + r() * 0.2, 0.7 + r() * 0.4, (r() - 0.5) * 0.8, th]);
	}
	return out;
})();

const cap = (r: number, l: number) => new THREE.CapsuleGeometry(r, l, 6, 16);

const lathe = (pts: [number, number][], seg = 28) =>
	new THREE.LatheGeometry(
		pts.map(([x, y]) => new THREE.Vector2(x, y)),
		seg,
	);

const GEO = {
	torso: lathe([
		[0.001, 0],
		[0.148, 0],
		[0.152, 0.08],
		[0.148, 0.18],
		[0.16, 0.3],
		[0.176, 0.4],
		[0.18, 0.46],
		[0.155, 0.515],
		[0.095, 0.555],
		[0.001, 0.565],
	]),
	pelvis: lathe([
		[0.001, -0.15],
		[0.115, -0.14],
		[0.152, -0.07],
		[0.152, 0.03],
		[0.001, 0.04],
	]),
	thigh: cap(0.074, 0.32),
	shin: cap(0.058, 0.31),
	upperArm: cap(0.045, 0.2),
	foreArm: cap(0.038, 0.19),
	shoulder: new THREE.SphereGeometry(0.056, 18, 14),
	palm: new THREE.SphereGeometry(1, 14, 10),
	finger: cap(0.016, 0.05),
	shoe: cap(0.05, 0.13),
	sole: new THREE.BoxGeometry(0.105, 0.025, 0.27),
	neck: new THREE.CylinderGeometry(0.048, 0.056, 0.1, 16),
	head: new THREE.SphereGeometry(0.105, 32, 24),
	jaw: new THREE.SphereGeometry(0.07, 24, 16),
	ear: new THREE.SphereGeometry(0.024, 12, 10),
	eye: new THREE.SphereGeometry(0.0165, 16, 12),
	iris: new THREE.SphereGeometry(0.0098, 12, 10),
	pupil: new THREE.SphereGeometry(0.005, 8, 6),
	glint: new THREE.SphereGeometry(0.0022, 6, 5),
	lid: new THREE.SphereGeometry(0.0185, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
	brow: cap(0.0055, 0.03),
	nose: cap(0.0125, 0.028),
	noseTip: new THREE.SphereGeometry(0.0155, 12, 10),
	hairCap: new THREE.SphereGeometry(
		0.114,
		32,
		18,
		0,
		Math.PI * 2,
		0,
		Math.PI * 0.56,
	),
	hairBack: new THREE.SphereGeometry(
		0.112,
		28,
		16,
		Math.PI * 0.15,
		Math.PI * 0.7,
		Math.PI * 0.3,
		Math.PI * 0.42,
	),
	tuft: new THREE.SphereGeometry(0.035, 12, 9),
	beanie: new THREE.SphereGeometry(
		0.12,
		28,
		16,
		0,
		Math.PI * 2,
		0,
		Math.PI * 0.5,
	),
	beanieRim: new THREE.TorusGeometry(0.108, 0.018, 10, 32),
	hood: new THREE.TorusGeometry(0.1, 0.032, 12, 28),
	pocket: new THREE.BoxGeometry(0.2, 0.09, 0.012),
	string: new THREE.CylinderGeometry(0.0045, 0.0045, 0.11, 6),
	cuff: new THREE.TorusGeometry(0.037, 0.011, 8, 18),
	mouthHole: new THREE.SphereGeometry(1, 16, 10),
};

type Props = {
	readonly pose: Pose;
	readonly face?: Face;
	readonly look?: Look;
	readonly scale?: number;
	readonly headScale?: number;
	readonly opacity?: number;
	readonly faceless?: boolean;
	readonly castShadow?: boolean;
	readonly rightHand?: React.ReactNode;
	readonly leftHand?: React.ReactNode;
	readonly tears?: number;
};

const useMat = (
	color: string,
	roughness: number,
	opacity: number,
	extra: Partial<THREE.MeshStandardMaterialParameters> = {},
) =>
	useMemo(() => {
		const m = new THREE.MeshStandardMaterial({color, roughness, ...extra});
		return m;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [color, roughness]);

const applyOpacity = (mats: THREE.Material[], opacity: number) => {
	for (const m of mats) {
		const t = opacity < 0.999;
		if (m.transparent !== t) {
			m.transparent = t;
			m.needsUpdate = true;
		}
		m.opacity = opacity;
		m.depthWrite = !t;
	}
};

const Mouth: React.FC<{smile: number; open: number; mat: THREE.Material; inner: THREE.Material}> = ({
	smile,
	open,
	mat,
	inner,
}) => {
	const s = Math.round(smile * 40) / 40;
	const geo = useMemo(() => {
		const corner = 0.0075 * s;
		const mid = -0.009 * s;
		const curve = new THREE.QuadraticBezierCurve3(
			new THREE.Vector3(-0.027 - 0.003 * Math.max(0, s), corner, -0.006),
			new THREE.Vector3(0, mid, 0.004),
			new THREE.Vector3(0.027 + 0.003 * Math.max(0, s), corner, -0.006),
		);
		return new THREE.TubeGeometry(curve, 16, 0.0036, 6, false);
	}, [s]);
	return (
		<group>
			<mesh geometry={geo} material={mat} />
			{open > 0.02 ? (
				<mesh
					geometry={GEO.mouthHole}
					material={inner}
					position={[0, -0.004 - 0.004 * open, -0.002]}
					scale={[0.021 + 0.004 * Math.max(0, s), 0.003 + 0.012 * open, 0.006]}
				/>
			) : null}
		</group>
	);
};

export const Character: React.FC<Props> = ({
	pose: p,
	face = NEUTRAL_FACE,
	look = RAKA,
	scale = 1,
	headScale = 1,
	opacity = 1,
	faceless = false,
	castShadow = true,
	rightHand,
	leftHand,
	tears = 0,
}) => {
	const skin = useMat(look.skin, 0.58, opacity);
	const top = useMat(look.top, 0.93, opacity);
	const topDark = useMat(look.topDark, 0.95, opacity);
	const pants = useMat(look.pants, 0.88, opacity);
	const shoes = useMat(look.shoes, 0.6, opacity);
	const sole = useMat('#2d2a27', 0.8, opacity);
	const hair = useMat(look.hair, 0.82, opacity);
	const eyeWhite = useMat('#efe9e0', 0.25, opacity);
	const iris = useMat('#3a2214', 0.3, opacity);
	const pupil = useMat('#070504', 0.2, opacity);
	const glint = useMemo(
		() => new THREE.MeshBasicMaterial({color: '#ffffff'}),
		[],
	);
	const lips = useMat('#874b3e', 0.5, opacity);
	const mouthIn = useMat('#3b1715', 0.7, opacity);
	const brow = useMat('#1a120d', 0.8, opacity);
	const tearMat = useMemo(
		() =>
			new THREE.MeshStandardMaterial({
				color: '#cfe6ff',
				roughness: 0.05,
				metalness: 0.2,
				transparent: true,
			}),
		[],
	);

	applyOpacity(
		[skin, top, topDark, pants, shoes, sole, hair, eyeWhite, iris, pupil, lips, mouthIn, brow],
		opacity,
	);
	tearMat.opacity = tears * opacity;

	const cs = castShadow;
	const lidRot = -0.55 + (1.55 + 0.55) * Math.min(1, face.blink) + face.brow * 0.18;
	const lookOff: [number, number, number] = [
		face.lookX * 0.0045,
		face.lookY * 0.0035,
		0.0105,
	];

	const arm = (side: 1 | -1) => {
		const shX = side === 1 ? p.lShX : p.rShX;
		const shY = side === 1 ? p.lShY : p.rShY;
		const shZ = side === 1 ? p.lShZ : p.rShZ;
		const el = side === 1 ? p.lEl : p.rEl;
		const wr = side === 1 ? p.lWr : p.rWr;
		const held = side === 1 ? leftHand : rightHand;
		return (
			<group position={[0.182 * side, 0.462, 0]} rotation={[shX, shY, shZ]}>
				<mesh geometry={GEO.shoulder} material={top} castShadow={cs} scale={[1, 0.9, 0.95]} />
				<mesh geometry={GEO.upperArm} material={top} position={[0, -0.15, 0]} castShadow={cs} />
				<group position={[0, -0.3, 0]} rotation={[el, 0, 0]}>
					<mesh geometry={GEO.foreArm} material={top} position={[0, -0.13, 0]} castShadow={cs} />
					<mesh geometry={GEO.cuff} material={topDark} position={[0, -0.245, 0]} rotation={[Math.PI / 2, 0, 0]} />
					<group position={[0, -0.27, 0]} rotation={[wr, 0, 0]}>
						<mesh geometry={GEO.palm} material={skin} position={[0, -0.05, 0.005]} scale={[0.036, 0.055, 0.02]} castShadow={cs} />
						<mesh geometry={GEO.finger} material={skin} position={[0, -0.1, 0.012]} rotation={[-0.35, 0, 0]} scale={[2.1, 1.1, 1.0]} castShadow={cs} />
						<mesh geometry={GEO.finger} material={skin} position={[-0.028 * side, -0.045, 0.02]} rotation={[-0.4, 0, 0.5 * side]} scale={[0.85, 0.7, 0.85]} castShadow={cs} />
						{held}
					</group>
				</group>
			</group>
		);
	};

	const leg = (side: 1 | -1) => {
		const hx = side === 1 ? p.lHipX : p.rHipX;
		const hz = side === 1 ? p.lHipZ : p.rHipZ;
		const kn = side === 1 ? p.lKnee : p.rKnee;
		const an = side === 1 ? p.lAnk : p.rAnk;
		return (
			<group position={[0.093 * side, -0.05, 0]} rotation={[hx, 0, hz]}>
				<mesh geometry={GEO.thigh} material={pants} position={[0, -0.22, 0]} castShadow={cs} />
				<group position={[0, -0.44, 0]} rotation={[kn, 0, 0]}>
					<mesh geometry={GEO.shin} material={pants} position={[0, -0.2, 0]} castShadow={cs} />
					<group position={[0, -0.41, 0]} rotation={[an - kn * 0.15, 0, 0]}>
						<mesh geometry={GEO.shoe} material={shoes} position={[0, -0.025, 0.045]} rotation={[Math.PI / 2, 0, 0]} scale={[1.02, 1, 0.82]} castShadow={cs} />
						<mesh geometry={GEO.sole} material={sole} position={[0, -0.062, 0.045]} castShadow={cs} />
					</group>
				</group>
			</group>
		);
	};

	return (
		<group position={[p.x, 0, p.z]} rotation={[0, p.rotY, 0]} scale={scale}>
			<group position={[0, 0.95 + p.y, 0]}>
				<mesh geometry={GEO.pelvis} material={pants} scale={[1, 1, 0.72]} castShadow={cs} />
				{leg(1)}
				{leg(-1)}
				<group position={[0, 0.02, 0]} rotation={[p.spineX, p.spineY, p.spineZ]}>
					<mesh geometry={GEO.torso} material={top} scale={[1, 1, 0.64]} castShadow={cs} />
					{look.hood ? (
						<>
							<mesh geometry={GEO.hood} material={topDark} position={[0, 0.535, -0.035]} rotation={[Math.PI / 2 - 0.25, 0, 0]} scale={[1.08, 1, 0.9]} castShadow={cs} />
							<mesh geometry={GEO.pocket} material={topDark} position={[0, 0.11, 0.094]} />
							<mesh geometry={GEO.string} material={eyeWhite} position={[0.03, 0.43, 0.118]} rotation={[0.12, 0, 0]} />
							<mesh geometry={GEO.string} material={eyeWhite} position={[-0.03, 0.43, 0.118]} rotation={[0.12, 0, 0]} />
						</>
					) : (
						<mesh geometry={GEO.cuff} material={topDark} position={[0, 0.548, 0.0]} rotation={[Math.PI / 2, 0, 0]} scale={[1.35, 1.0, 1]} />
					)}
					{arm(1)}
					{arm(-1)}
					<group position={[0, 0.53, 0]} rotation={[p.neckX, 0, 0]}>
						<mesh geometry={GEO.neck} material={skin} position={[0, 0.045, 0]} castShadow={cs} />
						<group position={[0, 0.072, 0.008]} rotation={[p.headX, p.headY, p.headZ]} scale={headScale}>
							<group position={[0, 0.11, 0]}>
								<mesh geometry={GEO.head} material={skin} scale={[0.9, 1.1, 1.0]} castShadow={cs} />
								<mesh geometry={GEO.jaw} material={skin} position={[0, -0.056, 0.02]} scale={[0.9, 0.74, 0.9]} castShadow={cs} />
								<mesh geometry={GEO.ear} material={skin} position={[0.09, 0.0, -0.005]} scale={[0.42, 1, 0.72]} />
								<mesh geometry={GEO.ear} material={skin} position={[-0.09, 0.0, -0.005]} scale={[0.42, 1, 0.72]} />
								{faceless ? null : (
									<>
										{[1, -1].map((s) => (
											<group key={s} position={[0.035 * s, 0.012, 0.081]}>
												<mesh geometry={GEO.eye} material={eyeWhite} />
												<group position={lookOff}>
													<mesh geometry={GEO.iris} material={iris} />
													<mesh geometry={GEO.pupil} material={pupil} position={[0, 0, 0.0065]} />
													<mesh geometry={GEO.glint} material={glint} position={[0.003, 0.003, 0.0092]} />
												</group>
												<mesh geometry={GEO.lid} material={skin} rotation={[lidRot, 0, 0]} />
												<mesh geometry={GEO.lid} material={skin} rotation={[Math.PI + 0.5 - face.smile * 0.25, 0, 0]} scale={[1.02, 0.7, 1.02]} />
												<mesh
													geometry={GEO.brow}
													material={brow}
													position={[0.002 * s, 0.032 + face.brow * 0.006 - Math.max(0, face.smile) * 0.002, 0.012]}
													rotation={[0, 0, Math.PI / 2 - s * face.brow * 0.32 + s * 0.06]}
												/>
												{tears > 0.01 ? (
													<mesh geometry={GEO.glint} material={tearMat} position={[0.004 * s, -0.02 - tears * 0.02, 0.012]} scale={[1.6, 2.4, 1.2]} />
												) : null}
											</group>
										))}
										<mesh geometry={GEO.nose} material={skin} position={[0, -0.012, 0.095]} rotation={[-0.3, 0, 0]} scale={[0.9, 0.85, 0.8]} />
										<mesh geometry={GEO.noseTip} material={skin} position={[0, -0.03, 0.1]} scale={[1.1, 0.8, 0.8]} />
										<group position={[0, -0.063, 0.093]}>
											<Mouth smile={face.smile} open={face.mouthOpen} mat={lips} inner={mouthIn} />
										</group>
									</>
								)}
								{/* Hair */}
								{look.hairStyle === 'beanie' ? (
									<group>
										<mesh geometry={GEO.beanie} material={topDark} position={[0, 0.015, -0.005]} rotation={[-0.2, 0, 0]} scale={[0.92, 1.1, 1.0]} castShadow={cs} />
										<mesh geometry={GEO.beanieRim} material={topDark} position={[0, 0.03, -0.01]} rotation={[Math.PI / 2 - 0.2, 0, 0]} scale={[0.92, 1.04, 1]} />
									</group>
								) : (
									<group>
										<mesh
											geometry={GEO.hairCap}
											material={hair}
											position={[0, look.hairStyle === 'buzz' ? 0.008 : 0.012, -0.012]}
											rotation={[-0.62, 0, 0]}
											scale={look.hairStyle === 'buzz' ? [0.915, 1.03, 1.01] : [0.92, 1.03, 1.02]}
											castShadow={cs}
										/>
										<mesh geometry={GEO.hairBack} material={hair} position={[0, 0.0, -0.004]} rotation={[0, Math.PI, 0]} scale={[0.92, 1.1, 1.03]} />
										{look.hairStyle === 'short'
											? HAIR_TUFTS.map((t, i) => (
													<mesh
														key={i}
														geometry={GEO.tuft}
														material={hair}
														position={[t[0], t[1], t[2]]}
														scale={[t[3], t[4], t[5]]}
														rotation={[t[6], t[7], 0]}
														castShadow={cs}
													/>
												))
											: null}
										{look.hairStyle === 'long'
											? [1, -1].map((s) => (
													<mesh key={s} geometry={GEO.tuft} material={hair} position={[0.075 * s, -0.01, -0.02]} scale={[0.6, 1.9, 1.3]} castShadow={cs} />
												))
											: null}
									</group>
								)}
							</group>
						</group>
					</group>
				</group>
			</group>
		</group>
	);
};
