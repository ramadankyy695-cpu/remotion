import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, continueRender, delayRender, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Scene1, Scene2} from './scenes/Bedroom';
import {Scene3} from './scenes/Flashback';
import {Scene4} from './scenes/Street';
import {Scene5a, Scene5b, Scene56} from './scenes/Social';
import {Scene7, Scene89} from './scenes/Window';
import {Subtitles} from './Subtitles';

export const TOTAL_FRAMES = 1575;

const FadeIn: React.FC<{frames: number; children: React.ReactNode}> = ({frames, children}) => {
	const f = useCurrentFrame();
	const o = frames <= 0 ? 1 : interpolate(f, [0, frames], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	return <AbsoluteFill style={{opacity: o}}>{children}</AbsoluteFill>;
};

// [from, duration, fadeInFrames, element]
const SHOTS: [number, number, number, React.ReactNode, string][] = [
	[0, 212, 0, <Scene1 />, 'S1 Kamar redup'],
	[198, 242, 14, <Scene2 />, 'S2 Pesan dihapus'],
	[430, 172, 6, <Scene3 />, 'S3 Kilas balik'],
	[588, 320, 14, <Scene4 />, 'S4 Tumbuh & keramaian'],
	[900, 54, 6, <Scene5a />, 'S5a Bercanda'],
	[950, 40, 4, <Scene5b />, 'S5b Bekerja'],
	[986, 172, 4, <Scene56 />, 'S6 Sendirian'],
	[1144, 160, 14, <Scene7 />, 'S7 Lo kenapa'],
	[1300, 116, 4, <Scene89 start={43.33} mode="close" />, 'S8 Ga apa-apa'],
	[1404, 171, 12, <Scene89 start={46.8} mode="wide" />, 'S9 Didengarkan'],
];

const Grain: React.FC = () => {
	const f = useCurrentFrame();
	return (
		<AbsoluteFill style={{mixBlendMode: 'overlay', opacity: 0.16, pointerEvents: 'none'}}>
			<svg width="1080" height="1920">
				<filter id="g">
					<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={f % 47} stitchTiles="stitch" />
					<feColorMatrix type="saturate" values="0" />
				</filter>
				<rect width="100%" height="100%" filter="url(#g)" />
			</svg>
		</AbsoluteFill>
	);
};

const Overlays: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / 30;
	// white flash into the flashback, soft flash out of it
	const flash = Math.max(
		interpolate(t, [14.05, 14.38, 14.75], [0, 0.95, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
		interpolate(t, [19.45, 19.62, 20.0], [0, 0.35, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
	);
	const black = Math.max(
		interpolate(t, [0, 0.6], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
		interpolate(t, [51.7, 52.45], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
		interpolate(t, [37.95, 38.15, 38.55], [0, 0.85, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
	);
	return (
		<>
			<AbsoluteFill style={{background: 'radial-gradient(ellipse 75% 60% at 50% 46%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)'}} />
			<Grain />
			<AbsoluteFill style={{backgroundColor: '#fff7ea', opacity: flash}} />
			<AbsoluteFill style={{backgroundColor: '#000', opacity: black}} />
		</>
	);
};

export const Video: React.FC = () => {
	const [handle] = useState(() => delayRender('font'));
	useEffect(() => {
		const faces = [
			new FontFace('MontserratX', `url(${staticFile('montserrat-800.woff2')})`, {weight: '800'}),
			new FontFace('MontserratX', `url(${staticFile('montserrat-900.woff2')})`, {weight: '900'}),
		];
		Promise.all(faces.map((ff) => ff.load()))
			.then((loaded) => {
				loaded.forEach((ff) => (document.fonts as unknown as {add: (f: FontFace) => void}).add(ff));
				continueRender(handle);
			})
			.catch(() => continueRender(handle));
	}, [handle]);
	return (
		<AbsoluteFill style={{backgroundColor: '#000'}}>
			{SHOTS.map(([from, dur, fade, el, name]) => (
				<Sequence key={name} from={from} durationInFrames={dur} name={name} premountFor={0}>
					<FadeIn frames={fade}>{el}</FadeIn>
				</Sequence>
			))}
			<Overlays />
			<Subtitles />
			<Audio src={staticFile('vo.wav')} volume={1} />
			<Audio src={staticFile('music.wav')} volume={1} />
			<Audio src={staticFile('sfx.wav')} volume={1} />
		</AbsoluteFill>
	);
};
