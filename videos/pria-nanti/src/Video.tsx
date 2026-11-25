import React from 'react';
import {AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import '@fontsource/plus-jakarta-sans/800.css';
import '@fontsource/plus-jakarta-sans/500.css';
import {s, SHOTS, ShotId, TOTAL_FRAMES} from './timeline';
import {Subtitles} from './Subtitles';
import {Scene1} from './scenes/Scene1';
import {Scene2a, Scene2b, Scene2c} from './scenes/Scene2';
import {Scene3a, Scene3b} from './scenes/Scene3';
import {Scene4a, Scene4b, Scene4c} from './scenes/Scene4';
import {Scene5a, Scene5b, Scene5c, Scene5d} from './scenes/Scene5';
import {Scene6a, Scene6b, Scene6c, Scene6d, Scene6e} from './scenes/Scene6';
import {Scene7a, Scene7b, Scene7c} from './scenes/Scene7';
import {Scene8a, Scene8b, Scene8c} from './scenes/Scene8';
import {Scene9} from './scenes/Scene9';
import {stepFrames} from './scenes/util';

const COMPONENTS: Record<ShotId, React.FC> = {
	s1: Scene1,
	s2a: Scene2a,
	s2b: Scene2b,
	s2c: Scene2c,
	s3a: Scene3a,
	s3b: Scene3b,
	s4a: Scene4a,
	s4b: Scene4b,
	s4c: Scene4c,
	s5a: Scene5a,
	s5b: Scene5b,
	s5c: Scene5c,
	s5d: Scene5d,
	s6a: Scene6a,
	s6b: Scene6b,
	s6c: Scene6c,
	s6d: Scene6d,
	s6e: Scene6e,
	s7a: Scene7a,
	s7b: Scene7b,
	s7c: Scene7c,
	s8a: Scene8a,
	s8b: Scene8b,
	s8c: Scene8c,
	s9: Scene9,
};

// Crossfade length (frames) INTO each shot. 0 = straight cut (used within a scene).
const XF: Partial<Record<ShotId, number>> = {
	s2a: 10,
	s2c: 8,
	s3a: 10,
	s3b: 14,
	s4a: 12,
	s5a: 12,
	s5c: 8,
	s6a: 10,
	s6d: 6,
	s7a: 14,
	s8a: 16,
	s9: 16,
};

const Shot: React.FC<{id: ShotId; xf: number; len: number}> = ({id, xf, len}) => {
	const f = useCurrentFrame();
	const C = COMPONENTS[id];
	const opacity = xf > 0 ? interpolate(f, [0, xf], [0, 1], {extrapolateRight: 'clamp'}) : 1;
	void len;
	return (
		<AbsoluteFill style={{opacity}}>
			<C />
		</AbsoluteFill>
	);
};

const Title: React.FC = () => {
	const f = useCurrentFrame();
	const a = interpolate(f, [0, 30], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const out = interpolate(f, [80, 100], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	return (
		<AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity: a * out}}>
			<div style={{position: 'absolute', top: 640, width: '100%', textAlign: 'center', transform: `translateY(${(1 - a) * 16}px)`}}>
				<div style={{fontFamily: 'Plus Jakarta Sans', fontWeight: 500, fontSize: 34, letterSpacing: 14, color: 'rgba(255,244,226,0.9)', textShadow: '0 2px 18px rgba(0,0,0,0.5)'}}>
					SEBUAH CERITA TENTANG
				</div>
				<div
					style={{
						marginTop: 18,
						fontFamily: 'Plus Jakarta Sans',
						fontWeight: 800,
						fontSize: 84,
						lineHeight: 1.08,
						color: '#FFF6E8',
						letterSpacing: -1,
						textShadow: '0 4px 30px rgba(0,0,0,0.55), 0 1px 3px rgba(0,0,0,0.4)',
						padding: '0 70px',
					}}
				>
					Pria yang Selalu
					<br />
					Bilang <span style={{color: '#FFC65C'}}>Nanti</span>
				</div>
			</div>
		</AbsoluteFill>
	);
};

const Fade: React.FC = () => {
	const f = useCurrentFrame();
	const inO = interpolate(f, [0, 12], [1, 0], {extrapolateRight: 'clamp'});
	const outO = interpolate(f, [TOTAL_FRAMES - 26, TOTAL_FRAMES - 2], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	return <AbsoluteFill style={{background: '#000', opacity: Math.max(inO, outO)}} />;
};

// ------------------------------------------------------------------ audio

type Amb = {file: string; from: number; to: number; vol: number; fadeIn?: number; fadeOut?: number};

const AmbTrack: React.FC<Amb> = ({file, from, to, vol, fadeIn = 12, fadeOut = 12}) => {
	const dur = to - from;
	return (
		<Sequence from={from} durationInFrames={dur} layout="none">
			<Audio
				src={staticFile(`sfx/${file}`)}
				loop
				volume={(f) => vol * Math.min(interpolate(f, [0, fadeIn], [0, 1], {extrapolateRight: 'clamp'}), interpolate(f, [dur - fadeOut, dur], [1, 0], {extrapolateLeft: 'clamp'}))}
			/>
		</Sequence>
	);
};

const Sfx: React.FC<{file: string; at: number; vol: number}> = ({file, at, vol}) => (
	<Sequence from={Math.max(0, Math.round(at))} durationInFrames={150} layout="none">
		<Audio src={staticFile(`sfx/${file}`)} volume={vol} />
	</Sequence>
);

const st = (id: ShotId) => s(SHOTS[id][0]);
const en = (id: ShotId) => s(SHOTS[id][1]);
const xs = (id: ShotId) => st(id) - (XF[id] ?? 0);

// footsteps for walking shots, derived from the same walk cycle math used for the animation
const steps = (id: ShotId, speed: number, amp: number, phase0: number, vol: number, from = 0, to?: number) => {
	const start = xs(id);
	const len = (to ?? en(id) - start) as number;
	return stepFrames(speed, amp, from, len, phase0).map((f, i) => <Sfx key={`${id}-${f}`} file={`step${i % 4}.wav`} at={start + f} vol={vol * (0.8 + ((i * 37) % 10) / 50)} />);
};

const AudioMix: React.FC = () => (
	<>
		<Audio src={staticFile('vo.wav')} volume={1} />
		<Audio src={staticFile('sfx/music.wav')} volume={0.42} />
		{/* ambiences */}
		<AmbTrack file="amb_room_night.wav" from={0} to={en('s2b')} vol={0.5} fadeIn={20} />
		<AmbTrack file="clock_ticks.wav" from={0} to={en('s1')} vol={0.35} />
		<AmbTrack file="amb_neighborhood.wav" from={xs('s2c')} to={en('s2c')} vol={0.5} />
		<AmbTrack file="amb_city_day.wav" from={xs('s3a')} to={en('s3b')} vol={0.55} />
		<AmbTrack file="amb_neighborhood.wav" from={xs('s4a')} to={en('s4c')} vol={0.32} />
		<AmbTrack file="amb_evening.wav" from={xs('s4a')} to={en('s4c')} vol={0.3} />
		<AmbTrack file="amb_office.wav" from={xs('s5a')} to={en('s5b')} vol={0.5} />
		<AmbTrack file="amb_night_street.wav" from={st('s5c')} to={en('s5d')} vol={0.55} />
		<AmbTrack file="amb_room_night.wav" from={xs('s6a')} to={en('s6e')} vol={0.55} />
		<AmbTrack file="amb_evening.wav" from={xs('s7a')} to={en('s7c')} vol={0.6} />
		<AmbTrack file="amb_morning.wav" from={xs('s8a')} to={en('s8c')} vol={0.22} fadeIn={30} />
		<AmbTrack file="amb_morning.wav" from={xs('s9')} to={s(75)} vol={0.55} fadeIn={20} fadeOut={40} />
		{/* foley */}
		<Sfx file="typing_slow.wav" at={0} vol={0.32} />
		<Sfx file="typing_slow.wav" at={st('s1') + 165} vol={0.22} />
		<Sfx file="sigh.wav" at={st('s1') + 150} vol={0.5} />
		<Sfx file="frame.wav" at={xs('s2a') + 6} vol={0.5} />
		{steps('s2c', 1.0, 0.33, 0, 0.32)}
		{steps('s3a', 1.05, 0.34, 0, 0.3)}
		{steps('s3b', 1.0, 0.33, 1.3, 0.3)}
		<Sfx file="broom.wav" at={xs('s4a') + 20} vol={0.25} />
		<Sfx file="broom.wav" at={xs('s4a') + 70} vol={0.25} />
		<Sfx file="broom.wav" at={st('s4b') + 30} vol={0.18} />
		<Sfx file="typing_fast.wav" at={xs('s5a')} vol={0.42} />
		<Sfx file="zipper.wav" at={st('s5b') + 2} vol={0.55} />
		<Sfx file="paper.wav" at={st('s5b') + 30} vol={0.35} />
		{steps('s5c', 0.9, 0.3, 0.5, 0.32)}
		<Sfx file="bus.wav" at={st('s5d')} vol={0.35} />
		<Sfx file="typing_slow.wav" at={xs('s6a')} vol={0.4} />
		<Sfx file="typing_fast.wav" at={st('s6c')} vol={0.38} />
		<Sfx file="sigh.wav" at={st('s6d') + 40} vol={0.6} />
		<Sfx file="laptop_close.wav" at={st('s6e') + 50} vol={0.65} />
		{steps('s7a', 0.95, 0.32, 0, 0.28)}
		{steps('s7c', 0.9, 0.32, 0.3, 0.24, 14)}
		<Sfx file="rooster.wav" at={xs('s8a') + 8} vol={0.25} />
		<Sfx file="swell.wav" at={st('s8a') - 20} vol={0.35} />
		<Sfx file="mug.wav" at={st('s8b') + 2} vol={0.45} />
		<Sfx file="paper.wav" at={st('s8b') + 6} vol={0.3} />
		<Sfx file="laptop_open.wav" at={st('s8b') + 14} vol={0.6} />
		<Sfx file="typing_slow.wav" at={st('s8c')} vol={0.35} />
		{steps('s9', 1.12, 0.37, 0.2, 0.3)}
	</>
);

export const Video: React.FC = () => {
	const ids = Object.keys(SHOTS) as ShotId[];
	return (
		<AbsoluteFill style={{background: '#000'}}>
			{ids.map((id) => {
				const xf = XF[id] ?? 0;
				const from = st(id) - xf;
				const len = en(id) - from;
				return (
					<Sequence key={id} from={from} durationInFrames={len} name={id}>
						<Shot id={id} xf={xf} len={len} />
					</Sequence>
				);
			})}
			<Sequence from={s(71.0)} durationInFrames={TOTAL_FRAMES - s(71.0)} name="title">
				<Title />
			</Sequence>
			<Subtitles />
			<Fade />
			<AudioMix />
		</AbsoluteFill>
	);
};
