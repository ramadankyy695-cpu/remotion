import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import words from './words.json';

type Word = {text: string; start: number; end: number};

// Words that get a selective accent highlight.
const KEY = new Set(
	[
		'waktu?',
		'nanti',
		'Nanti',
		'bahagiain',
		'rumah',
		'sendiri.',
		'kekhawatiran.',
		'berlalu,',
		'kesiapan',
		'bertambah.',
		'hilang.',
		'mimpi',
		'rencana.',
		'berusaha.',
		'bertahan',
		'dijalani.',
		'lelah,',
		'lagi.',
		'takut',
		'mana-mana.',
		'berhasil.',
		'sayangi.',
		'sampai,',
		'berarti.',
		'cerita',
		'selesai.',
	],
);

type Chunk = {words: Word[]; start: number; end: number};

const chunks: Chunk[] = (() => {
	const out: Chunk[] = [];
	let cur: Word[] = [];
	const flush = () => {
		if (cur.length) out.push({words: cur, start: cur[0].start, end: cur[cur.length - 1].end});
		cur = [];
	};
	(words as Word[]).forEach((w, i) => {
		const prev = (words as Word[])[i - 1];
		const len = cur.reduce((a, c) => a + c.text.length + 1, 0);
		const gap = prev ? w.start - prev.end : 0;
		if (cur.length && (cur.length >= 4 || len + w.text.length > 24 || /[,.?]$/.test(prev.text) || gap > 0.3)) {
			flush();
		}
		cur.push(w);
	});
	flush();
	// Keep each chunk on screen until shortly before the next one (but not through long pauses).
	for (let i = 0; i < out.length; i++) {
		const next = out[i + 1];
		const hold = next ? Math.min(next.start - 0.04, out[i].end + 0.6) : out[i].end + 0.8;
		out[i].end = Math.max(out[i].end + 0.15, hold);
		if (next && out[i].end > next.start - 0.04) out[i].end = next.start - 0.04;
	}
	return out;
})();

export const Subtitles: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;
	const c = chunks.find((k) => t >= k.start - 0.08 && t <= k.end);
	if (!c) return null;
	const inP = interpolate(t, [c.start - 0.08, c.start + 0.12], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const outP = interpolate(t, [c.end - 0.12, c.end], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	return (
		<AbsoluteFill style={{justifyContent: 'flex-start', alignItems: 'center'}}>
			<div
				style={{
					position: 'absolute',
					top: 1290,
					width: 900,
					left: 90,
					display: 'flex',
					flexWrap: 'wrap',
					justifyContent: 'center',
					gap: '0 20px',
					opacity: inP * outP,
					transform: `translateY(${(1 - inP) * 14}px)`,
				}}
			>
				{c.words.map((w, i) => {
					const local = (t - w.start) * fps;
					const pop = spring({frame: local, fps, config: {damping: 14, mass: 0.5, stiffness: 180}});
					const spoken = t >= w.start - 0.03;
					const key = KEY.has(w.text);
					return (
						<span
							key={i}
							style={{
								fontFamily: 'Plus Jakarta Sans',
								fontWeight: 800,
								fontSize: 66,
								lineHeight: 1.22,
								letterSpacing: -0.5,
								color: key && spoken ? '#FFC65C' : '#FFFFFF',
								opacity: spoken ? 1 : 0.38,
								transform: `scale(${spoken ? 0.92 + pop * 0.08 : 0.92})`,
								display: 'inline-block',
								WebkitTextStroke: '9px rgba(10,10,14,0.85)',
								paintOrder: 'stroke fill',
								textShadow: '0 6px 18px rgba(0,0,0,0.55), 0 2px 4px rgba(0,0,0,0.6)',
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

export const allCaptionText = () => (words as Word[]).map((w) => w.text).join(' ');
