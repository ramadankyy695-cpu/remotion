import {RoundedBox} from '@react-three/drei';
import React, {useMemo} from 'react';
import * as THREE from 'three';

/**
 * Procedural, hierarchically rigged character. Every joint is a THREE.Group
 * whose rotation is driven by a `Pose`, so the same model is reused (and stays
 * identical) in every scene. Character faces +Z.
 *
 * Rotation conventions (radians):
 * - hip/shoulder X: negative = swing forward
 * - knee: positive = bend (shin goes back)
 * - elbow: negative = bend (forearm comes forward/up)
 * - spine/chest/neck/head X: positive = lean / nod forward
 * - shoulderZ / hipZ: positive = away from the body (abduction)
 * - shoulderY: positive = internal rotation (forearm turns toward the body)
 */
export type Pose = {
	x: number;
	y: number;
	z: number;
	rotY: number;
	hipsY: number;
	hipsX: number;
	spineX: number;
	spineY: number;
	chestX: number;
	neckX: number;
	headX: number;
	headY: number;
	headZ: number;
	lShoulderX: number;
	lShoulderZ: number;
	lShoulderY: number;
	lElbow: number;
	lWristX: number;
	lWristZ: number;
	rShoulderX: number;
	rShoulderZ: number;
	rShoulderY: number;
	rElbow: number;
	rWristX: number;
	rWristZ: number;
	lHipX: number;
	lHipZ: number;
	lKnee: number;
	lAnkle: number;
	rHipX: number;
	rHipZ: number;
	rKnee: number;
	rAnkle: number;
	// face
	sad: number;
	smile: number;
	blink: number;
	lookX: number;
	lookY: number;
	fingerCurl: number;
};

export const basePose = (): Pose => ({
	x: 0,
	y: 0,
	z: 0,
	rotY: 0,
	hipsY: 0.95,
	hipsX: 0,
	spineX: 0,
	spineY: 0,
	chestX: 0,
	neckX: 0,
	headX: 0,
	headY: 0,
	headZ: 0,
	lShoulderX: 0,
	lShoulderZ: 0.08,
	lShoulderY: 0,
	lElbow: -0.12,
	lWristX: 0,
	lWristZ: 0,
	rShoulderX: 0,
	rShoulderZ: 0.08,
	rShoulderY: 0,
	rElbow: -0.12,
	rWristX: 0,
	rWristZ: 0,
	lHipX: 0,
	lHipZ: 0.02,
	lKnee: 0,
	lAnkle: 0,
	rHipX: 0,
	rHipZ: 0.02,
	rKnee: 0,
	rAnkle: 0,
	sad: 0.5,
	smile: -0.2,
	blink: 0,
	lookX: 0,
	lookY: 0,
	fingerCurl: 0.3,
});

export const mixPose = (a: Pose, b: Pose, t: number): Pose => {
	const out = {...a};
	for (const k of Object.keys(a) as (keyof Pose)[]) {
		out[k] = a[k] + (b[k] - a[k]) * t;
	}

	return out;
};

export const withPose = (p: Partial<Pose>): Pose => ({...basePose(), ...p});

/** Natural breathing + micro-motion layered on top of any pose. */
export const breathe = (p: Pose, frame: number, amount = 1): Pose => {
	const t = frame / 30;
	const b = Math.sin(t * 1.6) * amount;
	return {
		...p,
		chestX: p.chestX - b * 0.015,
		neckX: p.neckX + b * 0.01,
		headY: p.headY + Math.sin(t * 0.37) * 0.03 * amount,
		headZ: p.headZ + Math.sin(t * 0.29 + 1) * 0.015 * amount,
		lShoulderZ: p.lShoulderZ + b * 0.012,
		rShoulderZ: p.rShoulderZ + b * 0.012,
		blink: Math.max(p.blink, blinkAt(frame)),
	};
};

export const blinkAt = (frame: number) => {
	// deterministic blinks roughly every 3-4s
	const period = 107;
	const local = frame % period;
	const offset = (Math.floor(frame / period) * 37) % 23;
	const d = local - (60 + offset);
	if (d < 0 || d > 6) {
		return 0;
	}

	return Math.sin((d / 6) * Math.PI);
};

/** Tired walk cycle. `phase` in radians. Returns pose + forward distance. */
export const walkPose = (
	phase: number,
	tired = 1,
	base: Partial<Pose> = {},
): Pose => {
	const s = Math.sin(phase);
	const c = Math.cos(phase);
	const swing = 0.42 - tired * 0.08;
	return withPose({
		...base,
		hipsY: 0.93 + 0.022 * ((Math.cos(2 * phase) + 1) / 2),
		spineX: 0.1 + tired * 0.08,
		spineY: s * 0.05,
		neckX: 0.06 + tired * 0.08,
		headX: 0.08 + tired * 0.18,
		lHipX: -swing * s,
		rHipX: swing * s,
		lKnee: 0.12 + 0.75 * Math.max(0, c),
		rKnee: 0.12 + 0.75 * Math.max(0, -c),
		lAnkle: -0.15 * Math.max(0, -c) + 0.2 * Math.max(0, c) * 0.5,
		rAnkle: -0.15 * Math.max(0, c) + 0.2 * Math.max(0, -c) * 0.5,
		lShoulderX: swing * 0.65 * s,
		rShoulderX: -swing * 0.65 * s,
		lElbow: -0.25 - 0.15 * Math.max(0, -s),
		rElbow: -0.25 - 0.15 * Math.max(0, s),
		lShoulderZ: 0.1,
		rShoulderZ: 0.1,
		...(base.sad === undefined ? {} : {sad: base.sad}),
	});
};

/** Frames (relative to the scene) where a foot hits the ground. */
export const footstepFrames = (
	fromFrame: number,
	toFrame: number,
	phaseAt: (f: number) => number,
) => {
	const out: number[] = [];
	for (let f = fromFrame; f < toFrame; f++) {
		const a = Math.floor((phaseAt(f) - Math.PI / 2) / Math.PI);
		const b = Math.floor((phaseAt(f + 1) - Math.PI / 2) / Math.PI);
		if (b > a) {
			out.push(f + 1);
		}
	}

	return out;
};

export type Look = {
	skin: string;
	shirt: string;
	sleeve: string;
	pants: string;
	shoes: string;
	hair: string;
	longHair: boolean;
	scale: number;
	lips: string;
};

export const MAN: Look = {
	skin: '#9a6141',
	shirt: '#38465a',
	sleeve: '#323f52',
	pants: '#2b2b31',
	shoes: '#1c1a19',
	hair: '#0b0a0a',
	longHair: false,
	scale: 1,
	lips: '#8a4c3b',
};

export const WOMAN: Look = {
	skin: '#b07a58',
	shirt: '#b8705f',
	sleeve: '#b8705f',
	pants: '#4d5f7d',
	shoes: '#3b2a24',
	hair: '#0d0a09',
	longHair: true,
	scale: 0.93,
	lips: '#a4505a',
};

const useMats = (look: Look) =>
	useMemo(
		() => ({
			skin: new THREE.MeshStandardMaterial({
				color: look.skin,
				roughness: 0.62,
				metalness: 0,
			}),
			shirt: new THREE.MeshStandardMaterial({
				color: look.shirt,
				roughness: 0.92,
			}),
			sleeve: new THREE.MeshStandardMaterial({
				color: look.sleeve,
				roughness: 0.92,
			}),
			pants: new THREE.MeshStandardMaterial({
				color: look.pants,
				roughness: 0.85,
			}),
			shoes: new THREE.MeshStandardMaterial({
				color: look.shoes,
				roughness: 0.5,
			}),
			hair: new THREE.MeshStandardMaterial({
				color: look.hair,
				roughness: 0.62,
				metalness: 0.0,
			}),
			eyeWhite: new THREE.MeshStandardMaterial({
				color: '#e9e2da',
				roughness: 0.25,
			}),
			iris: new THREE.MeshStandardMaterial({
				color: '#1a0f0a',
				roughness: 0.1,
			}),
			lips: new THREE.MeshStandardMaterial({
				color: look.lips,
				roughness: 0.5,
			}),
			brow: new THREE.MeshStandardMaterial({
				color: look.hair,
				roughness: 0.8,
			}),
		}),
		[look],
	);

type Mats = ReturnType<typeof useMats>;

const Hand: React.FC<{
	readonly mats: Mats;
	readonly side: 1 | -1;
	readonly curl: number;
	readonly children?: React.ReactNode;
}> = ({mats, side, curl, children}) => {
	const fingers = [-0.026, -0.009, 0.009, 0.026];
	return (
		<group>
			<RoundedBox
				args={[0.075, 0.085, 0.03]}
				radius={0.013}
				smoothness={3}
				position={[0, -0.045, 0]}
				material={mats.skin}
				castShadow
			/>
			{fingers.map((fx, i) => (
				<group
					key={fx}
					position={[fx, -0.085, 0.002]}
					rotation={[-curl * 1.1, 0, 0]}
				>
					<mesh position={[0, -0.022, 0]} material={mats.skin} castShadow>
						<capsuleGeometry
							args={[0.0085, 0.03 - (i === 3 ? 0.008 : 0), 3, 6]}
						/>
					</mesh>
					<group position={[0, -0.042, 0]} rotation={[-curl * 0.9, 0, 0]}>
						<mesh position={[0, -0.014, 0]} material={mats.skin} castShadow>
							<capsuleGeometry args={[0.0078, 0.016, 3, 6]} />
						</mesh>
					</group>
				</group>
			))}
			<group
				position={[0.034 * -side, -0.03, 0.012]}
				rotation={[-0.5, 0, 0.6 * side]}
			>
				<mesh position={[0, -0.022, 0]} material={mats.skin} castShadow>
					<capsuleGeometry args={[0.0095, 0.03, 3, 6]} />
				</mesh>
			</group>
			{children}
		</group>
	);
};

const Arm: React.FC<{
	readonly mats: Mats;
	readonly side: 1 | -1;
	readonly sx: number;
	readonly sy: number;
	readonly sz: number;
	readonly elbow: number;
	readonly wx: number;
	readonly wz: number;
	readonly curl: number;
	readonly item?: React.ReactNode;
}> = ({mats, side, sx, sy, sz, elbow, wx, wz, curl, item}) => {
	return (
		<group
			position={[0.19 * side, 0.235, 0]}
			rotation={[sx, -sy * side, sz * side]}
		>
			{/* shoulder ball + short sleeve */}
			<mesh material={mats.sleeve} castShadow position={[0, -0.02, 0]}>
				<sphereGeometry args={[0.056, 14, 12]} />
			</mesh>
			<mesh material={mats.sleeve} castShadow position={[0, -0.08, 0]}>
				<capsuleGeometry args={[0.053, 0.1, 4, 12]} />
			</mesh>
			<mesh material={mats.skin} castShadow position={[0, -0.16, 0]}>
				<capsuleGeometry args={[0.042, 0.2, 4, 12]} />
			</mesh>
			<group position={[0, -0.29, 0]} rotation={[elbow, 0, 0]}>
				<mesh material={mats.skin} castShadow>
					<sphereGeometry args={[0.04, 12, 10]} />
				</mesh>
				<mesh material={mats.skin} castShadow position={[0, -0.125, 0]}>
					<capsuleGeometry args={[0.037, 0.2, 4, 12]} />
				</mesh>
				<group position={[0, -0.255, 0]} rotation={[wx, 0, wz * side]}>
					<Hand mats={mats} side={side} curl={curl}>
						{item}
					</Hand>
				</group>
			</group>
		</group>
	);
};

const Leg: React.FC<{
	readonly mats: Mats;
	readonly side: 1 | -1;
	readonly hx: number;
	readonly hz: number;
	readonly knee: number;
	readonly ankle: number;
}> = ({mats, side, hx, hz, knee, ankle}) => {
	return (
		<group position={[0.095 * side, 0, 0]} rotation={[hx, 0, hz * side]}>
			<mesh material={mats.pants} castShadow position={[0, -0.21, 0]}>
				<capsuleGeometry args={[0.078, 0.36, 4, 14]} />
			</mesh>
			<group position={[0, -0.44, 0]} rotation={[knee, 0, 0]}>
				<mesh material={mats.pants} castShadow>
					<sphereGeometry args={[0.068, 12, 10]} />
				</mesh>
				<mesh material={mats.pants} castShadow position={[0, -0.2, 0]}>
					<capsuleGeometry args={[0.064, 0.34, 4, 14]} />
				</mesh>
				<group position={[0, -0.43, 0]} rotation={[ankle, 0, 0]}>
					<RoundedBox
						args={[0.1, 0.075, 0.26]}
						radius={0.03}
						smoothness={3}
						position={[0, -0.035, 0.055]}
						material={mats.shoes}
						castShadow
					/>
				</group>
			</group>
		</group>
	);
};

const Head: React.FC<{
	readonly mats: Mats;
	readonly look: Look;
	readonly pose: Pose;
	readonly tear: number;
}> = ({mats, look, pose, tear}) => {
	const eyeScaleY = Math.max(0.08, 1 - pose.blink) * (1 - pose.sad * 0.18);
	const mouthCurve = -pose.smile * 0.7;
	return (
		<group>
			{/* skull */}
			<mesh
				material={mats.skin}
				castShadow
				position={[0, 0.115, 0]}
				scale={[0.9, 1.07, 0.98]}
			>
				<sphereGeometry args={[0.112, 28, 22]} />
			</mesh>
			{/* jaw / chin */}
			<mesh
				material={mats.skin}
				castShadow
				position={[0, 0.062, 0.016]}
				scale={[0.74, 0.62, 0.86]}
			>
				<sphereGeometry args={[0.09, 20, 16]} />
			</mesh>
			{/* ears */}
			{[1, -1].map((s) => (
				<mesh
					key={s}
					material={mats.skin}
					position={[0.1 * s, 0.11, -0.005]}
					scale={[0.35, 1, 0.7]}
				>
					<sphereGeometry args={[0.03, 10, 8]} />
				</mesh>
			))}
			{/* nose */}
			<mesh
				material={mats.skin}
				position={[0, 0.092, 0.104]}
				rotation={[0.25, 0, 0]}
				scale={[0.85, 1.25, 0.9]}
			>
				<sphereGeometry args={[0.0135, 12, 10]} />
			</mesh>
			{/* eyes */}
			{[1, -1].map((s) => (
				<group
					key={s}
					position={[0.039 * s, 0.126, 0.088]}
					scale={[1, eyeScaleY, 1]}
				>
					<mesh material={mats.eyeWhite} scale={[1.15, 0.8, 0.6]}>
						<sphereGeometry args={[0.019, 14, 12]} />
					</mesh>
					<mesh
						material={mats.iris}
						position={[pose.lookX * 0.006, -pose.lookY * 0.005, 0.009]}
						scale={[1, 1, 0.5]}
					>
						<sphereGeometry args={[0.0105, 12, 10]} />
					</mesh>
				</group>
			))}
			{/* upper eyelid shading (tired look) */}
			{[1, -1].map((s) => (
				<mesh
					key={s}
					material={mats.skin}
					position={[0.039 * s, 0.139 - pose.sad * 0.003, 0.087]}
					scale={[1.15, 0.22 + pose.sad * 0.18, 0.7]}
				>
					<sphereGeometry args={[0.02, 12, 8]} />
				</mesh>
			))}
			{/* eyebrows: inner ends raise when sad */}
			{[1, -1].map((s) => (
				<mesh
					key={s}
					material={mats.brow}
					position={[0.041 * s, 0.158 + pose.sad * 0.004, 0.1]}
					rotation={[0.1, 0, (-pose.sad * 0.32 + pose.smile * 0.08) * s]}
				>
					<boxGeometry args={[0.036, 0.0065, 0.01]} />
				</mesh>
			))}
			{/* mouth */}
			<mesh
				material={mats.lips}
				position={[0, 0.05 + (mouthCurve > 0 ? -0.006 : 0.004), 0.095]}
				scale={[
					1,
					Math.max(0.12, Math.abs(mouthCurve)) * Math.sign(mouthCurve || 1),
					1,
				]}
				rotation={[0, 0, 0]}
			>
				<torusGeometry args={[0.019, 0.0045, 6, 18, Math.PI]} />
			</mesh>
			{/* tear */}
			{tear > 0 ? (
				<mesh position={[0.045, 0.11 - tear * 0.05, 0.1 - tear * 0.004]}>
					<sphereGeometry args={[0.0055, 10, 8]} />
					<meshPhysicalMaterial
						color="#cfe8ff"
						roughness={0}
						transmission={0.4}
						emissive="#9cc8ff"
						emissiveIntensity={0.6}
					/>
				</mesh>
			) : null}
			{/* hair */}
			<group position={[0, 0.128, -0.008]} rotation={[-0.42, 0, 0]}>
				<mesh material={mats.hair} castShadow scale={[0.97, 1.02, 1.04]}>
					<sphereGeometry
						args={[0.12, 28, 20, 0, Math.PI * 2, 0, Math.PI * 0.5]}
					/>
				</mesh>
				{/* fringe swept to the side */}
				<mesh
					material={mats.hair}
					position={[0.018, 0.066, 0.075]}
					rotation={[0.9, 0.0, -0.35]}
					scale={[1.45, 0.32, 0.62]}
				>
					<sphereGeometry args={[0.058, 16, 10]} />
				</mesh>
				{/* back & sides */}
				<mesh
					material={mats.hair}
					position={[0, -0.01, -0.03]}
					scale={[0.97, 0.8, 0.92]}
				>
					<sphereGeometry args={[0.118, 20, 16]} />
				</mesh>
				{/* short messy tufts */}
				{[
					[0.045, 0.1, 0.03, 0.4],
					[-0.035, 0.105, 0.0, -0.3],
					[0.0, 0.11, -0.04, 0.1],
					[-0.06, 0.085, 0.05, -0.6],
					[0.07, 0.08, -0.02, 0.7],
				].map(([x, y, z, r]) => (
					<mesh
						key={`${x}${y}`}
						material={mats.hair}
						position={[x, y, z]}
						rotation={[0.3, 0, r]}
						scale={[0.75, 0.28, 1.0]}
					>
						<sphereGeometry args={[0.03, 10, 8]} />
					</mesh>
				))}
				{look.longHair ? (
					<>
						<mesh
							material={mats.hair}
							castShadow
							position={[0, -0.19, -0.07]}
							scale={[1.05, 1, 0.55]}
						>
							<capsuleGeometry args={[0.11, 0.2, 6, 16]} />
						</mesh>
						{[1, -1].map((s) => (
							<mesh
								key={s}
								material={mats.hair}
								castShadow
								position={[0.095 * s, -0.12, -0.045]}
								rotation={[0.15, 0, 0]}
								scale={[0.4, 1, 0.75]}
							>
								<capsuleGeometry args={[0.07, 0.16, 4, 10]} />
							</mesh>
						))}
					</>
				) : null}
			</group>
		</group>
	);
};

export const Character: React.FC<{
	readonly pose: Pose;
	readonly look?: Look;
	readonly rightHandItem?: React.ReactNode;
	readonly leftHandItem?: React.ReactNode;
	readonly tear?: number;
}> = ({pose, look = MAN, rightHandItem, leftHandItem, tear = 0}) => {
	const mats = useMats(look);
	return (
		<group
			position={[pose.x, pose.y, pose.z]}
			rotation={[0, pose.rotY, 0]}
			scale={look.scale}
		>
			<group position={[0, pose.hipsY, 0]} rotation={[pose.hipsX, 0, 0]}>
				{/* pelvis */}
				<mesh
					material={mats.pants}
					castShadow
					position={[0, 0.02, 0]}
					scale={[1.25, 0.8, 0.85]}
				>
					<sphereGeometry args={[0.135, 18, 14]} />
				</mesh>
				<Leg
					mats={mats}
					side={1}
					hx={pose.lHipX}
					hz={pose.lHipZ}
					knee={pose.lKnee}
					ankle={pose.lAnkle}
				/>
				<Leg
					mats={mats}
					side={-1}
					hx={pose.rHipX}
					hz={pose.rHipZ}
					knee={pose.rKnee}
					ankle={pose.rAnkle}
				/>
				{/* spine */}
				<group position={[0, 0.06, 0]} rotation={[pose.spineX, pose.spineY, 0]}>
					<mesh
						material={mats.shirt}
						castShadow
						position={[0, 0.12, 0]}
						scale={[1.12, 1, 0.74]}
					>
						<capsuleGeometry args={[0.145, 0.16, 6, 18]} />
					</mesh>
					{/* chest */}
					<group position={[0, 0.22, 0]} rotation={[pose.chestX, 0, 0]}>
						<mesh
							material={mats.shirt}
							castShadow
							position={[0, 0.11, 0]}
							scale={[1.13, 1, 0.72]}
						>
							<capsuleGeometry args={[0.16, 0.14, 6, 18]} />
						</mesh>
						{/* collar */}
						<mesh
							material={mats.sleeve}
							position={[0, 0.27, 0.0]}
							rotation={[Math.PI / 2, 0, 0]}
							scale={[1.1, 0.8, 1]}
						>
							<torusGeometry args={[0.058, 0.012, 6, 18]} />
						</mesh>
						<Arm
							mats={mats}
							side={1}
							sx={pose.lShoulderX}
							sy={pose.lShoulderY}
							sz={pose.lShoulderZ}
							elbow={pose.lElbow}
							wx={pose.lWristX}
							wz={pose.lWristZ}
							curl={pose.fingerCurl}
							item={leftHandItem}
						/>
						<Arm
							mats={mats}
							side={-1}
							sx={pose.rShoulderX}
							sy={pose.rShoulderY}
							sz={pose.rShoulderZ}
							elbow={pose.rElbow}
							wx={pose.rWristX}
							wz={pose.rWristZ}
							curl={pose.fingerCurl}
							item={rightHandItem}
						/>
						{/* neck + head */}
						<group position={[0, 0.27, 0]} rotation={[pose.neckX, 0, 0]}>
							<mesh material={mats.skin} castShadow position={[0, 0.045, 0]}>
								<cylinderGeometry args={[0.045, 0.052, 0.1, 14]} />
							</mesh>
							<group
								position={[0, 0.085, 0.005]}
								rotation={[pose.headX, pose.headY, pose.headZ]}
							>
								<Head mats={mats} look={look} pose={pose} tear={tear} />
							</group>
						</group>
					</group>
				</group>
			</group>
		</group>
	);
};
