import React from 'react';
import * as THREE from 'three';
import {box, mat, plane, rbox} from './geo';
import {Backpack, Bed, Books, Calendar, Chair, Desk, DeskLamp, Dust, Glow, House, houseStyles, Laptop, LightShaft, Mug, PhotoFrame, Plant, Poster, SkyDome, WallClock} from './props';
import {woodFloor} from './textures';

// Room layout (meters): floor y=0, back wall z=-1.8, left wall x=-1.8, right wall x=1.8.
export const ROOM = {
	desk: [-0.75, 0, -1.45] as [number, number, number],
	chair: [-0.75, 0, -0.85] as [number, number, number],
	laptop: [-0.75, 0.74, -1.38] as [number, number, number],
	bed: [1.25, 0, -0.6] as [number, number, number],
	window: {x0: 0.45, x1: 1.45, y0: 1.0, y1: 2.15},
};

export type RoomProps = {
	frame: number;
	time: 'night' | 'dawn';
	clockSeconds: number;
	laptopOpen?: number;
	laptopGlow?: number;
	laptopOnDesk?: boolean;
	screen?: 'doc' | 'sheet' | 'chart';
	lamp?: number;
	photoOnDesk?: boolean;
	mess?: number; // 1 = messy desk, 0 = tidy
	chair?: boolean;
	shaft?: number;
	dream?: number | null;
};

const Wall: React.FC<{p: [number, number, number]; s: [number, number, number]; color: string}> = ({p, s, color}) => (
	<mesh geometry={box(...s)} material={mat(color, {rough: 0.95})} position={p} receiveShadow castShadow />
);

const LampSpot: React.FC<{on: number}> = ({on}) => {
	const target = React.useMemo(() => {
		const o = new THREE.Object3D();
		o.position.set(-0.75, 0.74, -1.25);
		return o;
	}, []);
	return (
		<>
			<primitive object={target} />
			<spotLight position={[-1.05, 1.12, -1.45]} target={target} intensity={on * 6} angle={1.0} penumbra={0.9} distance={5} decay={1.5} color="#ffc27a" castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.002} />
		</>
	);
};

export const RoomSet: React.FC<RoomProps> = ({
	frame,
	time,
	clockSeconds,
	laptopOpen = 1,
	laptopGlow = 1,
	laptopOnDesk = true,
	screen = 'doc',
	lamp = 1,
	photoOnDesk = true,
	mess = 1,
	chair = true,
	shaft = 1,
	dream = null,
}) => {
	const wallC = '#cdbda5';
	const W = ROOM.window;
	const night = time === 'night';
	const floorMat = React.useMemo(() => new THREE.MeshStandardMaterial({map: woodFloor(), roughness: 0.7}), []);
	return (
		<group>
			{/* floor + ceiling */}
			<mesh geometry={plane(3.6, 4.4)} material={floorMat} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.4]} receiveShadow />
			<mesh geometry={plane(3.6, 4.4)} material={mat('#e4dccd', {rough: 1})} rotation={[Math.PI / 2, 0, 0]} position={[0, 2.7, 0.4]} />
			{/* back wall with a window hole */}
			<Wall p={[(-1.8 + W.x0) / 2, 1.35, -1.85]} s={[W.x0 + 1.8, 2.7, 0.1]} color={wallC} />
			<Wall p={[(W.x1 + 1.8) / 2, 1.35, -1.85]} s={[1.8 - W.x1, 2.7, 0.1]} color={wallC} />
			<Wall p={[(W.x0 + W.x1) / 2, W.y0 / 2, -1.85]} s={[W.x1 - W.x0, W.y0, 0.1]} color={wallC} />
			<Wall p={[(W.x0 + W.x1) / 2, (W.y1 + 2.7) / 2, -1.85]} s={[W.x1 - W.x0, 2.7 - W.y1, 0.1]} color={wallC} />
			{/* window frame */}
			<group position={[(W.x0 + W.x1) / 2, (W.y0 + W.y1) / 2, -1.82]}>
				{[
					[0, (W.y1 - W.y0) / 2, W.x1 - W.x0 + 0.08, 0.06],
					[0, -(W.y1 - W.y0) / 2, W.x1 - W.x0 + 0.16, 0.08],
					[0, 0.15, W.x1 - W.x0, 0.04],
				].map(([x, y, w, h], i) => (
					<mesh key={i} geometry={box(w, h, 0.1)} material={mat('#efe9de', {rough: 0.6})} position={[x, y, 0]} castShadow />
				))}
				{[-(W.x1 - W.x0) / 2, 0, (W.x1 - W.x0) / 2].map((x) => (
					<mesh key={x} geometry={box(0.05, W.y1 - W.y0, 0.1)} material={mat('#efe9de', {rough: 0.6})} position={[x, 0, 0]} castShadow />
				))}
				{/* glass */}
				<mesh geometry={plane(W.x1 - W.x0, W.y1 - W.y0)} position={[0, 0, -0.02]}>
					<meshStandardMaterial color={night ? '#22304a' : '#a9c4e0'} transparent opacity={0.12} roughness={0.05} metalness={0.3} />
				</mesh>
			</group>
			{/* curtains */}
			{[W.x0 - 0.12, W.x1 + 0.12].map((x, i) => (
				<mesh key={x} geometry={rbox(0.28, 1.6, 0.06, 0.03)} material={mat(i ? '#6f7f73' : '#6f7f73', {rough: 0.95})} position={[x, 1.55, -1.72]} castShadow />
			))}
			{/* side walls */}
			<Wall p={[-1.85, 1.35, 0.4]} s={[0.1, 2.7, 4.4]} color={wallC} />
			<Wall p={[1.85, 1.35, 0.4]} s={[0.1, 2.7, 4.4]} color={wallC} />
			{/* baseboards */}
			<mesh geometry={box(3.6, 0.08, 0.02)} material={mat('#8a6a50')} position={[0, 0.04, -1.79]} />
			<mesh geometry={box(0.02, 0.08, 4.4)} material={mat('#8a6a50')} position={[-1.79, 0.04, 0.4]} />
			<mesh geometry={box(0.02, 0.08, 4.4)} material={mat('#8a6a50')} position={[1.79, 0.04, 0.4]} />
			{/* rug */}
			<mesh geometry={rbox(1.6, 0.01, 1.1, 0.004)} material={mat('#8a5a4a', {rough: 1})} position={[-0.2, 0.005, 0.15]} receiveShadow />
			<mesh geometry={rbox(1.4, 0.012, 0.9, 0.004)} material={mat('#a67a5f', {rough: 1})} position={[-0.2, 0.006, 0.15]} receiveShadow />

			{/* furniture */}
			<Desk position={ROOM.desk} />
			{chair ? <Chair position={ROOM.chair} /> : null}
			<Bed position={ROOM.bed} />
			{/* wardrobe */}
			<mesh geometry={rbox(0.6, 2.0, 1.1, 0.02)} material={mat('#7a5a40', {rough: 0.6})} position={[-1.5, 1.0, 1.1]} castShadow receiveShadow />
			<mesh geometry={box(0.01, 1.9, 0.005)} material={mat('#4b3626')} position={[-1.195, 1.0, 1.1]} rotation={[0, Math.PI / 2, 0]} />
			{/* shelf */}
			<mesh geometry={box(0.25, 0.03, 0.9)} material={mat('#8b6447', {rough: 0.6})} position={[-1.67, 1.55, -0.55]} castShadow receiveShadow />
			<Books position={[-1.67, 1.565, -0.75]} rotationY={Math.PI / 2} count={4} seed={4} />
			<Plant position={[-1.67, 1.565, -0.3]} scale={0.5} seed={2} />
			<Poster position={[-1.79, 1.75, 0.35]} rotationY={Math.PI / 2} />
			<Calendar position={[-1.3, 1.45, -1.795]} day={25} />
			<WallClock position={[-0.6, 1.95, -1.78]} seconds={clockSeconds} />
			<Plant position={[0.18, 0, -1.55]} scale={1.1} seed={5} />
			<Backpack position={[-0.15, 0.21, -1.0]} rotation={[0.1, 0.5, 0]} />

			{/* desk items */}
			{laptopOnDesk ? <Laptop position={ROOM.laptop} open={laptopOpen} glow={laptopGlow} screen={screen} /> : null}
			<DeskLamp position={[-1.2, 0.74, -1.55]} rotationY={0.5} on={lamp} />
			<Mug position={mess > 0.5 ? [-0.32, 0.74, -1.25] : [-1.05, 0.74, -1.3]} rotationY={0.6} />
			<Books position={mess > 0.5 ? [-0.25, 0.74, -1.5] : [-1.2, 0.74, -1.3]} rotationY={mess > 0.5 ? 0.4 : 0} count={3} seed={1} />
			{mess > 0.5 ? (
				<>
					{[0, 1, 2].map((i) => (
						<mesh key={i} geometry={box(0.21, 0.002, 0.29)} material={mat('#f4f1ea', {rough: 0.9})} position={[-0.48 + i * 0.07, 0.742 + i * 0.002, -1.2 + i * 0.03]} rotation={[0, 0.3 * i - 0.4, 0]} receiveShadow />
					))}
				</>
			) : (
				<mesh geometry={box(0.21, 0.02, 0.29)} material={mat('#f4f1ea', {rough: 0.9})} position={[-0.3, 0.75, -1.45]} receiveShadow />
			)}
			{photoOnDesk ? <PhotoFrame position={[-0.32, 0.835, -1.62]} rotation={[-0.08, -0.35, 0]} /> : null}

			{/* lights */}
			{night ? (
				<>
					<hemisphereLight args={['#4a5d85', '#2a1f18', 0.35]} />
					<LampSpot on={lamp} />
					<pointLight position={[-0.9, 1.6, -1.2]} intensity={lamp * 0.35} distance={5} decay={1.5} color="#ffb870" />
					<pointLight position={[0.3, 2.4, 0.6]} intensity={0.35} distance={6} decay={1.5} color="#ffd9b0" />
					<directionalLight position={[3.5, 5.0, -7]} intensity={0.9} color="#8fa8de" castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-4} shadow-camera-right={4} shadow-camera-top={4} shadow-camera-bottom={-4} shadow-bias={-0.001} />
					{laptopOpen > 0.3 ? <pointLight position={[ROOM.laptop[0], 0.9, ROOM.laptop[2] - 0.05]} intensity={laptopGlow * 0.12} distance={1.4} decay={2} color="#bcd4ff" /> : null}
					<LightShaft position={[0.95, 2.1, -1.8]} rotation={[0.75, -0.25, 0]} w={0.9} len={2.6} color="#7f9cd6" opacity={0.05 * shaft} />
					<SkyDome top="#05070d" mid="#121a2e" bottom="#2a3550" id="night" r={60} />
					<Glow position={[3.5, 7, -30]} scale={6} color="#a9c0ff" opacity={0.25} />
					{dream === null ? (
						<group position={[0, 0, -14]}>
							<House position={[-2, 0, 0]} s={{...houseStyles[0], lit: 0.8}} />
							<House position={[6, 0, -3]} s={{...houseStyles[2], lit: 0.5}} />
						</group>
					) : (
						<group position={[2.2, -0.4, -13]} rotation={[0, -0.25, 0]}>
							<House s={{...houseStyles[2], lit: dream}} dream={dream} />
							<Glow position={[0, 2.5, 4]} scale={12} color="#ffc27a" opacity={dream * 0.35} />
							<pointLight position={[0, 2, 5]} intensity={dream * 10} distance={14} decay={1.6} color="#ffc27a" />
						</group>
					)}
				</>
			) : (
				<>
					<hemisphereLight args={['#a9bfe0', '#4a3a2e', 0.65]} />
					<directionalLight position={[3.0, 2.6, -6]} intensity={2.6} color="#ffc48a" castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-4} shadow-camera-right={4} shadow-camera-top={4} shadow-camera-bottom={-4} shadow-bias={-0.001} />
					<pointLight position={[0.3, 2.3, 0.8]} intensity={0.5} distance={6} decay={1.5} color="#cfe0ff" />
					<LampSpot on={lamp * 0.6} />
					<LightShaft position={[0.95, 2.05, -1.8]} rotation={[1.0, -0.35, 0]} w={0.95} len={3.0} color="#ffcf96" opacity={0.12 * shaft} />
					<SkyDome top="#6f8fc0" mid="#e7b98f" bottom="#ffd7a0" id="dawn" r={60} />
					<Glow position={[5, 3, -30]} scale={14} color="#ffd29a" opacity={0.7} />
					<group position={[0, 0, -14]}>
						<House position={[-2, 0, 0]} s={houseStyles[0]} />
						<House position={[6, 0, -3]} s={houseStyles[2]} />
					</group>
				</>
			)}
			<Dust frame={frame} center={[0.3, 1.3, -0.8]} size={[2.2, 1.8, 1.6]} count={90} color={night ? '#c9d8ff' : '#ffe0b0'} opacity={night ? 0.35 : 0.6} />
		</group>
	);
};
