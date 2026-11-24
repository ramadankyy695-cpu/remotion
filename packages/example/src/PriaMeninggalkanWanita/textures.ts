import {random} from 'remotion';
import * as THREE from 'three';

const cache = new Map<string, THREE.Texture>();

const make = (
	key: string,
	w: number,
	h: number,
	draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
	repeat: [number, number] = [1, 1],
) => {
	const hit = cache.get(key);
	if (hit) {
		return hit;
	}

	const canvas = document.createElement('canvas');
	canvas.width = w;
	canvas.height = h;
	const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
	draw(ctx, w, h);
	const tex = new THREE.CanvasTexture(canvas);
	tex.colorSpace = THREE.SRGBColorSpace;
	tex.wrapS = THREE.RepeatWrapping;
	tex.wrapT = THREE.RepeatWrapping;
	tex.repeat.set(repeat[0], repeat[1]);
	tex.anisotropy = 4;
	cache.set(key, tex);
	return tex;
};

const noise = (
	ctx: CanvasRenderingContext2D,
	w: number,
	h: number,
	count: number,
	seed: string,
	color: (r: number) => string,
	size: number,
) => {
	for (let i = 0; i < count; i++) {
		const r = random(`${seed}${i}`);
		ctx.fillStyle = color(r);
		const s = size * (0.5 + random(`${seed}s${i}`));
		ctx.fillRect(random(`${seed}x${i}`) * w, random(`${seed}y${i}`) * h, s, s);
	}
};

export const plasterTexture = (tint: string) =>
	make(
		`plaster${tint}`,
		512,
		512,
		(ctx, w, h) => {
			ctx.fillStyle = tint;
			ctx.fillRect(0, 0, w, h);
			noise(
				ctx,
				w,
				h,
				9000,
				'pl',
				(r) =>
					`rgba(${r > 0.5 ? 255 : 0},${r > 0.5 ? 255 : 0},${r > 0.5 ? 255 : 0},0.035)`,
				3,
			);
			// damp stains near the bottom
			for (let i = 0; i < 6; i++) {
				const g = ctx.createRadialGradient(
					random(`st${i}`) * w,
					h,
					10,
					random(`st${i}`) * w,
					h,
					120 + random(`sr${i}`) * 140,
				);
				g.addColorStop(0, 'rgba(60,50,30,0.22)');
				g.addColorStop(1, 'rgba(60,50,30,0)');
				ctx.fillStyle = g;
				ctx.fillRect(0, 0, w, h);
			}
			// hairline cracks
			ctx.strokeStyle = 'rgba(40,35,30,0.25)';
			ctx.lineWidth = 1;
			for (let i = 0; i < 4; i++) {
				ctx.beginPath();
				let x = random(`cx${i}`) * w;
				let y = random(`cy${i}`) * h * 0.6;
				ctx.moveTo(x, y);
				for (let k = 0; k < 12; k++) {
					x += (random(`cxx${i}${k}`) - 0.5) * 30;
					y += random(`cyy${i}${k}`) * 18;
					ctx.lineTo(x, y);
				}

				ctx.stroke();
			}
		},
		[2, 1],
	);

export const tileTexture = () =>
	make(
		'tiles',
		512,
		512,
		(ctx, w, h) => {
			const n = 4;
			const s = w / n;
			for (let i = 0; i < n; i++) {
				for (let j = 0; j < n; j++) {
					const v = 200 + random(`t${i}${j}`) * 25;
					ctx.fillStyle = `rgb(${v},${v - 8},${v - 20})`;
					ctx.fillRect(i * s, j * s, s, s);
				}
			}

			noise(ctx, w, h, 6000, 'tl', () => 'rgba(90,80,60,0.05)', 2);
			ctx.strokeStyle = 'rgba(70,60,50,0.55)';
			ctx.lineWidth = 3;
			for (let i = 0; i <= n; i++) {
				ctx.beginPath();
				ctx.moveTo(i * s, 0);
				ctx.lineTo(i * s, h);
				ctx.moveTo(0, i * s);
				ctx.lineTo(w, i * s);
				ctx.stroke();
			}
		},
		[3, 3],
	);

export const woodTexture = (base = '#6b4a2f', key = 'wood') =>
	make(
		key,
		512,
		512,
		(ctx, w, h) => {
			ctx.fillStyle = base;
			ctx.fillRect(0, 0, w, h);
			for (let i = 0; i < 160; i++) {
				const y = random(`wy${key}${i}`) * h;
				ctx.strokeStyle = `rgba(${random(`wc${i}`) > 0.5 ? '30,18,8' : '140,100,60'},${0.08 + random(`wa${i}`) * 0.15})`;
				ctx.lineWidth = 1 + random(`wl${i}`) * 3;
				ctx.beginPath();
				ctx.moveTo(0, y);
				for (let x = 0; x <= w; x += 32) {
					ctx.lineTo(x, y + Math.sin(x / 60 + i) * 4);
				}

				ctx.stroke();
			}

			// plank seams
			ctx.fillStyle = 'rgba(20,10,5,0.6)';
			for (let i = 0; i < 4; i++) {
				ctx.fillRect(0, (i * h) / 4, w, 3);
			}
		},
		[1, 1],
	);

export const asphaltTexture = () =>
	make(
		'asphalt',
		1024,
		1024,
		(ctx, w, h) => {
			ctx.fillStyle = '#1b1d22';
			ctx.fillRect(0, 0, w, h);
			noise(
				ctx,
				w,
				h,
				60000,
				'as',
				(r) =>
					`rgba(${120 + r * 100},${120 + r * 100},${130 + r * 100},${0.05 + r * 0.08})`,
				2,
			);
			// puddles (darker, smoother)
			for (let i = 0; i < 9; i++) {
				const x = random(`px${i}`) * w;
				const y = random(`py${i}`) * h;
				const g = ctx.createRadialGradient(
					x,
					y,
					5,
					x,
					y,
					60 + random(`pr${i}`) * 120,
				);
				g.addColorStop(0, 'rgba(5,6,10,0.85)');
				g.addColorStop(1, 'rgba(5,6,10,0)');
				ctx.fillStyle = g;
				ctx.beginPath();
				ctx.ellipse(x, y, 200, 90, random(`pa${i}`) * 3, 0, Math.PI * 2);
				ctx.fill();
			}
		},
		[3, 6],
	);

/** Roughness map: puddles are mirror-like (dark = smooth). */
export const asphaltRoughness = () =>
	make(
		'asphaltRough',
		512,
		512,
		(ctx, w, h) => {
			ctx.fillStyle = '#8a8a8a';
			ctx.fillRect(0, 0, w, h);
			for (let i = 0; i < 9; i++) {
				const x = random(`px${i}`) * w;
				const y = random(`py${i}`) * h;
				const g = ctx.createRadialGradient(
					x,
					y,
					5,
					x,
					y,
					30 + random(`pr${i}`) * 60,
				);
				g.addColorStop(0, '#0d0d0d');
				g.addColorStop(1, 'rgba(13,13,13,0)');
				ctx.fillStyle = g;
				ctx.beginPath();
				ctx.ellipse(x, y, 100, 45, random(`pa${i}`) * 3, 0, Math.PI * 2);
				ctx.fill();
			}

			noise(
				ctx,
				w,
				h,
				20000,
				'ar',
				(r) => `rgba(${r * 255},${r * 255},${r * 255},0.15)`,
				2,
			);
		},
		[3, 6],
	);

export const buildingTexture = (seed: string, lit: number) =>
	make(`bld${seed}`, 256, 512, (ctx, w, h) => {
		const base = 25 + random(`bb${seed}`) * 20;
		ctx.fillStyle = `rgb(${base},${base + 2},${base + 8})`;
		ctx.fillRect(0, 0, w, h);
		const cols = 4;
		const rows = 10;
		for (let i = 0; i < cols; i++) {
			for (let j = 0; j < rows; j++) {
				const on = random(`${seed}${i}-${j}`) < lit;
				const warm = random(`${seed}w${i}-${j}`) > 0.35;
				ctx.fillStyle = on
					? warm
						? `rgba(255,${180 + random(`${seed}c${i}${j}`) * 50},110,0.9)`
						: 'rgba(170,210,255,0.85)'
					: 'rgba(10,12,18,0.9)';
				ctx.fillRect(18 + i * 58, 20 + j * 50, 34, 30);
			}
		}
	});

export const photoTexture = () =>
	make('couplePhoto', 400, 720, (ctx, w, h) => {
		// sunset beach selfie illustration
		const g = ctx.createLinearGradient(0, 0, 0, h);
		g.addColorStop(0, '#ffb36b');
		g.addColorStop(0.45, '#ff8a7a');
		g.addColorStop(0.62, '#7a5c9a');
		g.addColorStop(1, '#2e3a66');
		ctx.fillStyle = g;
		ctx.fillRect(0, 0, w, h);
		ctx.fillStyle = 'rgba(255,240,200,0.9)';
		ctx.beginPath();
		ctx.arc(w * 0.72, h * 0.4, 46, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle = 'rgba(30,30,60,0.6)';
		ctx.fillRect(0, h * 0.5, w, h * 0.5);
		const person = (cx: number, skin: string, shirt: string, long: boolean) => {
			if (long) {
				ctx.fillStyle = '#120c0a';
				ctx.beginPath();
				ctx.ellipse(cx, h * 0.62, 66, 110, 0, 0, Math.PI * 2);
				ctx.fill();
			}

			ctx.fillStyle = skin;
			ctx.fillRect(cx - 20, h * 0.6, 40, 60);
			ctx.fillStyle = shirt;
			ctx.beginPath();
			ctx.ellipse(cx, h * 0.86, 95, 120, 0, 0, Math.PI * 2);
			ctx.fill();

			ctx.fillStyle = skin;
			ctx.beginPath();
			ctx.ellipse(cx, h * 0.57, 52, 64, 0, 0, Math.PI * 2);
			ctx.fill();
			ctx.fillStyle = '#120c0a';
			ctx.beginPath();
			ctx.ellipse(cx, h * 0.52, 56, 42, 0, Math.PI, Math.PI * 2);
			ctx.fill();
			// eyes (closed happy arcs) + smile
			ctx.strokeStyle = '#2a1510';
			ctx.lineWidth = 4;
			ctx.beginPath();
			ctx.arc(cx - 18, h * 0.565, 8, Math.PI * 1.1, Math.PI * 1.9);
			ctx.stroke();
			ctx.beginPath();
			ctx.arc(cx + 18, h * 0.565, 8, Math.PI * 1.1, Math.PI * 1.9);
			ctx.stroke();
			ctx.beginPath();
			ctx.arc(cx, h * 0.59, 16, Math.PI * 0.15, Math.PI * 0.85);
			ctx.stroke();
			ctx.fillStyle = 'rgba(255,120,120,0.35)';
			ctx.beginPath();
			ctx.arc(cx - 30, h * 0.6, 9, 0, Math.PI * 2);
			ctx.arc(cx + 30, h * 0.6, 9, 0, Math.PI * 2);
			ctx.fill();
		};

		person(w * 0.33, '#b97c55', '#38465a', false);
		person(w * 0.67, '#c99271', '#b8705f', true);
		// heart
		ctx.fillStyle = '#ff4d6d';
		ctx.save();
		ctx.translate(w * 0.5, h * 0.33);
		ctx.scale(1.3, 1.3);
		ctx.beginPath();
		ctx.moveTo(0, 10);
		ctx.bezierCurveTo(-26, -8, -12, -28, 0, -14);
		ctx.bezierCurveTo(12, -28, 26, -8, 0, 10);
		ctx.fill();
		ctx.restore();
		// phone UI
		ctx.fillStyle = 'rgba(0,0,0,0.35)';
		ctx.fillRect(0, 0, w, 46);
		ctx.fillStyle = 'white';
		ctx.font = 'bold 22px Inter, sans-serif';
		ctx.fillText('21:47', 18, 31);
		ctx.fillText('Galeri', w - 90, 31);
	});

export const chatTexture = () =>
	make('chat', 400, 720, (ctx, w, h) => {
		ctx.fillStyle = '#0f1a1c';
		ctx.fillRect(0, 0, w, h);
		ctx.fillStyle = '#1f2c34';
		ctx.fillRect(0, 0, w, 96);
		ctx.fillStyle = '#c99271';
		ctx.beginPath();
		ctx.arc(52, 52, 28, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle = 'white';
		ctx.font = 'bold 28px Inter, sans-serif';
		ctx.fillText('Sayang', 96, 50);
		ctx.font = '19px Inter, sans-serif';
		ctx.fillStyle = '#9fb3bd';
		ctx.fillText('online', 96, 76);
		const bubble = (y: number, lines: string[], time: string) => {
			const bh = 24 + lines.length * 32;
			ctx.fillStyle = '#202c33';
			ctx.beginPath();
			ctx.roundRect(22, y, w - 90, bh, 18);
			ctx.fill();
			ctx.fillStyle = '#e9edef';
			ctx.font = '25px Inter, sans-serif';
			lines.forEach((l, i) => ctx.fillText(l, 40, y + 40 + i * 32));
			ctx.fillStyle = '#8696a0';
			ctx.font = '17px Inter, sans-serif';
			ctx.fillText(time, w - 140, y + bh - 10);
		};

		bubble(150, ['Kamu udah makan?'], '21:02');
		bubble(250, ['Aku nggak butuh apa-apa,', 'aku cuma butuh kamu.'], '21:03');
		bubble(390, ['Pulang hati-hati ya.'], '21:03');
		ctx.fillStyle = '#1f2c34';
		ctx.fillRect(0, h - 80, w, 80);
		ctx.fillStyle = '#2a3942';
		ctx.beginPath();
		ctx.roundRect(16, h - 64, w - 32, 48, 24);
		ctx.fill();
		ctx.fillStyle = '#8696a0';
		ctx.font = '22px Inter, sans-serif';
		ctx.fillText('Ketik pesan', 40, h - 32);
	});

export const signTexture = (text: string, sub: string) =>
	make(`sign${text}`, 1024, 256, (ctx, w, h) => {
		ctx.fillStyle = '#e7d9b4';
		ctx.fillRect(0, 0, w, h);
		ctx.fillStyle = '#b3261e';
		ctx.fillRect(0, 0, w, 26);
		ctx.fillRect(0, h - 26, w, 26);
		ctx.fillStyle = '#1e3a8a';
		ctx.font = '900 120px Inter, sans-serif';
		ctx.textAlign = 'center';
		ctx.fillText(text, w / 2, 150);
		ctx.font = '700 44px Inter, sans-serif';
		ctx.fillStyle = '#b3261e';
		ctx.fillText(sub, w / 2, 210);
		noise(ctx, w, h, 5000, 'sg', () => 'rgba(80,60,30,0.08)', 3);
	});

export const moneyTexture = (value: string, color: string) =>
	make(`money${value}`, 512, 240, (ctx, w, h) => {
		ctx.fillStyle = color;
		ctx.fillRect(0, 0, w, h);
		const g = ctx.createRadialGradient(w * 0.7, h / 2, 10, w * 0.7, h / 2, 160);
		g.addColorStop(0, 'rgba(255,255,255,0.35)');
		g.addColorStop(1, 'rgba(255,255,255,0)');
		ctx.fillStyle = g;
		ctx.fillRect(0, 0, w, h);
		ctx.strokeStyle = 'rgba(255,255,255,0.35)';
		ctx.lineWidth = 6;
		ctx.strokeRect(10, 10, w - 20, h - 20);
		for (let i = 0; i < 30; i++) {
			ctx.strokeStyle = 'rgba(0,0,0,0.08)';
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.arc(w * 0.3, h / 2, 20 + i * 5, 0, Math.PI * 2);
			ctx.stroke();
		}

		ctx.fillStyle = 'rgba(20,20,30,0.85)';
		ctx.font = '900 64px Inter, sans-serif';
		ctx.fillText(value, w - 30 - ctx.measureText(value).width, 80);
		ctx.font = '700 26px Inter, sans-serif';
		ctx.fillText('BANK INDONESIA', 30, 50);
		ctx.font = '700 30px Inter, sans-serif';
		ctx.fillText('RUPIAH', 30, h - 30);
	});

export const billTexture = (title: string, amount: string) =>
	make(`bill${title}`, 360, 512, (ctx, w, h) => {
		ctx.fillStyle = '#f2efe6';
		ctx.fillRect(0, 0, w, h);
		ctx.fillStyle = '#222';
		ctx.font = '800 34px Inter, sans-serif';
		ctx.fillText(title, 24, 60);
		ctx.font = '20px Inter, sans-serif';
		for (let i = 0; i < 9; i++) {
			ctx.fillStyle = 'rgba(0,0,0,0.25)';
			ctx.fillRect(24, 100 + i * 30, 180 + random(`bl${title}${i}`) * 120, 8);
		}

		ctx.fillStyle = '#111';
		ctx.font = '800 30px Inter, sans-serif';
		ctx.fillText('TOTAL', 24, 420);
		ctx.fillText(amount, 140, 420);
		ctx.save();
		ctx.translate(230, 360);
		ctx.rotate(-0.3);
		ctx.strokeStyle = '#c62828';
		ctx.lineWidth = 5;
		ctx.strokeRect(-90, -30, 190, 60);
		ctx.fillStyle = '#c62828';
		ctx.font = '900 26px Inter, sans-serif';
		ctx.fillText('JATUH TEMPO', -82, 10);
		ctx.restore();
	});

export const glowTexture = () =>
	make('glow', 256, 256, (ctx, w, h) => {
		const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
		g.addColorStop(0, 'rgba(255,255,255,1)');
		g.addColorStop(0.25, 'rgba(255,255,255,0.45)');
		g.addColorStop(1, 'rgba(255,255,255,0)');
		ctx.fillStyle = g;
		ctx.fillRect(0, 0, w, h);
	});

/** Vertical streak used to fake light reflections on wet asphalt. */
export const streakTexture = () =>
	make('streak', 128, 512, (ctx, w, h) => {
		const g = ctx.createLinearGradient(0, 0, 0, h);
		g.addColorStop(0, 'rgba(255,255,255,0)');
		g.addColorStop(0.15, 'rgba(255,255,255,0.9)');
		g.addColorStop(1, 'rgba(255,255,255,0)');
		ctx.fillStyle = g;
		ctx.fillRect(0, 0, w, h);
		const g2 = ctx.createLinearGradient(0, 0, w, 0);
		g2.addColorStop(0, 'rgba(0,0,0,1)');
		g2.addColorStop(0.5, 'rgba(0,0,0,0)');
		g2.addColorStop(1, 'rgba(0,0,0,1)');
		ctx.globalCompositeOperation = 'destination-out';
		ctx.fillStyle = g2;
		ctx.fillRect(0, 0, w, h);
		// broken by ripples
		for (let i = 0; i < 40; i++) {
			ctx.fillStyle = 'rgba(0,0,0,0.5)';
			ctx.fillRect(0, random(`sk${i}`) * h, w, 2 + random(`skh${i}`) * 5);
		}
	});

export const skyTexture = (morning: boolean) =>
	make(`sky${morning}`, 64, 512, (ctx, w, h) => {
		const g = ctx.createLinearGradient(0, 0, 0, h);
		if (morning) {
			g.addColorStop(0, '#8fc3ee');
			g.addColorStop(0.55, '#ffe2b0');
			g.addColorStop(1, '#ffc58a');
		} else {
			g.addColorStop(0, '#05070d');
			g.addColorStop(1, '#1a2233');
		}

		ctx.fillStyle = g;
		ctx.fillRect(0, 0, w, h);
	});

export const posterTexture = () =>
	make('poster', 256, 360, (ctx, w, h) => {
		const g = ctx.createLinearGradient(0, 0, w, h);
		g.addColorStop(0, '#264653');
		g.addColorStop(1, '#2a9d8f');
		ctx.fillStyle = g;
		ctx.fillRect(0, 0, w, h);
		ctx.fillStyle = '#e9c46a';
		ctx.beginPath();
		ctx.arc(w / 2, h * 0.4, 60, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle = '#f4f1de';
		ctx.font = '900 34px Inter, sans-serif';
		ctx.textAlign = 'center';
		ctx.fillText('JANGAN', w / 2, h * 0.75);
		ctx.fillText('MENYERAH', w / 2, h * 0.86);
	});
