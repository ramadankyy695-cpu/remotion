// Master timeline derived from the VO (vo.wav is the master clock). Values are in seconds.
export const FPS = 30;
export const s = (sec: number) => Math.round(sec * FPS);

export const SHOTS = {
	s1: [0, 6.45],
	s2a: [6.45, 9.95],
	s2b: [9.95, 11.9],
	s2c: [11.9, 15.35],
	s3a: [15.35, 19.2],
	s3b: [19.2, 22.6],
	s4a: [22.6, 25.9],
	s4b: [25.9, 28.75],
	s4c: [28.75, 32.65],
	s5a: [32.65, 35.8],
	s5b: [35.8, 37.65],
	s5c: [37.65, 39.2],
	s5d: [39.2, 40.9],
	s6a: [40.9, 42.4],
	s6b: [42.4, 43.65],
	s6c: [43.65, 45.3],
	s6d: [45.3, 48.6],
	s6e: [48.6, 51.85],
	s7a: [51.85, 55.0],
	s7b: [55.0, 57.75],
	s7c: [57.75, 61.5],
	s8a: [61.5, 63.95],
	s8b: [63.95, 65.3],
	s8c: [65.3, 66.9],
	s9: [66.9, 75.0],
} as const;

export type ShotId = keyof typeof SHOTS;

export const TOTAL_SECONDS = 75;
export const TOTAL_FRAMES = s(TOTAL_SECONDS);

export const shotLen = (id: ShotId) => s(SHOTS[id][1]) - s(SHOTS[id][0]);
