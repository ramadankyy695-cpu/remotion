import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {CAPTIONS} from './captions';

const ACCENT = '#FFC64B';

export const Subtitles: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;
	let idx = -1;
	for (let i = 0; i < CAPTIONS.length; i++) {
		const c = CAPTIONS[i];
		const start = c[0].s - 0.12;
		const nextStart = i + 1 < CAPTIONS.length ? CAPTIONS[i + 1][0].s - 0.12 : Infinity;
		const end = Math.min(nextStart, c[c.length - 1].e + 0.7);
		if (t >= start && t < end) {
			idx = i;
			break;
		}
	}
	if (idx < 0) return null;
	const chunk = CAPTIONS[idx];
	const startF = Math.round((chunk[0].s - 0.12) * fps);
	const enter = spring({frame: frame - startF, fps, config: {damping: 16, stiffness: 180, mass: 0.6}});
	const endT = chunk[chunk.length - 1].e + 0.7;
	const nextStart = idx + 1 < CAPTIONS.length ? CAPTIONS[idx + 1][0].s - 0.12 : Infinity;
	const exit = nextStart > endT ? interpolate(t, [endT - 0.2, endT], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 1;
	return (
		<AbsoluteFill style={{justifyContent: 'flex-start', alignItems: 'center', pointerEvents: 'none'}}>
			<div
				style={{
					position: 'absolute',
					top: 1290,
					width: 940,
					display: 'flex',
					flexWrap: 'wrap',
					justifyContent: 'center',
					gap: '4px 26px',
					opacity: enter * exit,
					transform: `translateY(${(1 - enter) * 26}px) scale(${0.94 + 0.06 * enter})`,
				}}
			>
				{chunk.map((w, i) => {
					const spoken = t >= w.s - 0.04;
					const active = t >= w.s - 0.04 && t < w.e + 0.05;
					const pop = spring({frame: frame - Math.round((w.s - 0.04) * fps), fps, config: {damping: 12, stiffness: 260, mass: 0.5}});
					const lift = w.hl ? (1 - Math.min(1, pop)) * 14 : 0;
					const scale = active && !w.hl ? 1.02 : 1;
					return (
						<span
							key={i}
							style={{
								fontFamily: 'MontserratX',
								fontWeight: 800,
								fontSize: w.hl ? 74 : 68,
								lineHeight: 1.12,
								letterSpacing: -0.5,
								color: w.hl && spoken ? ACCENT : '#ffffff',
								opacity: spoken ? 1 : 0.55,
								transform: `translateY(${spoken ? lift : 0}px) scale(${spoken ? scale : 1})`,
								margin: w.hl ? '0 4px' : 0,
								display: 'inline-block',
								WebkitTextStroke: '9px rgba(8,10,14,0.92)',
								paintOrder: 'stroke fill',
								textShadow: w.hl && spoken
									? '0 0 26px rgba(255,170,40,0.55), 0 6px 18px rgba(0,0,0,0.65)'
									: '0 6px 18px rgba(0,0,0,0.65)',
							}}
						>
							{w.t}
						</span>
					);
				})}
			</div>
		</AbsoluteFill>
	);
};
