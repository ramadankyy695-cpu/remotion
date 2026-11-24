import React, {useMemo} from 'react';
import {
	AbsoluteFill,
	interpolate,
	spring,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
import captions from './captions.json';

type Word = {
	text: string;
	startMs: number;
	endMs: number;
	highlight: boolean;
	phrase: number;
};

const MAX_CHARS = 24;
const MAX_WORDS = 4;

/** Group words into short chunks (max 2 lines) that never cross a phrase. */
const toChunks = (words: Word[]) => {
	const chunks: Word[][] = [];
	let cur: Word[] = [];
	const len = (ws: Word[]) => ws.reduce((a, w) => a + w.text.length + 1, 0);
	for (const w of words) {
		const prev = cur[cur.length - 1];
		const breakHere =
			cur.length > 0 &&
			(prev.phrase !== w.phrase ||
				cur.length >= MAX_WORDS ||
				len(cur) + w.text.length > MAX_CHARS ||
				/[,.:?]$/.test(prev.text));
		if (breakHere) {
			chunks.push(cur);
			cur = [];
		}

		cur.push(w);
	}

	if (cur.length) {
		chunks.push(cur);
	}

	return chunks;
};

export const Subtitles: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const ms = (frame / fps) * 1000;
	const chunks = useMemo(() => toChunks(captions as Word[]), []);
	const idx = chunks.findIndex((c, i) => {
		const next = chunks[i + 1];
		const end = next
			? Math.min(next[0].startMs, c[c.length - 1].endMs + 600)
			: c[c.length - 1].endMs + 700;
		return ms >= c[0].startMs - 60 && ms < end;
	});
	if (idx === -1) {
		return null;
	}

	const chunk = chunks[idx];
	const chunkStartF = ((chunk[0].startMs - 60) / 1000) * fps;
	const next = chunks[idx + 1];
	const chunkEndMs = next
		? Math.min(next[0].startMs, chunk[chunk.length - 1].endMs + 600)
		: chunk[chunk.length - 1].endMs + 700;
	const outF = (chunkEndMs / 1000) * fps;
	const exit = interpolate(frame, [outF - 5, outF], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const enter = spring({
		frame: frame - chunkStartF,
		fps,
		config: {damping: 200},
		durationInFrames: 8,
	});
	return (
		<AbsoluteFill
			style={{
				justifyContent: 'flex-end',
				alignItems: 'center',
				paddingBottom: 470,
				pointerEvents: 'none',
			}}
		>
			<div
				style={{
					display: 'flex',
					flexWrap: 'wrap',
					justifyContent: 'center',
					maxWidth: 860,
					gap: '6px 30px',
					opacity: exit * enter,
					transform: `translateY(${(1 - enter) * 20}px)`,
				}}
			>
				{chunk.map((w) => {
					const startF = (w.startMs / 1000) * fps;
					const endF = (w.endMs / 1000) * fps;
					const pop = spring({
						frame: frame - startF + 2,
						fps,
						config: {damping: 13, stiffness: 180, mass: 0.6},
					});
					const spoken = frame >= startF - 2;
					const active = frame >= startF - 2 && frame < endF + 2;
					const scale = spoken ? 0.82 + pop * 0.18 + (active ? 0.06 : 0) : 0.82;
					const color = w.highlight ? '#FFD400' : '#FFFFFF';
					return (
						<span
							key={`${w.startMs}-${w.text}`}
							style={{
								fontFamily: 'Inter, sans-serif',
								fontWeight: 900,
								fontSize: w.highlight ? 76 : 68,
								lineHeight: 1.12,
								letterSpacing: -0.5,
								color,
								opacity: spoken ? 1 : 0.38,
								transform: `scale(${scale}) translateY(${spoken ? (1 - pop) * 18 : 18}px) rotate(${w.highlight && spoken ? (1 - pop) * -6 : 0}deg)`,
								display: 'inline-block',
								WebkitTextStroke: '2px rgba(0,0,0,0.55)',
								paintOrder: 'stroke fill',
								textShadow: w.highlight
									? `0 0 ${18 + (active ? 14 : 0)}px rgba(255,200,0,0.55), 0 6px 18px rgba(0,0,0,0.85)`
									: '0 6px 18px rgba(0,0,0,0.85), 0 2px 4px rgba(0,0,0,0.9)',
							}}
						>
							{w.text}
						</span>
					);
				})}
			</div>
		</AbsoluteFill>
	);
};
