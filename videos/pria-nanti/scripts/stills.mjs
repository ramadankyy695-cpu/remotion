// Renders review stills for shots: node scripts/stills.mjs <outdir> <scale> id:frame ...
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';

const [outDir, scale, ...items] = process.argv.slice(2);
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const browserExecutable = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
for (const it of items) {
	const [id, fr] = it.split(':');
	const composition = await selectComposition({serveUrl, id, browserExecutable, chromiumOptions: {gl: 'angle'}});
	const out = path.join(outDir, `${id}_${fr}.png`);
	const t = Date.now();
	await renderStill({composition, serveUrl, output: out, frame: Number(fr), scale: Number(scale), browserExecutable, chromiumOptions: {gl: 'angle'}, overwrite: true, timeoutInMilliseconds: 120000});
	console.log(out, Date.now() - t, 'ms');
}
