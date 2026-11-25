import {useFrame, useThree} from '@react-three/fiber';
import {ThreeCanvas} from '@remotion/three';
import React, {useLayoutEffect, useMemo} from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {BokehPass} from 'three/examples/jsm/postprocessing/BokehPass.js';
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer.js';
import {OutputPass} from 'three/examples/jsm/postprocessing/OutputPass.js';
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass.js';

export type V3 = [number, number, number];

export const Cam: React.FC<{
	readonly pos: V3;
	readonly target: V3;
	readonly fov?: number;
	readonly roll?: number;
}> = ({pos, target, fov = 35, roll = 0}) => {
	const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
	useLayoutEffect(() => {
		camera.position.set(pos[0], pos[1], pos[2]);
		camera.up.set(Math.sin(roll), Math.cos(roll), 0);
		camera.lookAt(target[0], target[1], target[2]);
		camera.fov = fov;
		camera.near = 0.05;
		camera.far = 120;
		camera.updateProjectionMatrix();
	});
	return null;
};

// Depth of field post processing. focus = distance from camera in world units.
const Post: React.FC<{
	readonly focus: number;
	readonly aperture: number;
	readonly maxblur: number;
}> = ({focus, aperture, maxblur}) => {
	const {gl, scene, camera, size} = useThree();
	const fx = useMemo(() => {
		const rt = new THREE.WebGLRenderTarget(size.width, size.height, {
			samples: 4,
			type: THREE.HalfFloatType,
		});
		const composer = new EffectComposer(gl, rt);
		composer.addPass(new RenderPass(scene, camera));
		const bokeh = new BokehPass(scene, camera, {
			focus: 3,
			aperture: 0.005,
			maxblur: 0.01,
		});
		composer.addPass(bokeh);
		composer.addPass(new OutputPass());
		return {composer, bokeh};
	}, [gl, scene, camera]);
	useLayoutEffect(() => {
		fx.composer.setPixelRatio(1);
		fx.composer.setSize(size.width, size.height);
	}, [fx, size.width, size.height]);
	const u = fx.bokeh.uniforms as Record<string, {value: number}>;
	u.focus.value = focus;
	u.aperture.value = aperture;
	u.maxblur.value = maxblur;
	useFrame(() => {
		fx.composer.render();
	}, 1);
	return null;
};

export const Stage: React.FC<{
	readonly children: React.ReactNode;
	readonly background: string;
	readonly fog?: [string, number, number];
	readonly focus?: number;
	readonly aperture?: number;
	readonly maxblur?: number;
	readonly exposure?: number;
}> = ({children, background, fog, focus, aperture = 0.004, maxblur = 0.008, exposure = 1.25}) => {
	const {width, height} = useVideoConfig();
	return (
		<AbsoluteFill style={{backgroundColor: background}}>
			<ThreeCanvas
				width={width}
				height={height}
				dpr={1}
				shadows={{type: THREE.PCFSoftShadowMap}}
				gl={{antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance'}}
				onCreated={({gl}) => {
					gl.toneMapping = THREE.ACESFilmicToneMapping;
					gl.toneMappingExposure = exposure;
				}}
			>
				<color attach="background" args={[background]} />
				{fog ? <fog attach="fog" args={fog} /> : null}
				{children}
				{focus !== undefined ? (
					<Post focus={focus} aperture={aperture} maxblur={maxblur} />
				) : null}
			</ThreeCanvas>
		</AbsoluteFill>
	);
};
