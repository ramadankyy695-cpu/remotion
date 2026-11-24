// Master timeline. VO (public/audio/vo.wav) = 40.04 s and is the source of truth.
// Phrase times are estimated from pause detection (ffmpeg silencedetect), not word-level alignment.

export const FPS = 30;
export const TOTAL_FRAMES = 1202; // 40.07 s, ends right after the VO

export type ShotId =
	| 'sh01'
	| 'sh02'
	| 'sh03'
	| 'sh04'
	| 'sh05'
	| 'sh06'
	| 'sh07'
	| 'sh08'
	| 'sh09'
	| 'sh10'
	| 'sh11'
	| 'sh12'
	| 'sh13'
	| 'sh14';

export type Shot = {id: ShotId; from: number; to: number};

export const SHOTS: Shot[] = [
	{id: 'sh01', from: 0, to: 90}, // walk together (tracking)
	{id: 'sh02', from: 90, to: 198}, // promise + fist bump (push-in)
	{id: 'sh03', from: 198, to: 276}, // "Suatu hari" chamber reveal (crane/tilt down)
	{id: 'sh04', from: 276, to: 360}, // chest opens (low close-up, crane up)
	{id: 'sh05', from: 360, to: 438}, // "lengah" gem, friend grabs chest (push + truck)
	{id: 'sh06', from: 438, to: 480}, // shocked close-up (snap push-in)
	{id: 'sh07', from: 480, to: 534}, // friend runs with treasure (truck-left)
	{id: 'sh08', from: 534, to: 597}, // main chases (pull-back tracking)
	{id: 'sh09', from: 597, to: 669}, // stone door slams (shake)
	{id: 'sh10', from: 669, to: 831}, // the vow (low orbit + push-in)
	{id: 'sh11', from: 831, to: 963}, // bedroom, 3 days later, phone buzzes (pan + push)
	{id: 'sh12', from: 963, to: 1050}, // phone POV, notification (push-in)
	{id: 'sh13', from: 1050, to: 1140}, // the message (push-in)
	{id: 'sh14', from: 1140, to: 1202}, // devastated face (slow push-in)
];

export type Caption = {start: number; end: number; text: string; hot?: string};

// seconds
export const CAPTIONS: Caption[] = [
	{start: 0.22, end: 1.55, text: 'Gue punya sahabat'},
	{start: 1.6, end: 2.9, text: 'yang selalu bilang'},
	{start: 2.95, end: 4.85, text: 'kalau dia bakal ada buat gue,'},
	{start: 4.9, end: 6.4, text: 'apa pun yang terjadi.', hot: 'apa pun'},
	{start: 6.94, end: 7.9, text: 'Suatu hari,'},
	{start: 8.0, end: 9.9, text: 'kami menemukan sebuah harta karun', hot: 'harta karun'},
	{start: 9.9, end: 11.6, text: 'langka di dalam gua.', hot: 'langka'},
	{start: 12.19, end: 13.6, text: 'Tapi saat gue lengah,', hot: 'lengah'},
	{start: 13.72, end: 15.5, text: 'dia malah mengambil semuanya', hot: 'mengambil semuanya'},
	{start: 15.5, end: 17.5, text: 'dan meninggalkan gue sendirian.', hot: 'sendirian'},
	{start: 17.9, end: 19.5, text: 'Gue berusaha mengejarnya,'},
	{start: 19.6, end: 21.6, text: 'tapi pintu gua sudah tertutup.', hot: 'tertutup'},
	{start: 22.34, end: 23.4, text: 'Sejak hari itu,'},
	{start: 23.55, end: 25.2, text: 'gue bersumpah nggak akan pernah', hot: 'nggak akan pernah'},
	{start: 25.3, end: 27.2, text: 'percaya sama dia lagi.', hot: 'percaya'},
	{start: 28.21, end: 29.5, text: 'Tiga hari kemudian,', hot: 'Tiga hari'},
	{start: 29.68, end: 31.7, text: 'gue menerima sebuah pesan darinya.', hot: 'pesan'},
	{start: 32.21, end: 34.3, text: 'Isinya cuma satu kalimat...'},
	{start: 35.06, end: 35.8, text: '"Maaf,'},
	{start: 35.87, end: 37.3, text: 'gue mencuri hartanya', hot: 'mencuri'},
	{start: 37.3, end: 39.05, text: 'karena gue harus membayar'},
	{start: 39.1, end: 40.07, text: 'obat ibu gue."', hot: 'obat ibu gue'},
];

export const MESSAGE_TEXT =
	'Maaf, gue mencuri hartanya karena gue harus membayar obat ibu gue.';
