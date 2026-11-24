// Usage: node scripts/stills.mjs 45 160 300 ...   -> out/stills/f<frame>.png (half res)
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';

const frames = process.argv.slice(2).map(Number);
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const opts = {
	serveUrl,
	browserExecutable: '/opt/pw-browsers/chromium_headless_shell',
	chromiumOptions: {gl: 'swangle'},
};
const composition = await selectComposition({...opts, id: 'SahabatHarta'});
for (const frame of frames) {
	const t = Date.now();
	await renderStill({...opts, composition, frame, scale: 0.5, output: `out/stills/f${frame}.png`});
	console.log('frame', frame, Date.now() - t, 'ms');
}
