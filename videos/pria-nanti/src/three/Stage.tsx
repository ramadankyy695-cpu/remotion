import React, {useLayoutEffect} from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {ThreeCanvas} from '@remotion/three';
import {EffectComposer, Bloom, DepthOfField, Vignette, Noise, SMAA} from '@react-three/postprocessing';
import {useVideoConfig} from 'remotion';

export type Cam = {
	pos: [number, number, number];
	target: [number, number, number];
	fov: number;
	roll?: number;
};

const CameraRig: React.FC<{cam: Cam}> = ({cam}) => {
	const {camera, gl, scene} = useThree();
	useLayoutEffect(() => {
		const c = camera as THREE.PerspectiveCamera;
		c.position.set(...cam.pos);
		c.up.set(Math.sin(cam.roll ?? 0), Math.cos(cam.roll ?? 0), 0);
		c.lookAt(...cam.target);
		c.fov = cam.fov;
		c.near = 0.03;
		c.far = 200;
		c.updateProjectionMatrix();
		c.updateMatrixWorld();
	}, [camera, cam]);
	useLayoutEffect(() => {
		gl.toneMapping = THREE.ACESFilmicToneMapping;
		gl.outputColorSpace = THREE.SRGBColorSpace;
		gl.shadowMap.enabled = true;
		gl.shadowMap.type = THREE.PCFSoftShadowMap;
	}, [gl, scene]);
	return null;
};

const Exposure: React.FC<{exposure: number}> = ({exposure}) => {
	const {gl} = useThree();
	gl.toneMappingExposure = exposure;
	return null;
};

export const Stage: React.FC<{
	cam: Cam;
	bg: string;
	fog?: {color: string; near: number; far: number};
	exposure?: number;
	focus?: number; // world distance from camera to focus plane
	focusRange?: number;
	bokeh?: number;
	bloom?: number;
	children: React.ReactNode;
}> = ({cam, bg, fog, exposure = 1, focus, focusRange = 1.5, bokeh = 3, bloom = 0.5, children}) => {
	const {width, height} = useVideoConfig();
	return (
		<ThreeCanvas
			width={width}
			height={height}
			shadows
			dpr={1}
			gl={{antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance'}}
			camera={{fov: cam.fov, position: cam.pos, near: 0.03, far: 200}}
			style={{background: bg}}
		>
			<color attach="background" args={[bg]} />
			{fog ? <fog attach="fog" args={[fog.color, fog.near, fog.far]} /> : null}
			<CameraRig cam={cam} />
			<Exposure exposure={exposure} />
			{children}
			<EffectComposer multisampling={0} enableNormalPass={false}>
				<SMAA />
				<DepthOfField worldFocusDistance={focus ?? 3} worldFocusRange={focusRange} bokehScale={bokeh} resolutionScale={0.5} />
				<Bloom intensity={bloom} luminanceThreshold={0.82} luminanceSmoothing={0.2} mipmapBlur />
				<Vignette darkness={0.55} offset={0.28} />
				<Noise opacity={0.035} premultiply />
			</EffectComposer>
		</ThreeCanvas>
	);
};
