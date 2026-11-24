import React from 'react';
import {
	AbsoluteFill,
	Html5Audio,
	interpolate,
	random,
	Sequence,
	staticFile,
	useCurrentFrame,
} from 'remotion';
import {footstepFrames} from './Character';
import {
	Scene1,
	Scene2,
	Scene3,
	Scene4,
	Scene5,
	Scene6,
	Scene7,
	Scene8,
	scene2Phase,
	scene6Phase,
} from './Scenes';
import {Subtitles} from './Subtitles';

export const FPS = 30;
export const DURATION = 1812; // VO is 58.84s, + ~1.5s music tail & fade

const s = (sec: number) => Math.round(sec * FPS);

/** Scene boundaries follow the VO sentences (see captions.json). */
export const SCENES = [
	{id: 'hook', from: 0, to: s(8.1), C: Scene1},
	{id: 'hidup-sulit', from: s(8.1), to: s(15.8), C: Scene2},
	{id: 'rasa-bersalah', from: s(15.8), to: s(22.6), C: Scene3},
	{id: 'tekanan-finansial', from: s(22.6), to: s(33.5), C: Scene4},
	{id: 'keputusan', from: s(33.5), to: s(39.1), C: Scene5},
	{id: 'perpisahan', from: s(39.1), to: s(48.1), C: Scene6},
	{id: 'plot-twist', from: s(48.1), to: s(53.4), C: Scene7},
	{id: 'penutup', from: s(53.4), to: DURATION, C: Scene8},
] as const;

const XF = 8; // crossfade half-length in frames

export const sceneStart = (from: number) => Math.max(0, from - XF);

const SceneLayer: React.FC<{
	readonly from: number;
	readonly to: number;
	readonly name: string;
	readonly children: React.ReactNode;
}> = ({from, to, name, children}) => {
	const start = sceneStart(from);
	const end = Math.min(DURATION, to + XF);
	return (
		<Sequence from={start} durationInFrames={end - start} name={name}>
			<FadeIn enabled={from > 0}>{children}</FadeIn>
		</Sequence>
	);
};

const FadeIn: React.FC<{
	readonly enabled: boolean;
	readonly children: React.ReactNode;
}> = ({enabled, children}) => {
	const f = useCurrentFrame();
	const op = enabled
		? interpolate(f, [0, XF * 2], [0, 1], {
				extrapolateLeft: 'clamp',
				extrapolateRight: 'clamp',
			})
		: 1;
	return <AbsoluteFill style={{opacity: op}}>{children}</AbsoluteFill>;
};

const Grain: React.FC = () => {
	const f = useCurrentFrame();
	const seed = Math.floor(random(`grain${f}`) * 1000);
	return (
		<AbsoluteFill
			style={{mixBlendMode: 'overlay', opacity: 0.22, pointerEvents: 'none'}}
		>
			<svg width="100%" height="100%">
				<filter id="g">
					<feTurbulence
						type="fractalNoise"
						baseFrequency="0.9"
						numOctaves={2}
						seed={seed}
						stitchTiles="stitch"
					/>
					<feColorMatrix type="saturate" values="0" />
				</filter>
				<rect width="100%" height="100%" filter="url(#g)" />
			</svg>
		</AbsoluteFill>
	);
};

const Loop: React.FC<{
	readonly src: string;
	readonly from: number;
	readonly to: number;
	readonly volume: number;
	readonly fade?: number;
}> = ({src, from, to, volume, fade = 15}) => (
	<Sequence from={from} durationInFrames={to - from} name={src} layout="none">
		<Html5Audio
			src={staticFile(`pria/${src}`)}
			loop
			volume={(f) =>
				interpolate(
					f,
					[0, fade, to - from - fade, to - from],
					[0, volume, volume, 0],
					{
						extrapolateLeft: 'clamp',
						extrapolateRight: 'clamp',
					},
				)
			}
		/>
	</Sequence>
);

const Steps: React.FC<{
	readonly sceneFrom: number;
	readonly frames: number[];
	readonly volume: number;
}> = ({sceneFrom, frames, volume}) => (
	<>
		{frames.map((f, i) => (
			<Sequence
				key={f}
				from={sceneFrom + f}
				durationInFrames={12}
				name="step"
				layout="none"
			>
				<Html5Audio
					src={staticFile('pria/step.wav')}
					volume={volume * (0.8 + random(`stepv${i}`) * 0.3)}
					playbackRate={0.92 + random(`stepr${i}`) * 0.16}
				/>
			</Sequence>
		))}
	</>
);

export const PriaMeninggalkanWanita: React.FC = () => {
	const frame = useCurrentFrame();
	const [S1, S2, S3, S4, S5, S6, S7, S8] = SCENES;
	const s2Steps = footstepFrames(0, S2.to - S2.from + 2 * XF, scene2Phase);
	const s6Steps = footstepFrames(
		118,
		S6.to - S6.from + 2 * XF,
		scene6Phase,
	).filter((f) => f > 120);
	const fadeOut = interpolate(frame, [DURATION - 30, DURATION - 1], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const fadeIn = interpolate(frame, [0, 12], [1, 0], {
		extrapolateRight: 'clamp',
	});
	return (
		<AbsoluteFill style={{backgroundColor: 'black'}}>
			{SCENES.map((sc) => (
				<SceneLayer key={sc.id} name={sc.id} from={sc.from} to={sc.to}>
					<sc.C />
				</SceneLayer>
			))}
			{/* cinematic grade: vignette + grain */}
			<AbsoluteFill
				style={{
					background:
						'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.55) 85%, rgba(0,0,0,0.8) 100%)',
					pointerEvents: 'none',
				}}
			/>
			<Grain />
			<AbsoluteFill
				style={{
					background:
						'linear-gradient(to bottom, rgba(0,0,0,0) 62%, rgba(0,0,0,0.45) 100%)',
				}}
			/>
			<Subtitles />
			<AbsoluteFill
				style={{backgroundColor: 'black', opacity: Math.max(fadeOut, fadeIn)}}
			/>

			{/* ---------------- audio ---------------- */}
			<Html5Audio src={staticFile('pria/vo.wav')} volume={1} />
			<Html5Audio
				src={staticFile('pria/piano.wav')}
				volume={(f) =>
					interpolate(f, [0, s(58.9), s(59.4)], [0.11, 0.11, 0.28], {
						extrapolateLeft: 'clamp',
						extrapolateRight: 'clamp',
					})
				}
			/>
			{/* room ambience */}
			<Loop src="room.wav" from={S1.from} to={S1.to + 8} volume={0.07} />
			<Loop src="rain.wav" from={S1.from} to={S1.to + 8} volume={0.035} />
			<Loop src="room.wav" from={S4.from - 8} to={S4.to + 8} volume={0.07} />
			<Loop src="rain.wav" from={S4.from - 8} to={S4.to + 8} volume={0.03} />
			<Loop src="room.wav" from={S7.from - 8} to={S7.to + 8} volume={0.07} />
			<Loop src="rain.wav" from={S7.from - 8} to={S7.to + 8} volume={0.035} />
			{/* street / rain */}
			<Loop
				src="rain.wav"
				from={S2.from - 8}
				to={S3.to + 8}
				volume={0.16}
				fade={20}
			/>
			<Loop
				src="city.wav"
				from={S2.from - 8}
				to={S3.to + 8}
				volume={0.08}
				fade={20}
			/>
			<Loop
				src="rain.wav"
				from={S5.from - 8}
				to={S6.to + 8}
				volume={0.17}
				fade={20}
			/>
			<Loop
				src="city.wav"
				from={S5.from - 8}
				to={S6.to + 8}
				volume={0.07}
				fade={20}
			/>
			<Steps sceneFrom={sceneStart(S2.from)} frames={s2Steps} volume={0.2} />
			<Steps sceneFrom={sceneStart(S6.from)} frames={s6Steps} volume={0.18} />
			{/* morning */}
			<Loop
				src="birds.wav"
				from={S8.from - 8}
				to={DURATION}
				volume={0.12}
				fade={25}
			/>
			{/* soft whooshes on the big transitions */}
			{[S2.from, S4.from, S5.from, S7.from, S8.from].map((f) => (
				<Sequence
					key={f}
					from={f - 18}
					durationInFrames={36}
					name="whoosh"
					layout="none"
				>
					<Html5Audio src={staticFile('pria/whoosh.wav')} volume={0.04} />
				</Sequence>
			))}
		</AbsoluteFill>
	);
};
