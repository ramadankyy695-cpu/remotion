import * as THREE from 'three';

const cache = new Map<string, THREE.Texture>();

const make = (key: string, w: number, h: number, draw: (c: CanvasRenderingContext2D) => void, repeat?: [number, number]) => {
	const ex = cache.get(key);
	if (ex) return ex;
	const canvas = document.createElement('canvas');
	canvas.width = w;
	canvas.height = h;
	const ctx = canvas.getContext('2d')!;
	draw(ctx);
	const tex = new THREE.CanvasTexture(canvas);
	tex.colorSpace = THREE.SRGBColorSpace;
	tex.anisotropy = 4;
	if (repeat) {
		tex.wrapS = THREE.RepeatWrapping;
		tex.wrapT = THREE.RepeatWrapping;
		tex.repeat.set(...repeat);
	}
	cache.set(key, tex);
	return tex;
};

const rnd = (s: number) => {
	const x = Math.sin(s * 91.7 + 13.3) * 43758.5453;
	return x - Math.floor(x);
};

export const laptopScreen = (variant: 'doc' | 'sheet' | 'chart') =>
	make(`screen-${variant}`, 640, 400, (c) => {
		c.fillStyle = variant === 'doc' ? '#e9edf3' : '#1d2430';
		c.fillRect(0, 0, 640, 400);
		c.fillStyle = variant === 'doc' ? '#c9d2df' : '#2b3545';
		c.fillRect(0, 0, 640, 26);
		['#ff6159', '#ffbd2e', '#28c941'].forEach((col, i) => {
			c.fillStyle = col;
			c.beginPath();
			c.arc(16 + i * 18, 13, 5, 0, Math.PI * 2);
			c.fill();
		});
		if (variant === 'doc') {
			c.fillStyle = '#ffffff';
			c.fillRect(120, 40, 400, 360);
			for (let i = 0; i < 17; i++) {
				const w = 300 * (0.55 + rnd(i) * 0.45);
				c.fillStyle = i % 6 === 0 ? '#3a4a66' : '#8a96a8';
				c.fillRect(150, 66 + i * 19, i % 6 === 0 ? w * 0.5 : w, i % 6 === 0 ? 9 : 6);
			}
		} else if (variant === 'sheet') {
			for (let r = 0; r < 18; r++) {
				for (let col = 0; col < 7; col++) {
					c.strokeStyle = '#3a475b';
					c.strokeRect(10 + col * 88, 36 + r * 20, 88, 20);
					if (rnd(r * 7 + col) > 0.35) {
						c.fillStyle = r === 0 ? '#9fc2ff' : col === 6 && rnd(r) > 0.6 ? '#ff8a7a' : '#aab6c8';
						c.fillRect(16 + col * 88, 44 + r * 20, 40 + rnd(r + col * 3) * 36, 5);
					}
				}
			}
		} else {
			c.fillStyle = '#26303f';
			c.fillRect(20, 40, 600, 340);
			c.strokeStyle = '#6aa7ff';
			c.lineWidth = 4;
			c.beginPath();
			for (let i = 0; i <= 20; i++) {
				const y = 300 - i * 6 - Math.sin(i * 0.9) * 30 + (i > 14 ? (i - 14) * 14 : 0);
				if (i === 0) c.moveTo(40 + i * 28, y);
				else c.lineTo(40 + i * 28, y);
			}
			c.stroke();
			for (let i = 0; i < 8; i++) {
				c.fillStyle = '#3d4a5e';
				c.fillRect(40 + i * 72, 330, 50, 6);
			}
		}
	});

export const familyPhoto = () =>
	make('family', 300, 380, (c) => {
		const g = c.createLinearGradient(0, 0, 0, 380);
		g.addColorStop(0, '#d9c7a6');
		g.addColorStop(1, '#a8906a');
		c.fillStyle = g;
		c.fillRect(0, 0, 300, 380);
		// backdrop: house wall & doorway
		c.fillStyle = 'rgba(120,95,70,0.35)';
		c.fillRect(0, 180, 300, 200);
		const person = (x: number, y: number, s: number, shirt: string, hair: string) => {
			c.fillStyle = shirt;
			c.beginPath();
			c.ellipse(x, y + 120 * s, 55 * s, 85 * s, 0, Math.PI, 0);
			c.fill();
			c.fillRect(x - 55 * s, y + 120 * s, 110 * s, 200);
			c.fillStyle = '#b07a55';
			c.fillRect(x - 12 * s, y + 25 * s, 24 * s, 30 * s);
			c.beginPath();
			c.ellipse(x, y, 30 * s, 37 * s, 0, 0, Math.PI * 2);
			c.fill();
			c.fillStyle = hair;
			c.beginPath();
			c.ellipse(x, y - 14 * s, 32 * s, 26 * s, 0, Math.PI, 0);
			c.fill();
			// smile
			c.strokeStyle = 'rgba(80,40,30,0.7)';
			c.lineWidth = 2;
			c.beginPath();
			c.arc(x, y + 8 * s, 11 * s, 0.2, Math.PI - 0.2);
			c.stroke();
			c.fillStyle = '#2a1c16';
			c.beginPath();
			c.arc(x - 10 * s, y - 3 * s, 3 * s, 0, Math.PI * 2);
			c.arc(x + 10 * s, y - 3 * s, 3 * s, 0, Math.PI * 2);
			c.fill();
		};
		person(85, 140, 1.0, '#7d8a76', '#3a332e');
		person(210, 150, 0.95, '#8a4b45', '#2c2420');
		person(150, 225, 0.7, '#3f5d8a', '#141110');
		// photo grain + vignette
		for (let i = 0; i < 2500; i++) {
			c.fillStyle = `rgba(60,40,20,${rnd(i) * 0.08})`;
			c.fillRect(rnd(i * 3) * 300, rnd(i * 7) * 380, 2, 2);
		}
		const v = c.createRadialGradient(150, 190, 80, 150, 190, 250);
		v.addColorStop(0, 'rgba(0,0,0,0)');
		v.addColorStop(1, 'rgba(60,35,15,0.45)');
		c.fillStyle = v;
		c.fillRect(0, 0, 300, 380);
	});

export const woodFloor = () =>
	make(
		'wood',
		512,
		512,
		(c) => {
			for (let i = 0; i < 8; i++) {
				const base = 0.82 + rnd(i) * 0.18;
				c.fillStyle = `rgb(${Math.round(150 * base)},${Math.round(104 * base)},${Math.round(70 * base)})`;
				c.fillRect(0, i * 64, 512, 64);
				for (let k = 0; k < 40; k++) {
					c.fillStyle = `rgba(70,40,20,${0.05 + rnd(i * 50 + k) * 0.08})`;
					c.fillRect(0, i * 64 + rnd(k + i) * 64, 512, 1 + rnd(k) * 2);
				}
				c.fillStyle = 'rgba(40,22,12,0.6)';
				c.fillRect(0, i * 64, 512, 2);
				const off = rnd(i * 9) * 512;
				c.fillRect(off, i * 64, 2, 64);
			}
		},
		[3, 3],
	);

export const tileFloor = (color = '#bfb8ab', key = 'tile') =>
	make(
		key,
		256,
		256,
		(c) => {
			c.fillStyle = color;
			c.fillRect(0, 0, 256, 256);
			for (let i = 0; i < 4; i++) {
				for (let j = 0; j < 4; j++) {
					c.fillStyle = `rgba(0,0,0,${rnd(i * 4 + j) * 0.06})`;
					c.fillRect(i * 64, j * 64, 64, 64);
				}
			}
			c.strokeStyle = 'rgba(0,0,0,0.25)';
			c.lineWidth = 2;
			for (let i = 0; i <= 4; i++) {
				c.beginPath();
				c.moveTo(i * 64, 0);
				c.lineTo(i * 64, 256);
				c.moveTo(0, i * 64);
				c.lineTo(256, i * 64);
				c.stroke();
			}
		},
		[8, 8],
	);

export const asphalt = () =>
	make(
		'asphalt',
		512,
		512,
		(c) => {
			c.fillStyle = '#4a4b4f';
			c.fillRect(0, 0, 512, 512);
			for (let i = 0; i < 9000; i++) {
				const v = rnd(i) > 0.5 ? 255 : 0;
				c.fillStyle = `rgba(${v},${v},${v},${rnd(i * 3) * 0.08})`;
				c.fillRect(rnd(i * 5) * 512, rnd(i * 11) * 512, 2, 2);
			}
			// patches
			for (let i = 0; i < 6; i++) {
				c.fillStyle = 'rgba(20,20,22,0.12)';
				c.beginPath();
				c.ellipse(rnd(i * 13) * 512, rnd(i * 17) * 512, 60 + rnd(i) * 60, 30 + rnd(i * 2) * 40, rnd(i) * 3, 0, Math.PI * 2);
				c.fill();
			}
		},
		[2, 10],
	);

export const paving = () =>
	make(
		'paving',
		256,
		256,
		(c) => {
			c.fillStyle = '#a49c90';
			c.fillRect(0, 0, 256, 256);
			for (let j = 0; j < 8; j++) {
				for (let i = 0; i < 4; i++) {
					const x = i * 64 + (j % 2) * 32;
					c.fillStyle = `rgba(${rnd(i + j * 9) > 0.5 ? 255 : 0},0,0,0.03)`;
					c.fillRect(x, j * 32, 64, 32);
					c.strokeStyle = 'rgba(40,35,30,0.35)';
					c.strokeRect(x, j * 32, 64, 32);
				}
			}
		},
		[3, 20],
	);

export const signTex = (text: string, bg: string, fg: string) =>
	make(`sign-${text}`, 512, 128, (c) => {
		c.fillStyle = bg;
		c.fillRect(0, 0, 512, 128);
		c.fillStyle = fg;
		c.font = 'bold 64px sans-serif';
		c.textAlign = 'center';
		c.textBaseline = 'middle';
		c.fillText(text, 256, 68);
	});

export const posterTex = () =>
	make('poster', 256, 360, (c) => {
		const g = c.createLinearGradient(0, 0, 0, 360);
		g.addColorStop(0, '#f2b16b');
		g.addColorStop(0.6, '#c96a5a');
		g.addColorStop(1, '#3d3555');
		c.fillStyle = g;
		c.fillRect(0, 0, 256, 360);
		c.fillStyle = '#fbe3b0';
		c.beginPath();
		c.arc(128, 170, 40, 0, Math.PI * 2);
		c.fill();
		c.fillStyle = '#2d2a44';
		c.beginPath();
		c.moveTo(0, 360);
		c.lineTo(0, 250);
		c.lineTo(80, 190);
		c.lineTo(140, 240);
		c.lineTo(200, 180);
		c.lineTo(256, 230);
		c.lineTo(256, 360);
		c.fill();
		c.fillStyle = '#fff3dd';
		c.font = 'bold 26px sans-serif';
		c.textAlign = 'center';
		c.fillText('SOMEDAY', 128, 60);
	});

export const calendarTex = (day: number) =>
	make(`cal-${day}`, 200, 240, (c) => {
		c.fillStyle = '#f4efe6';
		c.fillRect(0, 0, 200, 240);
		c.fillStyle = '#b8453c';
		c.fillRect(0, 0, 200, 50);
		c.fillStyle = '#ffffff';
		c.font = 'bold 26px sans-serif';
		c.textAlign = 'center';
		c.fillText('NOVEMBER', 100, 34);
		c.fillStyle = '#333';
		c.font = '16px sans-serif';
		for (let i = 0; i < 30; i++) {
			const x = 18 + (i % 7) * 27;
			const y = 78 + Math.floor(i / 7) * 32;
			c.fillText(String(i + 1), x + 4, y);
			if (i < day) {
				c.strokeStyle = '#b8453c';
				c.lineWidth = 2;
				c.beginPath();
				c.moveTo(x - 6, y - 12);
				c.lineTo(x + 14, y + 4);
				c.stroke();
			}
		}
	});

// radial soft glow for sprites
export const glowTex = () =>
	make('glow', 128, 128, (c) => {
		const g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
		g.addColorStop(0, 'rgba(255,255,255,1)');
		g.addColorStop(0.3, 'rgba(255,255,255,0.35)');
		g.addColorStop(1, 'rgba(255,255,255,0)');
		c.fillStyle = g;
		c.fillRect(0, 0, 128, 128);
	});

// vertical gradient for light shafts (bright at the source end)
export const shaftTex = () =>
	make('shaft', 64, 256, (c) => {
		const g = c.createLinearGradient(0, 0, 0, 256);
		g.addColorStop(0, 'rgba(255,255,255,0.9)');
		g.addColorStop(0.5, 'rgba(255,255,255,0.35)');
		g.addColorStop(1, 'rgba(255,255,255,0)');
		c.fillStyle = g;
		c.fillRect(0, 0, 64, 256);
		const h = c.createLinearGradient(0, 0, 64, 0);
		h.addColorStop(0, 'rgba(0,0,0,1)');
		h.addColorStop(0.25, 'rgba(0,0,0,0)');
		h.addColorStop(0.75, 'rgba(0,0,0,0)');
		h.addColorStop(1, 'rgba(0,0,0,1)');
		c.globalCompositeOperation = 'destination-out';
		c.fillStyle = h;
		c.fillRect(0, 0, 64, 256);
	});

export const skyTex = (top: string, mid: string, bottom: string, key: string) =>
	make(`sky-${key}`, 16, 512, (c) => {
		const g = c.createLinearGradient(0, 0, 0, 512);
		g.addColorStop(0, top);
		g.addColorStop(0.55, mid);
		g.addColorStop(1, bottom);
		c.fillStyle = g;
		c.fillRect(0, 0, 16, 512);
	});

export const windowsTex = (seed: number, lit: number) =>
	make(`win-${seed}-${lit}`, 128, 128, (c) => {
		c.fillStyle = '#000';
		c.fillRect(0, 0, 128, 128);
		for (let i = 0; i < 4; i++) {
			for (let j = 0; j < 4; j++) {
				if (rnd(seed + i * 4 + j) < lit) {
					c.fillStyle = rnd(seed * 3 + i + j) > 0.5 ? '#ffcf8a' : '#ffe2b5';
					c.fillRect(8 + i * 30, 8 + j * 30, 20, 22);
				}
			}
		}
	});
