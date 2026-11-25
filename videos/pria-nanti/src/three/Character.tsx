import React from 'react';
import * as THREE from 'three';
import {Pose, V3} from './pose';
import {ArmIK, solveArm} from './kinematics';
import {cyl, headGeo, lathe, loft, mat, partSphere, rbox, sphere, taper, torus} from './geo';

export type Look = {
	skin: string;
	top: string; // hoodie / shirt
	topDark: string; // cuffs, pocket, hem
	pants: string;
	shoe: string;
	sole: string;
	hair: string;
	hairStyle: 'hero' | 'father' | 'mother' | 'short' | 'long';
	hood: boolean;
	skirt: boolean; // long skirt (mother)
	build: number; // width multiplier
	height: number; // scale
	detail: boolean; // facial detail and fingers
	glasses?: boolean;
	bag?: boolean;
};

export const HERO: Look = {
	skin: '#c48a64',
	top: '#2a2f3a',
	topDark: '#20242d',
	pants: '#3c4250',
	shoe: '#e9e5dc',
	sole: '#f6f3ee',
	hair: '#141110',
	hairStyle: 'hero',
	hood: true,
	skirt: false,
	build: 1,
	height: 1,
	detail: true,
};

export const FATHER: Look = {
	skin: '#b37a56',
	top: '#7d8a76',
	topDark: '#6a7563',
	pants: '#4a4238',
	shoe: '#3b2f27',
	sole: '#2b221c',
	hair: '#b9b4ac',
	hairStyle: 'father',
	hood: false,
	skirt: false,
	build: 1.04,
	height: 0.96,
	detail: true,
	glasses: true,
};

export const MOTHER: Look = {
	skin: '#be8762',
	top: '#8a4b45',
	topDark: '#74403a',
	pants: '#5b4a3e',
	shoe: '#4a3a30',
	sole: '#2e241e',
	hair: '#8f8a85',
	hairStyle: 'mother',
	hood: false,
	skirt: true,
	build: 0.93,
	height: 0.92,
	detail: true,
};

const ped = (i: number): Look => {
	const tops = ['#5a6b7d', '#8c6d4f', '#4d5f4a', '#a2a6ab', '#6e4d5c', '#3f4e66', '#9b8466', '#55606b'];
	const pants = ['#2d2f35', '#4b5563', '#3a3329', '#22303f', '#5a5048', '#2b2b2b'];
	const skins = ['#c48a64', '#a8714f', '#d39b75', '#b98260', '#9a6546'];
	return {
		skin: skins[i % skins.length],
		top: tops[i % tops.length],
		topDark: tops[(i + 3) % tops.length],
		pants: pants[i % pants.length],
		shoe: i % 2 ? '#2a2a2a' : '#d8d4cc',
		sole: '#e8e4dc',
		hair: i % 3 === 0 ? '#2a2420' : '#141110',
		hairStyle: i % 3 === 1 ? 'long' : 'short',
		hood: false,
		skirt: i % 5 === 2,
		build: 0.92 + (i % 4) * 0.04,
		height: 0.93 + (i % 3) * 0.04,
		detail: false,
		bag: i % 2 === 0,
	};
};
export const pedLook = ped;

const R = (v: V3): [number, number, number] => [v[0], v[1], v[2]];

const Arm: React.FC<{side: 1 | -1; pose: Pose; look: Look; holding?: React.ReactNode; ik?: ArmIK | null}> = ({side, pose, look, holding, ik}) => {
	const sh = side === 1 ? pose.lShoulder : pose.rShoulder;
	const el = side === 1 ? pose.lElbow : pose.rElbow;
	const wr = side === 1 ? pose.lWrist : pose.rWrist;
	const curl = side === 1 ? pose.lFingers : pose.rFingers;
	const clav = side === 1 ? pose.lClav : pose.rClav;
	const top = mat(look.top, {rough: 0.95});
	const cuff = mat(look.topDark, {rough: 0.95});
	const skin = mat(look.skin, {rough: 0.55});
	const w = look.build;
	return (
		<group position={[side * 0.185 * w, 0.115 + clav * 0.04, -0.005]}>
			<group rotation={ik ? undefined : R(sh)} quaternion={ik ? ik.quat : undefined}>
				<mesh geometry={taper(0.064 * w, 0.05 * w, 0.28)} material={top} castShadow />
				<group position={[0, -0.28, 0]} rotation={[ik ? ik.elbow : el, 0, 0]}>
					<mesh geometry={taper(0.05 * w, 0.045 * w, 0.235)} material={top} castShadow />
					<mesh geometry={cyl(0.043 * w, 0.045 * w, 0.035, 18)} material={cuff} position={[0, -0.235, 0]} />
					<group position={[0, -0.255, 0]} rotation={[0, ik ? ik.twist : 0, 0]}>
					<group rotation={R(wr)}>
						{/* wrist */}
						<mesh geometry={cyl(0.026, 0.028, 0.04, 14)} material={skin} position={[0, -0.005, 0]} />
						{/* palm */}
						<mesh geometry={rbox(0.072, 0.085, 0.03, 0.013)} material={skin} position={[0, -0.055, 0.004]} castShadow />
						{look.detail ? (
							<>
								{[0, 1, 2, 3].map((i) => {
									const x = (i - 1.5) * 0.0175 * -side;
									const len = [0.042, 0.048, 0.045, 0.036][i];
									return (
										<group key={i} position={[x, -0.095, 0.004]} rotation={[-curl * 1.1, 0, 0]}>
											<mesh geometry={taper(0.0085, 0.0078, len * 0.55, 8)} material={skin} />
											<group position={[0, -len * 0.58, 0]} rotation={[-curl * 1.3, 0, 0]}>
												<mesh geometry={taper(0.0078, 0.007, len * 0.45, 8)} material={skin} />
											</group>
										</group>
									);
								})}
								<group position={[side * 0.034, -0.035, 0.016]} rotation={[-0.5 - curl * 0.4, 0, side * (0.7 - curl * 0.3)]}>
									<mesh geometry={taper(0.011, 0.009, 0.04, 8)} material={skin} />
								</group>
							</>
						) : (
							<mesh geometry={rbox(0.068, 0.05, 0.026, 0.012)} material={skin} position={[0, -0.115, 0.004]} rotation={[-curl * 0.8, 0, 0]} />
						)}
						{holding ? <group position={[0, -0.09, 0.03]}>{holding}</group> : null}
					</group>
					</group>
				</group>
			</group>
		</group>
	);
};

const Leg: React.FC<{side: 1 | -1; pose: Pose; look: Look}> = ({side, pose, look}) => {
	const hip = side === 1 ? pose.lHip : pose.rHip;
	const knee = side === 1 ? pose.lKnee : pose.rKnee;
	const ankle = side === 1 ? pose.lAnkle : pose.rAnkle;
	const pants = mat(look.skirt ? look.top : look.pants, {rough: 0.92});
	const shoe = mat(look.shoe, {rough: 0.6});
	const sole = mat(look.sole, {rough: 0.7});
	const lace = mat('#f4f1ea', {rough: 0.8});
	const w = look.build;
	return (
		<group position={[side * 0.095 * w, -0.055, 0]} rotation={R(hip)}>
			<mesh geometry={taper(0.095 * w, 0.068 * w, 0.44)} material={pants} castShadow />
			<group position={[0, -0.44, 0]} rotation={[knee, 0, 0]}>
				<mesh geometry={taper(0.068 * w, 0.055 * w, 0.4)} material={pants} castShadow />
				{/* hem */}
				<mesh geometry={cyl(0.056 * w, 0.06 * w, 0.06, 20)} material={pants} position={[0, -0.39, 0]} />
				<group position={[0, -0.43, 0]} rotation={[ankle, 0, 0]}>
					{/* shoe upper */}
					<mesh geometry={rbox(0.1, 0.085, 0.25, 0.04)} material={shoe} position={[0, -0.035, 0.045]} castShadow />
					<mesh geometry={sphere(0.05)} material={shoe} position={[0, -0.03, 0.14]} scale={[1, 0.75, 0.9]} />
					{/* sole */}
					<mesh geometry={rbox(0.108, 0.028, 0.27, 0.012)} material={sole} position={[0, -0.073, 0.045]} castShadow />
					{look.detail && look.hood ? (
						<>
							{[0, 1, 2].map((i) => (
								<mesh key={i} geometry={rbox(0.06, 0.006, 0.01, 0.002)} material={lace} position={[0, 0.006 - i * 0.012, 0.075 + i * 0.022]} rotation={[0.6, 0, 0]} />
							))}
							<mesh geometry={rbox(0.07, 0.012, 0.004, 0.002)} material={mat('#8a8f98', {rough: 0.6})} position={[side * 0.051, -0.03, 0.03]} rotation={[0, Math.PI / 2, 0]} />
						</>
					) : null}
				</group>
			</group>
		</group>
	);
};

const Head: React.FC<{pose: Pose; look: Look}> = ({pose, look}) => {
	const f = pose.face;
	const skin = mat(look.skin, {rough: 0.55});
	const skinShade = mat(shade(look.skin, 0.9), {rough: 0.6});
	const hair = mat(look.hair, {rough: 0.55});
	const white = mat('#eee8e0', {rough: 0.3});
	const iris = mat('#3a2418', {rough: 0.25});
	const pupil = mat('#0b0706', {rough: 0.2});
	const lips = mat(mixHex(look.skin, '#8c4038', 0.35), {rough: 0.45});
	const brow = mat(look.hairStyle === 'father' ? '#8d877f' : look.hairStyle === 'mother' ? '#6d665f' : '#1a1512', {rough: 0.8});
	const lookX = f.lookX * 0.35;
	const lookY = f.lookY * 0.25;
	const close = Math.min(1, Math.max(f.blink, f.lid * 0.55));
	return (
		<group>
			{/* skull & face */}
			<mesh geometry={headGeo()} material={skin} position={[0, 0.11, 0]} castShadow />
			{/* ears */}
			{[1, -1].map((s) => (
				<mesh key={s} geometry={sphere(0.022)} material={skinShade} position={[s * 0.084, 0.112, -0.008]} scale={[0.5, 1.2, 0.8]} rotation={[0, s * 0.3, 0]} />
			))}
			{look.detail ? (
				<>
					{/* nose */}
					<mesh geometry={sphere(0.011)} material={skin} position={[0, 0.098, 0.092]} scale={[0.8, 2.0, 1.0]} rotation={[-0.3, 0, 0]} />
					<mesh geometry={sphere(0.0115)} material={skin} position={[0, 0.081, 0.099]} scale={[1.0, 0.85, 0.95]} />
					{[1, -1].map((s) => (
						<mesh key={s} geometry={sphere(0.0062)} material={skin} position={[s * 0.0098, 0.0785, 0.091]} />
					))}
					{/* eyes */}
					{[1, -1].map((s) => (
						<group key={s} position={[s * 0.032, 0.122, 0.077]}>
							<mesh geometry={sphere(0.0155)} material={white} />
							<group rotation={[-lookY, lookX, 0]}>
								<mesh geometry={sphere(0.0085)} material={iris} position={[0, 0, 0.0118]} scale={[1, 1, 0.45]} />
								<mesh geometry={sphere(0.0045)} material={pupil} position={[0, 0, 0.0138]} scale={[1, 1, 0.45]} />
								<mesh geometry={sphere(0.0014)} material={mat('#ffffff', {emissive: '#ffffff', ei: 0.5})} position={[0.003, 0.003, 0.0158]} />
							</group>
							{/* upper lid */}
							<mesh geometry={partSphere(0.0168, 0, Math.PI / 2)} material={skin} rotation={[-0.85 + close * 1.25, 0, 0]} />
							<mesh geometry={torus(0.0158, 0.0016, Math.PI, 6, 16)} material={mat('#1c1311', {rough: 0.7})} rotation={[-0.85 + close * 1.25 + Math.PI / 2, 0, 0]} />
							{/* lower lid */}
							<mesh geometry={partSphere(0.0164, Math.PI / 2 + 0.75, Math.PI / 2 - 0.75)} material={skin} rotation={[-0.2, 0, 0]} />
							{/* brow */}
							<group position={[s * 0.002, 0.026 - f.frown * 0.005 + f.sad * 0.002, 0.012]} rotation={[0, 0, s * (-0.08 + f.sad * 0.3 - f.frown * 0.22)]}>
								<mesh geometry={taper(0.006, 0.0042, 0.034, 8)} material={brow} rotation={[0.25, 0, s * Math.PI / 2]} position={[s * -0.017, 0, 0]} scale={[1, 1, 0.6]} />
							</group>
						</group>
					))}
					{/* mouth */}
					<group position={[0, 0.049, 0.0875]}>
						{[1, -1].map((m) => (
							<group key={m} rotation={[0, m * 0.25, m * f.smile * 0.28]}>
								<mesh geometry={taper(0.0032, 0.0022, 0.016, 8)} material={lips} rotation={[0, 0, m * Math.PI / 2]} position={[0, 0.001 + f.mouth * 0.004, 0]} />
								<mesh geometry={taper(0.0042, 0.0024, 0.014, 8)} material={lips} rotation={[0, 0, m * Math.PI / 2]} position={[0, -0.0045 - f.mouth * 0.004, -0.001]} />
							</group>
						))}
						<mesh geometry={sphere(0.009)} material={mat('#3a1d1a', {rough: 0.6})} scale={[1.3, f.mouth * 0.6 + 0.05, 0.4]} position={[0, -0.0015, -0.001]} />
					</group>
				</>
			) : (
				<mesh geometry={sphere(0.015)} material={skin} position={[0, 0.085, 0.1]} scale={[0.9, 1.3, 1]} />
			)}
			{look.glasses ? (
				<group position={[0, 0.122, 0.095]}>
					{[1, -1].map((s) => (
						<mesh key={s} geometry={torus(0.019, 0.0022, Math.PI * 2, 6, 20)} material={mat('#2a2522', {rough: 0.4, metal: 0.3})} position={[s * 0.032, 0, 0]} />
					))}
					<mesh geometry={cyl(0.0018, 0.0018, 0.03, 6)} material={mat('#2a2522', {rough: 0.4})} rotation={[0, 0, Math.PI / 2]} position={[0, 0.004, 0]} />
				</group>
			) : null}
			<Hair look={look} hair={hair} />
		</group>
	);
};

const Hair: React.FC<{look: Look; hair: THREE.Material}> = ({look, hair}) => {
	if (look.hairStyle === 'hero') {
		return (
			<group>
				{/* cap covering top and back */}
				<mesh geometry={partSphere(0.104, 0, 1.75)} material={hair} position={[0, 0.125, -0.006]} rotation={[-0.42, 0, 0]} scale={[0.95, 1.08, 1.04]} castShadow />
				{/* back of head down to nape */}
				<mesh geometry={sphere(0.093)} material={hair} position={[0, 0.098, -0.028]} scale={[0.96, 1.0, 0.92]} />
				{/* fringe / textured quiff */}
				<mesh geometry={sphere(0.06)} material={hair} position={[0.018, 0.205, 0.045]} scale={[1.25, 0.55, 0.95]} rotation={[0.3, 0, -0.2]} castShadow />
				<mesh geometry={sphere(0.045)} material={hair} position={[-0.035, 0.195, 0.06]} scale={[1.1, 0.5, 0.9]} rotation={[0.4, 0, 0.35]} />
				<mesh geometry={sphere(0.04)} material={hair} position={[0.045, 0.185, 0.068]} scale={[0.9, 0.45, 0.8]} rotation={[0.5, 0, -0.5]} />
				<mesh geometry={sphere(0.05)} material={hair} position={[0, 0.215, -0.01]} scale={[1.4, 0.5, 1.3]} />
				{/* sideburns */}
				{[1, -1].map((s) => (
					<mesh key={s} geometry={rbox(0.012, 0.05, 0.03, 0.005)} material={hair} position={[s * 0.085, 0.112, 0.012]} rotation={[0, 0, -s * 0.08]} />
				))}
			</group>
		);
	}
	if (look.hairStyle === 'father') {
		return (
			<group>
				<mesh geometry={partSphere(0.104, 0.55, 1.2)} material={hair} position={[0, 0.12, -0.008]} rotation={[-0.25, 0, 0]} scale={[0.95, 1.06, 1.02]} />
				<mesh geometry={partSphere(0.1, 0, 0.6)} material={hair} position={[0, 0.125, -0.02]} rotation={[-0.6, 0, 0]} scale={[0.92, 1.05, 1]} />
				<mesh geometry={sphere(0.09)} material={hair} position={[0, 0.095, -0.03]} scale={[0.98, 0.95, 0.9]} />
			</group>
		);
	}
	if (look.hairStyle === 'mother') {
		return (
			<group>
				<mesh geometry={partSphere(0.106, 0, 1.85)} material={hair} position={[0, 0.123, -0.006]} rotation={[-0.32, 0, 0]} scale={[0.96, 1.08, 1.05]} />
				<mesh geometry={sphere(0.095)} material={hair} position={[0, 0.1, -0.03]} scale={[1.0, 1.02, 0.94]} />
				{/* bun */}
				<mesh geometry={sphere(0.05)} material={hair} position={[0, 0.13, -0.12]} scale={[1.1, 1, 0.9]} />
			</group>
		);
	}
	if (look.hairStyle === 'long') {
		return (
			<group>
				<mesh geometry={partSphere(0.107, 0, 1.8)} material={hair} position={[0, 0.123, -0.006]} rotation={[-0.35, 0, 0]} scale={[0.97, 1.08, 1.05]} />
				<mesh geometry={rbox(0.2, 0.22, 0.09, 0.04)} material={hair} position={[0, 0.03, -0.055]} />
			</group>
		);
	}
	return (
		<group>
			<mesh geometry={partSphere(0.105, 0, 1.7)} material={hair} position={[0, 0.124, -0.006]} rotation={[-0.4, 0, 0]} scale={[0.95, 1.08, 1.04]} />
			<mesh geometry={sphere(0.092)} material={hair} position={[0, 0.1, -0.028]} scale={[0.96, 1, 0.92]} />
		</group>
	);
};

const mixHex = (a: string, b: string, t: number) => `#${new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString()}`;

const shade = (hex: string, k: number) => {
	const c = new THREE.Color(hex);
	c.multiplyScalar(k);
	return `#${c.getHexString()}`;
};

export const Character: React.FC<{
	pose: Pose;
	look?: Look;
	position?: [number, number, number];
	rotationY?: number;
	leftHand?: React.ReactNode;
	rightHand?: React.ReactNode;
	lTarget?: [number, number, number] | null;
	rTarget?: [number, number, number] | null;
	lPole?: [number, number, number];
	rPole?: [number, number, number];
	back?: React.ReactNode;
	lPalm?: [number, number, number] | null;
	rPalm?: [number, number, number] | null;
}> = ({pose, look = HERO, position = [0, 0, 0], rotationY = 0, leftHand, rightHand, lTarget = null, rTarget = null, lPole, rPole, back, lPalm = null, rPalm = null}) => {
	const root = {position, rotationY, scale: look.height};
	const fwd: V3 = [Math.sin(rotationY), 0, Math.cos(rotationY)];
	const left: V3 = [Math.cos(rotationY), 0, -Math.sin(rotationY)];
	const defPole = (sd: number): V3 => [position[0] + left[0] * 0.8 * sd - fwd[0] * 0.6, position[1] + 0.5, position[2] + left[2] * 0.8 * sd - fwd[2] * 0.6];
	const lIK = lTarget ? solveArm(pose, root, 1, look.build, lTarget, lPole ?? defPole(1), lPalm) : null;
	const rIK = rTarget ? solveArm(pose, root, -1, look.build, rTarget, rPole ?? defPole(-1), rPalm) : null;
	const top = mat(look.top, {rough: 0.95});
	const topDark = mat(look.topDark, {rough: 0.95});
	const pants = mat(look.pants, {rough: 0.92});
	const skin = mat(look.skin, {rough: 0.55});
	const w = look.build;
	const b = 1 + pose.breath * 0.025;
	return (
		<group position={position} rotation={[0, rotationY, 0]} scale={look.height}>
			<group position={[0, 0.98 + pose.hipsY, pose.hipsZ]} rotation={R(pose.hips)}>
				{/* pelvis */}
				<mesh
					geometry={loft('pelvis', [
						[-0.13, 0.001, 0.001],
						[-0.125, 0.11, 0.07],
						[-0.1, 0.15, 0.095],
						[-0.04, 0.168, 0.108],
						[0.03, 0.162, 0.106],
						[0.1, 0.152, 0.1],
						[0.101, 0.001, 0.001],
					])}
					material={look.skirt ? top : pants}
					scale={[w, 1, 1]}
					castShadow
				/>
				{look.skirt ? <Skirt pose={pose} look={look} /> : null}
				<Leg side={1} pose={pose} look={look} />
				<Leg side={-1} pose={pose} look={look} />
				{/* spine */}
				<group position={[0, 0.09, 0]} rotation={R(pose.spine)}>
					<mesh
						geometry={loft('abdomen', [
							[-0.175, 0.001, 0.001],
							[-0.172, 0.15, 0.1, 2.4],
							[-0.15, 0.164, 0.112, 2.4],
							[-0.1, 0.165, 0.113, 2.4],
							[-0.02, 0.16, 0.11, 2.4],
							[0.06, 0.158, 0.11, 2.4],
							[0.16, 0.168, 0.116, 2.4],
							[0.26, 0.178, 0.12, 2.5],
						])}
						material={top}
						scale={[w, 1, 1]}
						castShadow
						receiveShadow
					/>
					{/* hem band */}
					<mesh geometry={loft('hem', [[-0.02, 0.158, 0.108, 2.4], [0.0, 0.166, 0.115, 2.4], [0.025, 0.166, 0.115, 2.4], [0.04, 0.16, 0.11, 2.4]])} material={topDark} position={[0, -0.19, 0]} scale={[w, 1, 1]} />
					{look.hood ? (
						// kangaroo pocket
						<mesh geometry={rbox(0.22, 0.12, 0.02, 0.009)} material={topDark} position={[0, -0.08, 0.106]} rotation={[0.04, 0, 0]} />
					) : null}
					<group position={[0, 0.22, 0]} rotation={R(pose.chest)} scale={[b, 1, b]}>
						<mesh
							geometry={loft('chest', [
								[-0.069, 0.164, 0.112, 2.5],
								[-0.04, 0.17, 0.116, 2.5],
								[0.04, 0.178, 0.12, 2.5],
								[0.1, 0.188, 0.117, 2.7],
								[0.14, 0.19, 0.11, 3.0],
								[0.165, 0.18, 0.097, 3.0],
								[0.185, 0.14, 0.082, 2.6],
								[0.198, 0.08, 0.062, 2.2],
								[0.205, 0.05, 0.05, 2],
								[0.206, 0.001, 0.001],
							])}
							material={top}
							scale={[w, 1, 1]}
							castShadow
							receiveShadow
						/>
						{look.hood ? (
							<>
								{/* bunched hood behind neck */}
								<group position={[0, 0.196, -0.01]} rotation={[Math.PI / 2 + 0.4, 0, 0]} scale={[1.25, 1.15, 1]}>
									<mesh geometry={torus(0.066, 0.026, Math.PI * 1.3, 12, 28)} material={top} rotation={[0, 0, Math.PI * 1.5 - Math.PI * 0.65]} castShadow />
									{[0.85, 2.15].map((a) => (
										<mesh key={a} geometry={sphere(0.026)} material={top} position={[0.066 * Math.cos(a * Math.PI), 0.066 * Math.sin(a * Math.PI), 0]} />
									))}
								</group>
								<mesh geometry={sphere(0.1)} material={top} position={[0, 0.16, -0.075]} scale={[1.0, 0.75, 0.42]} castShadow />
								{/* drawstrings */}
								{[1, -1].map((s) => (
									<group key={s} position={[s * 0.034, 0.175, 0.095]} rotation={[0.12, 0, s * 0.04]}>
										<mesh geometry={cyl(0.0035, 0.0035, 0.17, 6)} material={mat('#d9d6cf', {rough: 0.8})} position={[0, -0.085, 0]} />
										<mesh geometry={cyl(0.0048, 0.0048, 0.02, 6)} material={mat('#bdbab3', {rough: 0.5})} position={[0, -0.175, 0]} />
									</group>
								))}
							</>
						) : (
							// collar
							<mesh geometry={torus(0.06, 0.016, Math.PI * 2, 8, 24)} material={topDark} position={[0, 0.175, 0.0]} rotation={[Math.PI / 2 - 0.2, 0, 0]} />
						)}
						{back ? <group position={[0, 0.02, -0.2]}>{back}</group> : null}
						<Arm side={1} pose={pose} look={look} holding={leftHand} ik={lIK} />
						<Arm side={-1} pose={pose} look={look} holding={rightHand} ik={rIK} />
						{/* neck */}
						<group position={[0, 0.17, 0.005]} rotation={R(pose.neck)}>
							<mesh geometry={cyl(0.041, 0.047, 0.1, 18)} material={skin} position={[0, 0.04, 0]} />
							<group position={[0, 0.072, 0.012]} rotation={R(pose.head)}>
								<Head pose={pose} look={look} />
							</group>
						</group>
					</group>
				</group>
			</group>
		</group>
	);
};

const Skirt: React.FC<{pose: Pose; look: Look}> = ({pose, look}) => {
	// Long skirt that follows average of leg swing.
	const swing = (pose.lHip[0] + pose.rHip[0]) / 2;
	const spread = Math.abs(pose.lHip[0] - pose.rHip[0]);
	const sit = Math.min(1, Math.max(0, -swing / 1.4));
	return (
		<group rotation={[swing * (1 - sit) * 0.6, 0, 0]}>
			<mesh
				geometry={lathe('skirt', [
					[0.001, 0.02],
					[0.16, 0.0],
					[0.18, -0.2],
					[0.2, -0.45],
					[0.22, -0.72],
					[0.001, -0.73],
				])}
				material={mat(look.pants, {rough: 0.92})}
				scale={[1 + spread * 0.25, 1 - sit * 0.45, 0.8 + spread * 0.4 + sit * 1.2]}
				position={[0, 0, sit * 0.18]}
				castShadow
			/>
		</group>
	);
};
