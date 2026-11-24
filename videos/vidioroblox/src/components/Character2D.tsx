import {useMemo} from 'react';
import * as THREE from 'three';
import type {V3} from '../lib/anim';
import {
	armTex,
	blobTex,
	type Expr,
	headTex,
	legTex,
	SIZES,
	torsoTex,
	type View,
	type Who,
} from '../lib/textures';

/**
 * Flat 2D layered rig (head / torso / 2 arms / 2 legs), mounted in the 3D world as a
 * yaw-billboard so it never shows its edge. Limbs rotate in the picture plane.
 */
export type Pose = {
	expr: Expr;
	mouth: 0 | 1 | 2;
	blink: boolean;
	look: -1 | 0 | 1;
	legL: number; // side view: back leg swing (rad, + = forward). front view: unused
	legR: number;
	liftL: number; // front view: foot lift 0..1
	liftR: number;
	armL: number; // side: back arm swing. front: screen-left arm raise outward (rad)
	armR: number; // side: front arm swing. front: screen-right arm raise outward (rad)
	bob: number;
	lean: number;
	headTilt: number;
	headFlip: boolean; // side view: head looks backward
	sit: boolean;
};

export const basePose = (p: Partial<Pose> = {}): Pose => ({
	expr: 'neutral',
	mouth: 0,
	blink: false,
	look: 0,
	legL: 0,
	legR: 0,
	liftL: 0,
	liftR: 0,
	armL: 0.06,
	armR: 0.06,
	bob: 0,
	lean: 0,
	headTilt: 0,
	headFlip: false,
	sit: false,
	...p,
});

export const autoBlink = (f: number, seed: number) => {
	const period = 84 + (seed % 5) * 9;
	return (f + seed * 17) % period < 3;
};

export const talkMouth = (f: number, seed = 0): 0 | 1 | 2 => {
	const v = Math.sin(f * 0.9 + seed) + Math.sin(f * 0.37 + seed * 2);
	return v > 0.9 ? 2 : v > -0.2 ? 1 : 0;
};

export const breathe = (f: number) => Math.sin(f * 0.12) * 0.012;

/** Side-view walk/run cycle. freq in cycles/sec at 30fps. */
export const cycle = (f: number, freq: number, amp: number) => {
	const ph = (f / 30) * freq * Math.PI * 2;
	const s = Math.sin(ph);
	return {
		legL: -s * amp,
		legR: s * amp,
		armL: s * amp * 0.85,
		armR: -s * amp * 0.85,
		bob: Math.abs(Math.cos(ph)) * 0.06 * (amp / 0.5),
		liftL: Math.max(0, s),
		liftR: Math.max(0, -s),
	};
};

const pivotTop = (w: number, h: number) => new THREE.PlaneGeometry(w, h).translate(0, -h / 2, 0);
const pivotBottom = (w: number, h: number) => new THREE.PlaneGeometry(w, h).translate(0, h / 2, 0);

const Part = ({
	geo,
	tex,
	position,
	rotZ = 0,
	scaleX = 1,
	scaleY = 1,
	glow,
	tint = '#ffffff',
}: {
	geo: THREE.BufferGeometry;
	tex: THREE.Texture;
	position: V3;
	rotZ?: number;
	scaleX?: number;
	scaleY?: number;
	glow: number;
	tint?: string;
}) => (
	<mesh geometry={geo} position={position} rotation-z={rotZ} scale={[scaleX, scaleY, 1]}>
		<meshLambertMaterial
			map={tex}
			emissiveMap={tex}
			emissive={tint}
			emissiveIntensity={glow}
			color={tint}
			alphaTest={0.5}
			side={THREE.DoubleSide}
		/>
	</mesh>
);

export const Character2D = ({
	who,
	view,
	facing = 1,
	position,
	cam,
	pose,
	glow = 0.35,
	scale = 1,
	shadow = true,
}: {
	who: Who;
	view: View;
	facing?: 1 | -1;
	position: V3;
	cam: V3;
	pose: Pose;
	glow?: number;
	scale?: number;
	shadow?: boolean;
}) => {
	const S = SIZES[view];
	const geos = useMemo(
		() => ({
			leg: pivotTop(S.legW, S.legH),
			arm: pivotTop(S.armW, S.armH),
			torso: pivotBottom(S.torsoW, S.torsoH),
			head: pivotBottom(S.headW, S.headH),
		}),
		[S],
	);
	const yaw = Math.atan2(cam[0] - position[0], cam[2] - position[2]);
	const hipY = pose.sit ? 0.5 : S.legH;
	const legScale = pose.sit ? 0.5 / S.legH : 1;
	const shoulderY = hipY + S.torsoH - 0.08;
	const neckY = hipY + S.torsoH - 0.03;
	const head = headTex(who, view, {
		expr: pose.expr,
		blink: pose.blink,
		mouth: pose.mouth,
		look: pose.look,
	});
	const BACK = '#9c9cb0';
	return (
		<group position={position} rotation-y={yaw} scale={scale}>
			{shadow ? (
				<mesh rotation-x={-Math.PI / 2} position={[0, 0.015, 0]} scale={[1 - pose.bob * 2, 1 - pose.bob * 2, 1]}>
					<planeGeometry args={[view === 'front' ? 1.3 : 1.1, 0.55]} />
					<meshBasicMaterial map={blobTex()} transparent depthWrite={false} />
				</mesh>
			) : null}
			<group scale-x={facing} position-y={pose.bob} rotation-z={-pose.lean * facing}>
				{view === 'front' ? (
					<>
						<Part geo={geos.leg} tex={legTex(who)} glow={glow} position={[-0.21, hipY, -0.01]} scaleY={legScale * (1 - pose.liftL * 0.22)} />
						<Part geo={geos.leg} tex={legTex(who)} glow={glow} position={[0.21, hipY, -0.01]} scaleY={legScale * (1 - pose.liftR * 0.22)} />
						<Part geo={geos.torso} tex={torsoTex(who, 'front')} glow={glow} position={[0, hipY - 0.03, 0]} />
						<Part geo={geos.arm} tex={armTex(who)} glow={glow} position={[-(S.torsoW / 2 + S.armW / 2 - 0.04), shoulderY, 0.006]} rotZ={-pose.armL} />
						<Part geo={geos.arm} tex={armTex(who)} glow={glow} position={[S.torsoW / 2 + S.armW / 2 - 0.04, shoulderY, 0.006]} rotZ={pose.armR} />
						<Part geo={geos.head} tex={head} glow={glow} position={[0, neckY, 0.012]} rotZ={pose.headTilt} />
					</>
				) : (
					<>
						<Part geo={geos.arm} tex={armTex(who)} glow={glow} tint={BACK} position={[0, shoulderY, -0.03]} rotZ={pose.armL} />
						<Part geo={geos.leg} tex={legTex(who)} glow={glow} tint={BACK} position={[-0.02, hipY, -0.02]} rotZ={pose.legL} scaleY={legScale} />
						<Part geo={geos.leg} tex={legTex(who)} glow={glow} position={[0.02, hipY, -0.01]} rotZ={pose.legR} scaleY={legScale} />
						<Part geo={geos.torso} tex={torsoTex(who, 'side')} glow={glow} position={[0, hipY - 0.03, 0]} />
						<Part geo={geos.head} tex={head} glow={glow} position={[0.03, neckY, 0.01]} rotZ={pose.headTilt} scaleX={pose.headFlip ? -1 : 1} />
						<Part geo={geos.arm} tex={armTex(who)} glow={glow} position={[0, shoulderY, 0.025]} rotZ={pose.armR} />
					</>
				)}
			</group>
		</group>
	);
};
