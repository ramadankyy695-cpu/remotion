import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {seg} from './lib/anim';
import {ShotView} from './Shots';
import {CAPTIONS, FPS, SHOTS} from './timeline';

const World = () => {
	const frame = useCurrentFrame();
	const shot = SHOTS.find((s) => frame >= s.from && frame < s.to) ?? SHOTS[SHOTS.length - 1];
	return <ShotView id={shot.id} lf={frame - shot.from} len={shot.to - shot.from} />;
};

const CaptionLayer = () => {
	const frame = useCurrentFrame();
	const t = frame / FPS;
	const cap = CAPTIONS.find((c) => t >= c.start && t < c.end);
	if (!cap) return null;
	const k = Math.min(1, (t - cap.start) / 0.12);
	const scale = 0.86 + 0.14 * k + Math.sin(k * Math.PI) * 0.05;
	const parts = cap.hot ? cap.text.split(cap.hot) : [cap.text];
	return (
		<AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 470}}>
			<div
				style={{
					maxWidth: 900,
					textAlign: 'center',
					fontFamily: 'Inter',
					fontWeight: 900,
					fontSize: 74,
					lineHeight: 1.12,
					color: '#ffffff',
					textShadow: [
						...Array.from({length: 16}, (_, i) => {
							const a = (i / 16) * Math.PI * 2;
							return `${(Math.cos(a) * 7).toFixed(1)}px ${(Math.sin(a) * 7).toFixed(1)}px 0 #0d0d16`;
						}),
						'0 10px 20px rgba(0,0,0,0.6)',
					].join(', '),
					transform: `scale(${scale})`,
					opacity: k,
				}}
			>
				{parts.length === 2 ? (
					<>
						{parts[0]}
						<span style={{color: '#ffd23f'}}>{cap.hot}</span>
						{parts[1]}
					</>
				) : (
					cap.text
				)}
			</div>
		</AbsoluteFill>
	);
};

const FxLayer = () => {
	const f = useCurrentFrame();
	// fade through black between the vow (sh10) and the bedroom (sh11); final fade out
	const black = Math.max(
		f < 831 ? seg(f, 817, 831) : 1 - seg(f, 831, 846),
		seg(f, 1190, 1202),
		f < 4 ? 1 - f / 4 : 0,
	);
	// golden flash when the chest opens
	const gold = interpolate(f, [282, 288, 304], [0, 0.35, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	// white hit when the door slams
	const hit = interpolate(f, [636, 638, 650], [0, 0.28, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	// whoosh flash on the snap zoom
	const snap = interpolate(f, [438, 440, 448], [0, 0.18, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	return (
		<>
			<AbsoluteFill
				style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)'}}
			/>
			<AbsoluteFill style={{background: '#ffc94a', opacity: gold, mixBlendMode: 'screen'}} />
			<AbsoluteFill style={{background: '#ffffff', opacity: hit + snap}} />
			<AbsoluteFill style={{background: '#000', opacity: Math.min(1, black)}} />
		</>
	);
};

export const SahabatHarta = () => {
	const {width, height} = useVideoConfig();
	return (
		<AbsoluteFill style={{backgroundColor: '#000'}}>
			<ThreeCanvas width={width} height={height} flat gl={{antialias: true, powerPreference: 'high-performance'}}>
				<World />
			</ThreeCanvas>
			<FxLayer />
			<CaptionLayer />
			<Audio src={staticFile('audio/vo.wav')} volume={1} />
			<Audio src={staticFile('audio/music.wav')} volume={0.32} />
			<Audio src={staticFile('audio/ambience.wav')} volume={0.45} />
			<Audio src={staticFile('audio/sfx.wav')} volume={0.7} />
		</AbsoluteFill>
	);
};
