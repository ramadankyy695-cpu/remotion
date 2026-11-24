import * as THREE from 'three';

// All textures are drawn procedurally on canvas and cached per tab (deterministic).
const cache = new Map<string, THREE.Texture>();

const make = (
	key: string,
	w: number,
	h: number,
	draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
	srgb = true,
): THREE.Texture => {
	const hit = cache.get(key);
	if (hit) return hit;
	const c = document.createElement('canvas');
	c.width = w;
	c.height = h;
	const ctx = c.getContext('2d')!;
	draw(ctx, w, h);
	const t = new THREE.CanvasTexture(c);
	if (srgb) t.colorSpace = THREE.SRGBColorSpace;
	t.anisotropy = 4;
	t.needsUpdate = true;
	cache.set(key, t);
	return t;
};

const rr = (
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	w: number,
	h: number,
	r: number,
) => {
	ctx.beginPath();
	ctx.moveTo(x + r, y);
	ctx.arcTo(x + w, y, x + w, y + h, r);
	ctx.arcTo(x + w, y + h, x, y + h, r);
	ctx.arcTo(x, y + h, x, y, r);
	ctx.arcTo(x, y, x + w, y, r);
	ctx.closePath();
};

// ---------------------------------------------------------------- characters
export type Who = 'main' | 'friend';
export type View = 'front' | 'side';
export type Expr =
	| 'neutral'
	| 'happy'
	| 'joy'
	| 'amazed'
	| 'shocked'
	| 'guilty'
	| 'angry'
	| 'sad'
	| 'devastated'
	| 'determined';

export const PALETTE = {
	main: {
		skin: '#f6c995',
		skinDark: '#dba574',
		shirt: '#2f7fe6',
		shirtDark: '#1d58b3',
		shirtLight: '#6db0ff',
		pants: '#24346a',
		pantsDark: '#172247',
		shoe: '#1b1b22',
		hair: '#6a4126',
		hairDark: '#43281a',
	},
	friend: {
		skin: '#eab37f',
		skinDark: '#c98d5b',
		shirt: '#dd3434',
		shirtDark: '#a51f22',
		shirtLight: '#ff6b62',
		pants: '#2e2e36',
		pantsDark: '#1d1d22',
		shoe: '#111116',
		hair: '#1d1d24',
		hairDark: '#0b0b10',
	},
} as const;

const OUTLINE = '#13131d';

/** Cel-shaded rounded block with bold outline. `bands` = vertical color bands top->bottom [fraction, color, darkColor]. */
const block = (
	ctx: CanvasRenderingContext2D,
	w: number,
	h: number,
	radius: number,
	bands: [number, string, string][],
	shadeRight = 0.3,
) => {
	const lw = Math.max(6, Math.min(w, h) * 0.07);
	const x = lw / 2;
	const y = lw / 2;
	const bw = w - lw;
	const bh = h - lw;
	ctx.save();
	rr(ctx, x, y, bw, bh, radius);
	ctx.clip();
	let cy = y;
	for (const [frac, col, dark] of bands) {
		const hh = bh * frac;
		ctx.fillStyle = col;
		ctx.fillRect(x, cy, bw, hh + 1);
		ctx.fillStyle = dark;
		ctx.fillRect(x + bw * (1 - shadeRight), cy, bw * shadeRight, hh + 1);
		cy += hh;
	}
	// soft top highlight
	const g = ctx.createLinearGradient(0, y, 0, y + bh * 0.25);
	g.addColorStop(0, 'rgba(255,255,255,0.22)');
	g.addColorStop(1, 'rgba(255,255,255,0)');
	ctx.fillStyle = g;
	ctx.fillRect(x, y, bw * (1 - shadeRight), bh * 0.25);
	ctx.restore();
	rr(ctx, x, y, bw, bh, radius);
	ctx.lineWidth = lw;
	ctx.strokeStyle = OUTLINE;
	ctx.stroke();
};

const PX = 360; // pixels per world unit for body parts

export const SIZES = {
	front: {torsoW: 0.82, torsoH: 0.82, armW: 0.38, armH: 0.8, legW: 0.4, legH: 0.82, headW: 0.7, headH: 0.62},
	side: {torsoW: 0.46, torsoH: 0.82, armW: 0.34, armH: 0.8, legW: 0.38, legH: 0.82, headW: 0.64, headH: 0.62},
};

export const armTex = (who: Who) =>
	make(`arm|${who}`, Math.round(SIZES.front.armW * PX), Math.round(SIZES.front.armH * PX), (ctx, w, h) => {
		const p = PALETTE[who];
		block(ctx, w, h, w * 0.3, [
			[0.36, p.shirt, p.shirtDark],
			[0.64, p.skin, p.skinDark],
		]);
	});

export const legTex = (who: Who) =>
	make(`leg|${who}`, Math.round(SIZES.front.legW * PX), Math.round(SIZES.front.legH * PX), (ctx, w, h) => {
		const p = PALETTE[who];
		block(ctx, w, h, w * 0.22, [
			[0.83, p.pants, p.pantsDark],
			[0.17, p.shoe, '#000'],
		]);
	});

export const torsoTex = (who: Who, view: View) =>
	make(
		`torso|${who}|${view}`,
		Math.round(SIZES[view].torsoW * PX),
		Math.round(SIZES[view].torsoH * PX),
		(ctx, w, h) => {
			const p = PALETTE[who];
			block(ctx, w, h, w * 0.14, [
				[0.88, p.shirt, p.shirtDark],
				[0.12, p.pants, p.pantsDark],
			], 0.28);
			ctx.save();
			const lw = Math.min(w, h) * 0.07;
			ctx.beginPath();
			rr(ctx, lw, lw, w - lw * 2, h - lw * 2, w * 0.12);
			ctx.clip();
			if (who === 'main') {
				// light collar + chest stripe
				ctx.fillStyle = p.shirtLight;
				ctx.fillRect(0, h * 0.4, w, h * 0.1);
				if (view === 'front') {
					ctx.beginPath();
					ctx.moveTo(w * 0.34, 0);
					ctx.lineTo(w * 0.5, h * 0.17);
					ctx.lineTo(w * 0.66, 0);
					ctx.fillStyle = p.skin;
					ctx.fill();
					ctx.lineWidth = lw * 0.6;
					ctx.strokeStyle = p.shirtLight;
					ctx.stroke();
				}
			} else {
				// hoodie: hood rim, pocket, strings
				ctx.strokeStyle = p.shirtDark;
				ctx.lineWidth = lw * 0.9;
				if (view === 'front') {
					ctx.beginPath();
					ctx.ellipse(w * 0.5, 0, w * 0.32, h * 0.16, 0, 0, Math.PI);
					ctx.stroke();
					ctx.strokeStyle = '#f4f4f4';
					ctx.lineWidth = lw * 0.4;
					ctx.beginPath();
					ctx.moveTo(w * 0.42, h * 0.14);
					ctx.lineTo(w * 0.41, h * 0.36);
					ctx.moveTo(w * 0.58, h * 0.14);
					ctx.lineTo(w * 0.59, h * 0.36);
					ctx.stroke();
					ctx.strokeStyle = p.shirtDark;
					ctx.lineWidth = lw * 0.7;
					rr(ctx, w * 0.24, h * 0.56, w * 0.52, h * 0.24, w * 0.06);
					ctx.stroke();
				} else {
					ctx.beginPath();
					ctx.moveTo(w * 0.15, 0);
					ctx.quadraticCurveTo(w * 0.1, h * 0.2, w * 0.35, h * 0.24);
					ctx.stroke();
					rr(ctx, w * 0.5, h * 0.56, w * 0.42, h * 0.22, w * 0.06);
					ctx.stroke();
				}
			}
			ctx.restore();
			// redraw outline on top of details
			rr(ctx, lw / 2, lw / 2, w - lw, h - lw, w * 0.14);
			ctx.lineWidth = lw;
			ctx.strokeStyle = OUTLINE;
			ctx.stroke();
		},
	);

type FaceOpts = {expr: Expr; blink: boolean; mouth: 0 | 1 | 2; look: -1 | 0 | 1};

const drawEye = (
	ctx: CanvasRenderingContext2D,
	cx: number,
	cy: number,
	rx: number,
	ry: number,
	o: FaceOpts,
	side: number, // -1 left eye, +1 right eye
) => {
	ctx.fillStyle = OUTLINE;
	ctx.strokeStyle = OUTLINE;
	if (o.blink) {
		ctx.lineWidth = ry * 0.35;
		ctx.lineCap = 'round';
		ctx.beginPath();
		ctx.moveTo(cx - rx, cy);
		ctx.quadraticCurveTo(cx, cy + ry * 0.4, cx + rx, cy);
		ctx.stroke();
		return;
	}
	if (o.expr === 'joy') {
		ctx.lineWidth = ry * 0.4;
		ctx.lineCap = 'round';
		ctx.beginPath();
		ctx.moveTo(cx - rx, cy + ry * 0.3);
		ctx.quadraticCurveTo(cx, cy - ry * 0.9, cx + rx, cy + ry * 0.3);
		ctx.stroke();
		return;
	}
	let sx = 1;
	let sy = 1;
	if (o.expr === 'shocked' || o.expr === 'amazed') {
		sx = 1.15;
		sy = 1.2;
	}
	if (o.expr === 'angry' || o.expr === 'determined') sy = 0.8;
	if (o.expr === 'devastated') {
		sx = 1.1;
		sy = 1.1;
	}
	if (o.expr === 'shocked') {
		// white sclera with small pupils
		ctx.fillStyle = '#ffffff';
		ctx.beginPath();
		ctx.ellipse(cx, cy, rx * 1.35, ry * 1.25, 0, 0, Math.PI * 2);
		ctx.fill();
		ctx.lineWidth = rx * 0.28;
		ctx.stroke();
		ctx.fillStyle = OUTLINE;
		ctx.beginPath();
		ctx.ellipse(cx, cy, rx * 0.42, ry * 0.42, 0, 0, Math.PI * 2);
		ctx.fill();
		return;
	}
	ctx.beginPath();
	ctx.ellipse(cx + o.look * rx * 0.25, cy, rx * sx, ry * sy, 0, 0, Math.PI * 2);
	ctx.fill();
	// highlight
	ctx.fillStyle = '#ffffff';
	ctx.beginPath();
	ctx.ellipse(cx + o.look * rx * 0.25 - rx * 0.32, cy - ry * 0.38, rx * 0.34, ry * 0.28, 0, 0, Math.PI * 2);
	ctx.fill();
	if (o.expr === 'devastated' || o.expr === 'sad') {
		// watery lower lid shine
		ctx.fillStyle = 'rgba(160,210,255,0.85)';
		ctx.beginPath();
		ctx.ellipse(cx, cy + ry * sy * 0.78, rx * sx * 0.95, ry * 0.28, 0, 0, Math.PI);
		ctx.fill();
	}
	// angry lid cut
	if (o.expr === 'angry' || o.expr === 'determined') {
		ctx.fillStyle = 'rgba(0,0,0,0)';
	}
	void side;
};

const drawBrow = (
	ctx: CanvasRenderingContext2D,
	cx: number,
	cy: number,
	len: number,
	expr: Expr,
	side: number,
	thick: number,
) => {
	// angle > 0 lifts the inner end (sad); < 0 lowers inner end (angry)
	const cfg: Record<Expr, [number, number]> = {
		neutral: [0, 0],
		happy: [0.05, -0.15],
		joy: [0.05, -0.2],
		amazed: [0.05, -0.45],
		shocked: [0.15, -0.6],
		guilty: [0.35, -0.05],
		angry: [-0.5, 0.1],
		sad: [0.45, 0],
		devastated: [0.6, -0.1],
		determined: [-0.3, 0.05],
	};
	const [ang, lift] = cfg[expr];
	const y = cy + lift * len;
	const inner = cx - side * len * 0.5; // inner end is toward face center
	const outer = cx + side * len * 0.5;
	ctx.strokeStyle = OUTLINE;
	ctx.lineWidth = thick;
	ctx.lineCap = 'round';
	ctx.beginPath();
	ctx.moveTo(inner, y - ang * len * 0.5);
	ctx.lineTo(outer, y + ang * len * 0.5);
	ctx.stroke();
};

const drawMouth = (
	ctx: CanvasRenderingContext2D,
	cx: number,
	cy: number,
	mw: number,
	o: FaceOpts,
) => {
	ctx.strokeStyle = OUTLINE;
	ctx.fillStyle = OUTLINE;
	ctx.lineWidth = mw * 0.14;
	ctx.lineCap = 'round';
	ctx.lineJoin = 'round';
	const open = o.mouth;
	const e = o.expr;
	const openMouth = (wf: number, hf: number, smile: boolean) => {
		ctx.beginPath();
		if (smile) {
			ctx.moveTo(cx - mw * wf, cy - mw * 0.05);
			ctx.lineTo(cx + mw * wf, cy - mw * 0.05);
			ctx.quadraticCurveTo(cx + mw * wf, cy + mw * hf * 1.6, cx, cy + mw * hf * 1.5);
			ctx.quadraticCurveTo(cx - mw * wf, cy + mw * hf * 1.6, cx - mw * wf, cy - mw * 0.05);
		} else {
			ctx.ellipse(cx, cy + mw * hf * 0.5, mw * wf, mw * hf, 0, 0, Math.PI * 2);
		}
		ctx.fillStyle = '#3b0d12';
		ctx.fill();
		ctx.stroke();
		// tongue
		ctx.save();
		ctx.clip();
		ctx.fillStyle = '#e8606c';
		ctx.beginPath();
		ctx.ellipse(cx, cy + mw * hf * (smile ? 1.3 : 1.2), mw * wf * 0.7, mw * hf * 0.55, 0, 0, Math.PI * 2);
		ctx.fill();
		ctx.restore();
	};
	if (e === 'shocked') return openMouth(0.32, 0.42, false);
	if (e === 'amazed') return openMouth(0.3, open ? 0.34 : 0.26, false);
	if (e === 'happy' || e === 'joy') {
		if (open) return openMouth(0.5, open === 2 ? 0.34 : 0.22, true);
		ctx.beginPath();
		ctx.moveTo(cx - mw * 0.5, cy);
		ctx.quadraticCurveTo(cx, cy + mw * 0.55, cx + mw * 0.5, cy);
		ctx.stroke();
		return;
	}
	if (e === 'angry' || e === 'determined') {
		// gritted teeth
		ctx.beginPath();
		rr(ctx, cx - mw * 0.42, cy - mw * 0.08, mw * 0.84, mw * 0.3, mw * 0.08);
		ctx.fillStyle = '#ffffff';
		ctx.fill();
		ctx.stroke();
		ctx.lineWidth = mw * 0.06;
		ctx.beginPath();
		ctx.moveTo(cx - mw * 0.42, cy + mw * 0.07);
		ctx.lineTo(cx + mw * 0.42, cy + mw * 0.07);
		ctx.stroke();
		return;
	}
	if (e === 'sad' || e === 'devastated') {
		if (open) return openMouth(0.3, 0.18, false);
		ctx.beginPath();
		ctx.moveTo(cx - mw * 0.4, cy + mw * 0.22);
		ctx.quadraticCurveTo(cx - mw * 0.2, cy - mw * 0.05, cx, cy + mw * 0.02);
		ctx.quadraticCurveTo(cx + mw * 0.2, cy - mw * 0.08, cx + mw * 0.4, cy + mw * 0.22);
		ctx.stroke();
		return;
	}
	if (e === 'guilty') {
		ctx.beginPath();
		ctx.moveTo(cx - mw * 0.35, cy + mw * 0.08);
		ctx.quadraticCurveTo(cx - mw * 0.1, cy - mw * 0.06, cx + mw * 0.05, cy + mw * 0.06);
		ctx.quadraticCurveTo(cx + mw * 0.2, cy + mw * 0.14, cx + mw * 0.35, cy + mw * 0.02);
		ctx.stroke();
		return;
	}
	// neutral
	if (open) return openMouth(0.3, open === 2 ? 0.24 : 0.14, false);
	ctx.beginPath();
	ctx.moveTo(cx - mw * 0.32, cy + mw * 0.05);
	ctx.quadraticCurveTo(cx, cy + mw * 0.15, cx + mw * 0.32, cy + mw * 0.05);
	ctx.stroke();
};

const HPX = 760; // head pixels per unit (sharp close-ups)

export const headTex = (who: Who, view: View, o: FaceOpts) =>
	make(
		`head|${who}|${view}|${o.expr}|${o.blink ? 1 : 0}|${o.mouth}|${o.look}`,
		Math.round(SIZES[view].headW * HPX),
		Math.round(SIZES[view].headH * HPX),
		(ctx, w, h) => {
			const p = PALETTE[who];
			const lw = Math.min(w, h) * 0.055;
			const R = w * 0.22;
			ctx.save();
			rr(ctx, lw / 2, lw / 2, w - lw, h - lw, R);
			ctx.clip();
			ctx.fillStyle = p.skin;
			ctx.fillRect(0, 0, w, h);
			ctx.fillStyle = p.skinDark;
			ctx.fillRect(w * 0.8, 0, w * 0.2, h);
			// hair
			ctx.fillStyle = p.hair;
			if (view === 'front') {
				ctx.beginPath();
				if (who === 'main') {
					ctx.moveTo(0, 0);
					ctx.lineTo(w, 0);
					ctx.lineTo(w, h * 0.34);
					ctx.quadraticCurveTo(w * 0.8, h * 0.22, w * 0.62, h * 0.3);
					ctx.quadraticCurveTo(w * 0.42, h * 0.38, w * 0.3, h * 0.26);
					ctx.quadraticCurveTo(w * 0.16, h * 0.34, 0, h * 0.4);
				} else {
					ctx.moveTo(0, 0);
					ctx.lineTo(w, 0);
					ctx.lineTo(w, h * 0.36);
					const spikes = 6;
					for (let i = spikes; i >= 0; i--) {
						const x = (w * i) / spikes;
						const y = i % 2 === 0 ? h * 0.22 : h * 0.33;
						ctx.lineTo(x, y);
					}
					ctx.lineTo(0, h * 0.38);
				}
				ctx.closePath();
				ctx.fill();
				ctx.fillStyle = p.hairDark;
				ctx.fillRect(w * 0.8, 0, w * 0.2, h * 0.3);
			} else {
				ctx.beginPath();
				ctx.moveTo(0, 0);
				ctx.lineTo(w, 0);
				ctx.lineTo(w, h * 0.22);
				if (who === 'main') {
					ctx.quadraticCurveTo(w * 0.7, h * 0.32, w * 0.5, h * 0.28);
				} else {
					ctx.lineTo(w * 0.82, h * 0.32);
					ctx.lineTo(w * 0.7, h * 0.24);
					ctx.lineTo(w * 0.56, h * 0.34);
				}
				ctx.lineTo(w * 0.42, h * 0.3);
				ctx.lineTo(w * 0.36, h * 0.72);
				ctx.lineTo(0, h * 0.8);
				ctx.closePath();
				ctx.fill();
				// ear
				ctx.fillStyle = p.skinDark;
				ctx.beginPath();
				ctx.ellipse(w * 0.46, h * 0.58, w * 0.06, h * 0.09, 0, 0, Math.PI * 2);
				ctx.fill();
			}
			ctx.restore();
			rr(ctx, lw / 2, lw / 2, w - lw, h - lw, R);
			ctx.lineWidth = lw;
			ctx.strokeStyle = OUTLINE;
			ctx.stroke();

			const ex = w * 0.085;
			const ey = h * 0.1;
			const thick = h * 0.035;
			if (view === 'front') {
				const eyeY = h * 0.58;
				drawEye(ctx, w * 0.33, eyeY, ex, ey, o, -1);
				drawEye(ctx, w * 0.67, eyeY, ex, ey, o, 1);
				drawBrow(ctx, w * 0.33, eyeY - ey * 1.9, w * 0.17, o.expr, -1, thick);
				drawBrow(ctx, w * 0.67, eyeY - ey * 1.9, w * 0.17, o.expr, 1, thick);
				if (o.expr === 'happy' || o.expr === 'joy') {
					ctx.fillStyle = 'rgba(255,110,120,0.35)';
					ctx.beginPath();
					ctx.ellipse(w * 0.2, h * 0.74, w * 0.07, h * 0.04, 0, 0, Math.PI * 2);
					ctx.ellipse(w * 0.8, h * 0.74, w * 0.07, h * 0.04, 0, 0, Math.PI * 2);
					ctx.fill();
				}
				drawMouth(ctx, w * 0.5, h * 0.8, w * 0.26, o);
				if (o.expr === 'guilty') {
					// sweat drop
					ctx.fillStyle = '#8fd3ff';
					ctx.strokeStyle = OUTLINE;
					ctx.lineWidth = lw * 0.4;
					ctx.beginPath();
					ctx.moveTo(w * 0.86, h * 0.36);
					ctx.quadraticCurveTo(w * 0.93, h * 0.48, w * 0.86, h * 0.5);
					ctx.quadraticCurveTo(w * 0.79, h * 0.48, w * 0.86, h * 0.36);
					ctx.fill();
					ctx.stroke();
				}
				if (o.expr === 'devastated') {
					ctx.fillStyle = 'rgba(140,200,255,0.7)';
					ctx.fillRect(w * 0.3, h * 0.66, w * 0.035, h * 0.3);
					ctx.fillRect(w * 0.64, h * 0.66, w * 0.035, h * 0.3);
				}
			} else {
				const eyeY = h * 0.56;
				drawEye(ctx, w * 0.72, eyeY, ex * 0.85, ey, {...o, look: 0}, 1);
				drawBrow(ctx, w * 0.72, eyeY - ey * 1.9, w * 0.15, o.expr, 1, thick);
				drawMouth(ctx, w * 0.82, h * 0.8, w * 0.2, o);
			}
		},
	);

// ---------------------------------------------------------------- fx
export const blobTex = () =>
	make('blob', 128, 128, (ctx, w, h) => {
		const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
		g.addColorStop(0, 'rgba(0,0,0,0.75)');
		g.addColorStop(0.55, 'rgba(0,0,0,0.35)');
		g.addColorStop(1, 'rgba(0,0,0,0)');
		ctx.fillStyle = g;
		ctx.fillRect(0, 0, w, h);
	});

export const glowTex = () =>
	make('glow', 128, 128, (ctx, w, h) => {
		const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
		g.addColorStop(0, 'rgba(255,255,255,1)');
		g.addColorStop(0.25, 'rgba(255,255,255,0.45)');
		g.addColorStop(1, 'rgba(255,255,255,0)');
		ctx.fillStyle = g;
		ctx.fillRect(0, 0, w, h);
	});

export const beamTex = () =>
	make('beam', 64, 256, (ctx, w, h) => {
		const g = ctx.createLinearGradient(0, 0, 0, h);
		g.addColorStop(0, 'rgba(255,255,255,0.9)');
		g.addColorStop(1, 'rgba(255,255,255,0)');
		ctx.fillStyle = g;
		ctx.fillRect(0, 0, w, h);
	});

export const nightSkyTex = () =>
	make('nightsky', 512, 512, (ctx, w, h) => {
		const g = ctx.createLinearGradient(0, 0, 0, h);
		g.addColorStop(0, '#0b1438');
		g.addColorStop(1, '#2a3f7a');
		ctx.fillStyle = g;
		ctx.fillRect(0, 0, w, h);
		let s = 11;
		const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
		ctx.fillStyle = '#ffffff';
		for (let i = 0; i < 70; i++) {
			const x = r() * w;
			const y = r() * h * 0.8;
			ctx.globalAlpha = 0.4 + r() * 0.6;
			ctx.fillRect(x, y, 3, 3);
		}
		ctx.globalAlpha = 1;
		const mg = ctx.createRadialGradient(w * 0.68, h * 0.28, 0, w * 0.68, h * 0.28, w * 0.3);
		mg.addColorStop(0, 'rgba(230,240,255,0.6)');
		mg.addColorStop(1, 'rgba(230,240,255,0)');
		ctx.fillStyle = mg;
		ctx.fillRect(0, 0, w, h);
		ctx.fillStyle = '#f2f5ff';
		ctx.beginPath();
		ctx.arc(w * 0.68, h * 0.28, w * 0.09, 0, Math.PI * 2);
		ctx.fill();
		// city silhouette blocks
		ctx.fillStyle = '#0a0f24';
		let x = 0;
		while (x < w) {
			const bw = 40 + r() * 60;
			const bh = h * (0.12 + r() * 0.2);
			ctx.fillRect(x, h - bh, bw - 6, bh);
			ctx.fillStyle = 'rgba(255,214,120,0.8)';
			for (let i = 0; i < 4; i++) ctx.fillRect(x + 8 + r() * (bw - 24), h - bh + 10 + r() * (bh - 20), 6, 8);
			ctx.fillStyle = '#0a0f24';
			x += bw;
		}
	});

export const posterTex = () =>
	make('poster', 256, 340, (ctx, w, h) => {
		ctx.fillStyle = '#f0e6d0';
		ctx.fillRect(0, 0, w, h);
		ctx.fillStyle = '#4f7cc8';
		ctx.fillRect(14, 14, w - 28, h * 0.6);
		ctx.fillStyle = '#2f4d86';
		ctx.beginPath();
		ctx.moveTo(14, h * 0.62);
		ctx.lineTo(w * 0.4, h * 0.25);
		ctx.lineTo(w * 0.62, h * 0.45);
		ctx.lineTo(w * 0.78, h * 0.32);
		ctx.lineTo(w - 14, h * 0.62);
		ctx.fill();
		ctx.fillStyle = '#ffcf4a';
		ctx.beginPath();
		ctx.arc(w * 0.75, h * 0.16, 20, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle = '#c0392b';
		ctx.fillRect(40, h * 0.72, w - 80, 22);
		ctx.fillStyle = '#7a6a55';
		ctx.fillRect(60, h * 0.83, w - 120, 12);
	});

export const woodTex = () => {
	const t = make('wood', 256, 256, (ctx, w, h) => {
		ctx.fillStyle = '#7a5538';
		ctx.fillRect(0, 0, w, h);
		for (let i = 0; i < 4; i++) {
			ctx.fillStyle = i % 2 ? '#6c4a30' : '#82603f';
			ctx.fillRect(0, (i * h) / 4, w, h / 4 - 3);
			ctx.fillStyle = '#4e3421';
			ctx.fillRect(0, ((i + 1) * h) / 4 - 3, w, 3);
			ctx.fillRect(((i * 97) % w), (i * h) / 4, 3, h / 4);
		}
	});
	t.wrapS = THREE.RepeatWrapping;
	t.wrapT = THREE.RepeatWrapping;
	t.repeat.set(3, 3);
	return t;
};

// ---------------------------------------------------------------- phone
export type PhoneMode = 'off' | 'notif' | 'chat';

export const phoneTex = (mode: PhoneMode, step: number, message: string) =>
	make(`phone|${mode}|${step}`, 540, 1080, (ctx, w, h) => {
		if (mode === 'off') {
			ctx.fillStyle = '#05060a';
			ctx.fillRect(0, 0, w, h);
			return;
		}
		if (mode === 'notif') {
			const g = ctx.createLinearGradient(0, 0, w, h);
			g.addColorStop(0, '#1d2f6e');
			g.addColorStop(1, '#6a2d6e');
			ctx.fillStyle = g;
			ctx.fillRect(0, 0, w, h);
			ctx.fillStyle = '#ffffff';
			ctx.textAlign = 'center';
			ctx.font = '700 150px Inter';
			ctx.fillText('21:47', w / 2, 300);
			ctx.font = '500 34px Inter';
			ctx.globalAlpha = 0.8;
			ctx.fillText('Tiga hari kemudian', w / 2, 360);
			ctx.globalAlpha = 1;
			// notification card (slides in with step 0..5)
			const k = Math.min(1, step / 5);
			const y = 430 + (1 - k) * -80;
			ctx.globalAlpha = k;
			ctx.fillStyle = 'rgba(255,255,255,0.92)';
			rr(ctx, 30, y, w - 60, 170, 34);
			ctx.fill();
			ctx.fillStyle = '#dd3434';
			ctx.beginPath();
			ctx.arc(100, y + 85, 46, 0, Math.PI * 2);
			ctx.fill();
			ctx.fillStyle = '#ffffff';
			ctx.font = '800 48px Inter';
			ctx.fillText('S', 100, y + 102);
			ctx.textAlign = 'left';
			ctx.fillStyle = '#111';
			ctx.font = '800 38px Inter';
			ctx.fillText('Sahabat', 168, y + 72);
			ctx.fillStyle = '#555';
			ctx.font = '500 32px Inter';
			ctx.fillText('1 pesan baru', 168, y + 120);
			ctx.globalAlpha = 1;
			return;
		}
		// chat
		ctx.fillStyle = '#ece5dd';
		ctx.fillRect(0, 0, w, h);
		ctx.fillStyle = '#1f6f5c';
		ctx.fillRect(0, 0, w, 150);
		ctx.fillStyle = '#dd3434';
		ctx.beginPath();
		ctx.arc(80, 90, 40, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle = '#fff';
		ctx.textAlign = 'center';
		ctx.font = '800 42px Inter';
		ctx.fillText('S', 80, 105);
		ctx.textAlign = 'left';
		ctx.font = '800 40px Inter';
		ctx.fillText('Sahabat', 140, 88);
		ctx.font = '500 26px Inter';
		ctx.globalAlpha = 0.85;
		ctx.fillText('online', 140, 124);
		ctx.globalAlpha = 1;
		// message bubble pops in with step 0..5
		const k = Math.min(1, step / 5);
		const s = 0.6 + 0.4 * k + (k < 1 ? 0.08 * Math.sin(k * Math.PI) : 0);
		ctx.save();
		ctx.translate(40, 260);
		ctx.scale(s, s);
		ctx.globalAlpha = k;
		ctx.font = '600 42px Inter';
		const words = message.split(' ');
		const lines: string[] = [];
		let line = '';
		const maxW = 400;
		for (const word of words) {
			const test = line ? `${line} ${word}` : word;
			if (ctx.measureText(test).width > maxW && line) {
				lines.push(line);
				line = word;
			} else line = test;
		}
		lines.push(line);
		const bh = lines.length * 56 + 70;
		ctx.fillStyle = '#ffffff';
		rr(ctx, 0, 0, maxW + 50, bh, 28);
		ctx.fill();
		ctx.fillStyle = '#111';
		lines.forEach((l, i) => ctx.fillText(l, 25, 62 + i * 56));
		ctx.fillStyle = '#888';
		ctx.font = '500 26px Inter';
		ctx.fillText('21:47', maxW - 40, bh - 18);
		ctx.restore();
	});
