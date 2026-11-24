import {ThreeCanvas} from '@remotion/three';
import React from 'react';
import {Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {
	basePose,
	breathe,
	Character,
	mixPose,
	type Pose,
	walkPose,
	WOMAN,
	withPose,
} from './Character';
import {photoTexture} from './textures';
import {
	Banknote,
	Bill,
	CameraRig,
	Coin,
	Glow,
	handheld,
	Phone,
	Rain,
	Ripples,
	Room,
	SceneSetup,
	Street,
	Wallet,
	Warung,
	type Vec3,
} from './World';

const ease = Easing.bezier(0.45, 0, 0.25, 1);

/** Interpolate with clamping and cinematic easing. */
const k = (f: number, input: number[], output: number[]) =>
	interpolate(f, input, output, {
		easing: ease,
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

const lerp3 = (f: number, input: number[], outputs: Vec3[]): Vec3 => [
	k(
		f,
		input,
		outputs.map((o) => o[0]),
	),
	k(
		f,
		input,
		outputs.map((o) => o[1]),
	),
	k(
		f,
		input,
		outputs.map((o) => o[2]),
	),
];

const add3 = (a: Vec3, b: Vec3): Vec3 => [
	a[0] + b[0],
	a[1] + b[1],
	a[2] + b[2],
];

export const Shot: React.FC<{readonly children: React.ReactNode}> = ({
	children,
}) => {
	const {width, height} = useVideoConfig();
	return (
		<ThreeCanvas
			width={width}
			height={height}
			shadows
			gl={{
				antialias: true,
				preserveDrawingBuffer: true,
				powerPreference: 'high-performance',
			}}
			camera={{fov: 40, position: [0, 1.5, 3], near: 0.02, far: 200}}
		>
			{children}
		</ThreeCanvas>
	);
};

// ------------------------------------------------------------ shared poses

/** Sitting on a chair (seat ~0.47m), holding a phone in the right hand. */
const sittingPhone = (frame: number, extra: Partial<Pose> = {}): Pose =>
	breathe(
		withPose({
			hipsY: 0.53,
			hipsX: 0,
			spineX: 0.25,
			chestX: 0.08,
			neckX: 0.05,
			headX: 0.18,
			lHipX: -1.5,
			rHipX: -1.5,
			lHipZ: 0.1,
			rHipZ: 0.08,
			lKnee: 1.45,
			rKnee: 1.55,
			lAnkle: 0.05,
			rAnkle: 0.0,
			// right arm brings the phone in front of the chest
			rShoulderX: -1.0,
			rShoulderZ: -0.1,
			rShoulderY: 0.6,
			rElbow: -1.5,
			rWristX: 0,
			rWristZ: 0,
			// left forearm resting on the left thigh
			lShoulderX: -0.85,
			lShoulderZ: -0.05,
			lShoulderY: 0.35,
			lElbow: -0.75,
			lWristX: 0.2,
			sad: 0.85,
			smile: -0.35,
			lookY: 1,
			fingerCurl: 0.75,
			...extra,
		}),
		frame,
	);

const phoneInHand = (screen: 'photo' | 'chat', light = 0.7) => (
	<group position={[0, -0.085, 0.024]} rotation={[0.3, 0, 0]}>
		<Phone screen={screen} light={light} />
	</group>
);

// ------------------------------------------------------------ SCENE 1 HOOK

export const Scene1: React.FC = () => {
	const f = useCurrentFrame();
	const pose = sittingPhone(f, {
		x: 0.15,
		z: 0.35,
		rotY: 0,
		headX: k(f, [0, 120, 240], [0.22, 0.14, 0.18]),
		headY: k(f, [0, 240], [0.05, -0.04]),
	});
	const cam = add3(
		lerp3(
			f,
			[0, 255],
			[
				[-0.9, 1.45, 3.2],
				[0.02, 1.08, 1.5],
			],
		),
		handheld(f, 0.006),
	);
	const target = lerp3(
		f,
		[0, 255],
		[
			[0.1, 0.95, 0.2],
			[0.15, 1.12, 0.6],
		],
	);
	return (
		<Shot>
			<SceneSetup bg="#06070b" fog={['#0a0d16', 0.08]} exposure={1.05} />
			<CameraRig
				position={cam}
				target={target}
				fov={k(f, [0, 255], [44, 30])}
				fill={{intensity: 0.5, color: '#8fa6d9'}}
			/>
			<Room morning={false} lampOn chair={{x: 0.15, z: 0.25, rotY: Math.PI}} />
			<Character pose={pose} rightHandItem={phoneInHand('photo', 1.1)} />
			<Rain
				center={[0, 0, -4.5]}
				size={[6, 6, 3]}
				count={1200}
				opacity={0.35}
			/>
		</Shot>
	);
};

// ------------------------------------------------------------ SCENE 2 WALK HOME IN RAIN

const S2_SPEED = 0.95; // m/s
const S2_STRIDE = 1.25; // metres per full cycle
export const scene2Phase = (f: number) =>
	((f / 30) * S2_SPEED * Math.PI * 2) / S2_STRIDE;

export const Scene2: React.FC = () => {
	const f = useCurrentFrame();
	const dist = (f / 30) * S2_SPEED;
	const z = -9 + dist;
	const pose = walkPose(scene2Phase(f), 1, {});
	pose.x = 2.35;
	pose.y = 0.16;
	pose.z = z;
	pose.sad = 0.8;
	pose.smile = -0.4;
	pose.blink = Math.max(pose.blink, breathe(basePose(), f).blink);
	pose.lookY = 0.8;
	const camOffset = lerp3(
		f,
		[0, 130, 250],
		[
			[-0.9, 0.55, 3.2],
			[-1.5, 0.75, 2.3],
			[-1.75, 1.35, 1.2],
		],
	);
	const cam = add3(add3([2.35, 0.16, z], camOffset), handheld(f, 0.015));
	const target: Vec3 = [2.35, 1.15 + k(f, [0, 250], [-0.05, 0.25]), z - 0.2];
	return (
		<Shot>
			<SceneSetup bg="#05070c" fog={['#0d1424', 0.055]} exposure={1.35} />
			<CameraRig
				position={cam}
				target={target}
				fov={k(f, [0, 250], [38, 30])}
				fill={{intensity: 1.6, color: '#9db5ff', distance: 7}}
			/>
			<Street
				lamps={[
					[4.0, 0.16, -5],
					[4.0, 0.16, 3],
					[4.0, 0.16, -13],
					[4.0, 0.16, -21],
					[-5.2, 0, -9],
					[-5.2, 0, -1],
				]}
				shadowLamp={0}
			/>
			<Character pose={pose} />
			<Rain
				center={[cam[0], 0, cam[2] - 4]}
				size={[9, 7, 9]}
				count={5000}
				opacity={0.5}
			/>
			<Ripples area={[-1, 4, z - 6, z + 4]} count={90} />
		</Shot>
	);
};

// ------------------------------------------------------------ SCENE 3 WARUNG

export const Scene3: React.FC = () => {
	const f = useCurrentFrame();
	const sit = (x: number, rotY: number): Pose =>
		withPose({
			x,
			z: -0.6,
			rotY,
			hipsY: 0.53,
			spineX: 0.12,
			lHipX: -1.5,
			rHipX: -1.5,
			lKnee: 1.5,
			rKnee: 1.5,
			lShoulderX: -0.6,
			rShoulderX: -0.6,
			lElbow: -0.9,
			rElbow: -0.9,
			lShoulderZ: -0.02,
			rShoulderZ: -0.02,
			fingerCurl: 0.5,
		});
	// he glances at her (~2s), forces a smile, then looks down again
	const glance = k(f, [40, 60, 95, 120], [0, 1, 1, 0]);
	const man = breathe(
		{
			...sit(0.33, -0.12),
			headX: 0.42 - glance * 0.3,
			headY: -0.05 + glance * 0.45,
			neckX: 0.1,
			sad: 0.9 - glance * 0.2,
			smile: -0.35 + glance * 0.35,
			lookY: 1 - glance * 1.2,
			lookX: glance * -1,
		},
		f,
	);
	const laugh = Math.sin(f / 6) * 0.03 * k(f, [0, 30, 90, 110], [1, 1, 0.3, 0]);
	const woman = breathe(
		{
			...sit(-0.36, 0.45),
			spineX: 0.08 + laugh,
			headX: -0.05 + laugh,
			headY: 0.3,
			headZ: 0.08,
			sad: k(f, [130, 200], [0, 0.35]),
			smile: k(f, [130, 200], [0.9, 0.45]),
			lookX: 1,
			lShoulderX: -0.85,
			lElbow: -1.1,
		},
		f + 40,
	);
	const cam = add3(
		lerp3(
			f,
			[0, 215],
			[
				[-1.05, 1.32, 1.9],
				[0.75, 1.2, 1.25],
			],
		),
		handheld(f, 0.006),
	);
	const target = lerp3(
		f,
		[0, 215],
		[
			[-0.05, 1.05, -0.5],
			[0.25, 1.12, -0.55],
		],
	);
	return (
		<Shot>
			<SceneSetup bg="#06070c" fog={['#0c111c', 0.06]} exposure={1.1} />
			<CameraRig
				position={cam}
				target={target}
				fov={k(f, [0, 215], [40, 30])}
				fill={{intensity: 0.7, color: '#ffc995'}}
			/>
			<Warung />
			<Character pose={man} />
			<Character pose={woman} look={WOMAN} />
			<Rain
				center={[0, 0, 2.2]}
				size={[8, 5, 2.5]}
				count={2200}
				opacity={0.4}
			/>
			<Rain center={[0, 0, -4]} size={[10, 5, 5]} count={1500} opacity={0.3} />
		</Shot>
	);
};

// ------------------------------------------------------------ SCENE 4 COUNTING MONEY

const NOTE_PERIOD = 34;
const notesInLeftHand = [
	['10.000', '#7b4fa3'],
	['5.000', '#8c6239'],
	['2.000', '#7d8a91'],
	['10.000', '#7b4fa3'],
	['2.000', '#7d8a91'],
	['5.000', '#8c6239'],
	['20.000', '#3e8e5a'],
] as const;

export const Scene4: React.FC = () => {
	const f = useCurrentFrame();
	const counted = Math.min(notesInLeftHand.length, Math.floor(f / NOTE_PERIOD));
	const cyc = (f % NOTE_PERIOD) / NOTE_PERIOD;
	const counting = f < NOTE_PERIOD * notesInLeftHand.length;
	// right hand: reach to the left hand (0..0.4), carry to the pile (0.4..0.8), return
	const reach = counting
		? cyc < 0.4
			? k(cyc, [0, 0.4], [1, 0])
			: cyc < 0.8
				? k(cyc, [0.4, 0.8], [0, 1])
				: 1
		: 1;
	const despair = k(f, [175, 230], [0, 1]);
	const base = withPose({
		x: 0.85,
		rotY: Math.PI,
		z: 0.02,
		hipsY: 0.53,
		spineX: 0.22,
		chestX: 0.05,
		neckX: 0.1,
		headX: 0.38,
		lHipX: -1.5,
		rHipX: -1.5,
		lKnee: 1.5,
		rKnee: 1.5,
		// left hand holds the notes above the desk
		lShoulderX: -0.85,
		lShoulderZ: -0.05,
		lShoulderY: 0.55,
		lElbow: -1.05,
		lWristX: 0.1,
		lWristZ: 0.2,
		rShoulderX: -0.8,
		rShoulderZ: -0.1 + reach * 0.25,
		rShoulderY: 0.5 - reach * 0.35,
		rElbow: -1.0 - reach * 0.1,
		rWristX: -0.15,
		sad: 0.9,
		smile: -0.45,
		lookY: 1,
		fingerCurl: 0.45,
	});
	// later: hand to forehead
	const forehead = withPose({
		...base,
		spineX: 0.3,
		headX: 0.45,
		lShoulderX: -1.45,
		lShoulderZ: -0.3,
		lShoulderY: -0.3,
		lElbow: -2.1,
		lWristX: 0.2,
		lWristZ: 0,
		rShoulderX: -0.75,
		rShoulderZ: 0.05,
		rElbow: -0.85,
		sad: 1,
		blink: 0.55,
	});
	const pose = breathe(mixPose(base, forehead, despair), f, 1.4);
	const carrying = counting && cyc > 0.32 && cyc < 0.8;
	const leftStack = notesInLeftHand.length - counted - (carrying ? 1 : 0);
	const deskY = 0.762;
	const cam = add3(
		lerp3(
			f,
			[0, 150, 215, 330],
			[
				[0.62, 1.22, -1.18],
				[0.72, 1.17, -1.12],
				[0.5, 1.02, -1.05],
				[0.6, 1.07, -0.86],
			],
		),
		handheld(f, 0.004),
	);
	const target = lerp3(
		f,
		[0, 150, 215, 330],
		[
			[0.83, 0.84, -0.45],
			[0.8, 0.83, -0.45],
			[0.85, 1.15, -0.25],
			[0.85, 1.18, -0.2],
		],
	);
	return (
		<Shot>
			<SceneSetup bg="#06070b" fog={['#0a0d16', 0.06]} exposure={1.1} />
			<CameraRig
				position={cam}
				target={target}
				fov={k(f, [0, 150, 215, 330], [36, 31, 38, 32])}
				fill={{intensity: 0.45, color: '#ffc58f'}}
			/>
			<Room morning={false} lampOn chair={{x: 0.85, z: -0.05, rotY: 0}} />
			<Character
				pose={pose}
				leftHandItem={
					despair < 0.3 ? (
						<group position={[0.0, -0.09, 0.03]} rotation={[0.2, 0, 0]}>
							{new Array(Math.max(0, leftStack)).fill(0).map((_, i) => {
								const [v, c] = notesInLeftHand[notesInLeftHand.length - 1 - i];
								return (
									<group key={i} rotation={[0, 0, -0.5 + i * 0.12]}>
										<Banknote
											value={v}
											color={c}
											position={[0.0, -0.03 - i * 0.001, 0.004 * i]}
											rotation={[Math.PI / 2, 0, Math.PI / 2]}
										/>
									</group>
								);
							})}
						</group>
					) : null
				}
				rightHandItem={
					carrying ? (
						<group position={[0, -0.1, 0.02]}>
							<Banknote
								value={notesInLeftHand[counted][0]}
								color={notesInLeftHand[counted][1]}
								position={[0, -0.02, 0]}
								rotation={[Math.PI / 2, 0, Math.PI / 2]}
								bend={0.02}
							/>
						</group>
					) : null
				}
			/>
			{/* the counted pile on the desk */}
			{new Array(counted).fill(0).map((_, i) => (
				<Banknote
					key={i}
					value={notesInLeftHand[i][0]}
					color={notesInLeftHand[i][1]}
					position={[
						0.72 + Math.sin(i * 2.1) * 0.01,
						deskY + 0.002 + i * 0.0012,
						-0.48 + Math.cos(i * 1.3) * 0.01,
					]}
					rotation={[0, 0, 0.3 + Math.sin(i * 3.7) * 0.15]}
				/>
			))}
			<Bill
				title="TAGIHAN LISTRIK"
				amount="Rp 356.000"
				position={[1.12, deskY + 0.001, -0.55]}
				rot={-0.35}
			/>
			<Bill
				title="SEWA KONTRAKAN"
				amount="Rp 850.000"
				position={[1.0, deskY + 0.003, -0.72]}
				rot={0.2}
			/>
			<Bill
				title="CICILAN MOTOR"
				amount="Rp 712.000"
				position={[0.5, deskY + 0.002, -0.72]}
				rot={0.45}
			/>
			<Wallet position={[0.98, deskY + 0.008, -0.42]} rot={0.6} />
			<Coin position={[0.62, deskY + 0.002, -0.4]} />
			<Coin position={[0.64, deskY + 0.002, -0.43]} />
			<Coin position={[0.6, deskY + 0.004, -0.44]} />
			<Rain center={[0, 0, -4.5]} size={[6, 6, 3]} count={1000} opacity={0.3} />
		</Shot>
	);
};

// ------------------------------------------------------------ SCENE 5 RAIN + MESSAGE

export const Scene5: React.FC = () => {
	const f = useCurrentFrame();
	const pose = breathe(
		withPose({
			x: 2.4,
			y: 0.16,
			z: -3.2,
			rotY: 0.25,
			spineX: 0.1,
			neckX: 0.15,
			headX: 0.42,
			rShoulderX: -0.45,
			rShoulderZ: -0.1,
			rShoulderY: 0.6,
			rElbow: -1.75,
			rWristX: 0,
			rWristZ: 0,
			lShoulderZ: 0.08,
			lElbow: -0.2,
			sad: k(f, [0, 90, 170], [0.8, 1, 1]),
			smile: -0.5,
			lookY: 1,
			fingerCurl: 0.75,
			lHipZ: 0.05,
			rHipZ: 0.05,
		}),
		f,
		1.2,
	);
	// slow move from over-the-shoulder on the phone to the face
	const cam = add3(
		lerp3(
			f,
			[0, 70, 175],
			[
				[1.55, 1.85, -3.6],
				[1.7, 1.8, -3.45],
				[3.35, 1.6, -1.25],
			],
		),
		handheld(f, 0.008),
	);
	const target = lerp3(
		f,
		[0, 70, 175],
		[
			[2.5, 1.2, -2.9],
			[2.5, 1.25, -2.95],
			[2.45, 1.55, -3.15],
		],
	);
	return (
		<Shot>
			<SceneSetup bg="#05070c" fog={['#0d1424', 0.06]} exposure={1.35} />
			<CameraRig
				position={cam}
				target={target}
				fov={k(f, [0, 175], [36, 30])}
				fill={{intensity: 1.2, color: '#9db5ff'}}
			/>
			<Street
				lamps={[
					[4.0, 0.16, -2.5],
					[4.0, 0.16, -14],
					[-5.2, 0, -8],
					[-5.2, 0, -20],
				]}
				shadowLamp={0}
			/>
			<Character pose={pose} rightHandItem={phoneInHand('chat', 0.9)} />
			<Rain
				center={[2.4, 0, -3]}
				size={[5, 6, 5]}
				count={5000}
				opacity={0.55}
			/>
			<Ripples area={[0.5, 4, -6, 0]} count={70} />
		</Shot>
	);
};

// ------------------------------------------------------------ SCENE 6 FAREWELL

const S6_WALK_START = 118;
const S6_SPEED = 0.85;
const S6_STRIDE = 1.2;
export const scene6Phase = (f: number) => {
	const t = Math.max(0, f - S6_WALK_START) / 30;
	return (t * S6_SPEED * Math.PI * 2) / S6_STRIDE;
};

export const Scene6: React.FC = () => {
	const f = useCurrentFrame();
	const manZ0 = -6.2;
	const bow = k(f, [30, 70], [0, 1]);
	const turn = k(f, [85, S6_WALK_START], [0, 1]);
	const walking = f >= S6_WALK_START;
	const walkT = Math.max(0, f - S6_WALK_START) / 30;
	const standing = breathe(
		withPose({
			x: 2.5,
			y: 0.16,
			z: manZ0,
			rotY: turn * Math.PI,
			spineX: 0.08 + bow * 0.12,
			neckX: 0.1 + bow * 0.15,
			headX: 0.15 + bow * 0.45,
			sad: 0.95,
			smile: -0.5,
			lookY: 0.5 + bow * 0.5,
			lShoulderZ: 0.06,
			rShoulderZ: 0.06,
		}),
		f,
	);
	let man = standing;
	if (walking) {
		const w = walkPose(scene6Phase(f), 1.1);
		const blendIn = k(f, [S6_WALK_START, S6_WALK_START + 12], [0, 1]);
		man = mixPose(standing, {...w, sad: 0.95, smile: -0.5}, blendIn);
		man.x = 2.5;
		man.y = 0.16;
		man.z = manZ0 - walkT * S6_SPEED;
		man.rotY = Math.PI;
	}

	const reach = k(f, [100, 130, 160, 200], [0, 1, 1, 0]);
	const chest = k(f, [170, 230], [0, 1]);
	const sob = Math.sin(f / 4) * 0.02 * chest;
	const woman = breathe(
		withPose({
			x: 2.5,
			y: 0.16,
			z: -5.2,
			rotY: Math.PI,
			spineX: 0.05 + sob,
			headX: k(f, [0, 60, 200], [-0.05, 0.05, 0.2]) + sob,
			sad: 0.9,
			smile: -0.35,
			lookY: k(f, [0, 60], [-0.4, 0.4]),
			// reaches toward him, then the hand comes back to her chest
			rShoulderX: -0.7 * reach - 1.05 * chest,
			rShoulderZ: 0.05 - 0.2 * chest,
			rShoulderY: 0.9 * chest,
			rElbow: -0.2 - 1.8 * chest,
			lShoulderZ: 0.08,
			fingerCurl: 0.4 + chest * 0.3,
		}),
		f + 20,
	);
	const cam = add3(
		lerp3(
			f,
			[0, 95, 150, 280],
			[
				[-0.9, 1.6, -5.85],
				[-0.5, 1.55, -5.75],
				[3.05, 1.7, -3.1],
				[2.9, 1.8, -3.35],
			],
		),
		handheld(f, 0.01),
	);
	const target = lerp3(
		f,
		[0, 95, 150, 280],
		[
			[2.5, 1.2, -5.7],
			[2.5, 1.2, -5.7],
			[2.45, 1.25, -6.6],
			[2.4, 1.1, -9.5],
		],
	);
	return (
		<Shot>
			<SceneSetup bg="#05070c" fog={['#0d1424', 0.06]} exposure={1.35} />
			<CameraRig
				position={cam}
				target={target}
				fov={k(f, [0, 95, 150, 280], [34, 30, 40, 32])}
				fill={{intensity: 1.4, color: '#9db5ff', distance: 7}}
			/>
			<Street
				lamps={[
					[4.0, 0.16, -5.2],
					[4.0, 0.16, -16],
					[-5.2, 0, -10],
					[-5.2, 0, -22],
				]}
				shadowLamp={0}
			/>
			<Character pose={man} />
			<Character pose={woman} look={WOMAN} />
			<Rain
				center={[cam[0], 0, cam[2] - 4]}
				size={[8, 7, 9]}
				count={5000}
				opacity={0.5}
			/>
			<Ripples area={[0.5, 4, -12, -3]} count={90} />
		</Shot>
	);
};

// ------------------------------------------------------------ SCENE 7 STILL IN LOVE

export const Scene7: React.FC = () => {
	const f = useCurrentFrame();
	const hug = k(f, [95, 130], [0, 1]);
	const holding = sittingPhone(f, {
		x: 0.15,
		z: 0.35,
		headX: 0.34,
		sad: 0.85,
		smile: k(f, [20, 60], [-0.3, 0.12]),
	});
	const toChest = withPose({
		...holding,
		rShoulderX: -0.35,
		rShoulderZ: -0.2,
		rShoulderY: 1.0,
		rElbow: -2.0,
		rWristX: -0.2,
		headX: 0.25,
		spineX: 0.4,
		sad: 1,
		smile: -0.2,
		blink: 0.85,
	});
	const pose = mixPose(holding, toChest, hug);
	pose.blink = Math.max(pose.blink, hug * 0.85);
	const memory = k(f, [10, 45, 120, 160], [0, 1, 1, 0.6]);
	const cam = add3(
		lerp3(
			f,
			[0, 165],
			[
				[0.85, 1.35, 2.7],
				[0.42, 1.25, 1.55],
			],
		),
		handheld(f, 0.005),
	);
	const target = lerp3(
		f,
		[0, 165],
		[
			[-0.05, 1.2, 0.3],
			[0.0, 1.2, 0.4],
		],
	);
	return (
		<Shot>
			<SceneSetup bg="#06070b" fog={['#0a0d16', 0.08]} exposure={1.05} />
			<CameraRig
				position={cam}
				target={target}
				fov={k(f, [0, 165], [40, 34])}
				fill={{intensity: 0.5, color: '#8fa6d9'}}
			/>
			<Room morning={false} lampOn chair={{x: 0.15, z: 0.25, rotY: Math.PI}} />
			<Character
				pose={pose}
				rightHandItem={phoneInHand('photo', 1.1)}
				tear={k(f, [60, 150], [0, 1])}
			/>
			{/* the memory he still holds on to: a glowing photo in the dark */}
			<group
				position={[-0.32, 1.45 + Math.sin(f / 30) * 0.02, 0.15]}
				rotation={[0, 0.45, Math.sin(f / 40) * 0.03]}
			>
				<mesh>
					<planeGeometry args={[0.34, 0.6]} />
					<meshBasicMaterial
						map={photoTexture()}
						transparent
						opacity={0.85 * memory}
						toneMapped={false}
					/>
				</mesh>
				<Glow
					position={[0, 0, -0.01]}
					color="#ffb98a"
					size={1.1}
					opacity={0.5 * memory}
				/>
				<pointLight
					intensity={0.8 * memory}
					distance={2}
					decay={2}
					color="#ffc9a0"
				/>
			</group>
			{new Array(24).fill(0).map((_, i) => {
				const t = ((f + i * 9) % 120) / 120;
				return (
					<Glow
						key={i}
						position={[
							-0.32 + Math.sin(i * 7.3) * 0.3,
							1.1 + t * 0.8,
							0.15 + Math.cos(i * 3.1) * 0.15,
						]}
						color="#ffd6a8"
						size={0.03}
						opacity={memory * Math.sin(t * Math.PI)}
					/>
				);
			})}
			<Rain center={[0, 0, -4.5]} size={[6, 6, 3]} count={1000} opacity={0.3} />
		</Shot>
	);
};

// ------------------------------------------------------------ SCENE 8 MORNING HOPE

export const Scene8: React.FC = () => {
	const f = useCurrentFrame();
	const lift = k(f, [40, 150], [0, 1]);
	const pose = breathe(
		withPose({
			x: 0.05,
			z: -1.05,
			rotY: Math.PI,
			spineX: 0.05 - lift * 0.05,
			neckX: 0.05,
			headX: 0.12 - lift * 0.22,
			headY: k(f, [90, 190], [0, 0.4]),
			sad: 0.55 - lift * 0.4,
			smile: -0.15 + lift * 0.45,
			lookY: -0.3,
			lookX: k(f, [90, 190], [0, -0.8]),
		}),
		f,
		1.5,
	);
	const cam = add3(
		lerp3(
			f,
			[0, 120, 210],
			[
				[-1.1, 1.25, 0.9],
				[-0.95, 1.5, -0.35],
				[-0.62, 1.62, -1.5],
			],
		),
		handheld(f, 0.004),
	);
	const target = lerp3(
		f,
		[0, 120, 210],
		[
			[0.0, 1.35, -1.3],
			[0.02, 1.5, -1.2],
			[0.05, 1.6, -1.08],
		],
	);
	return (
		<Shot>
			<SceneSetup bg="#f2d3a3" fog={['#d9c2a0', 0.03]} exposure={1.0} />
			<CameraRig
				position={cam}
				target={target}
				fov={k(f, [0, 120, 210], [44, 38, 34])}
				fill={{intensity: 0.3, color: '#ffe2b8'}}
			/>
			<Room morning lampOn={false} dust chair={{x: 0.85, z: -0.05, rotY: 0}} />
			<Character pose={pose} />
		</Shot>
	);
};
