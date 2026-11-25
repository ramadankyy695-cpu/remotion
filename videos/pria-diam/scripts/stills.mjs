// usage: node scripts/stills.mjs <Comp> <frame,frame,...> [scale]
import {bundle} from '@remotion/bundler';
import {openBrowser, renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
const [comp, frames, scale = '0.5'] = process.argv.slice(2);
const serveUrl = process.env.BUNDLE ?? (await bundle({entryPoint: path.resolve('src/index.ts')}));
const browser = await openBrowser('chrome', {
	browserExecutable: '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell',
	chromiumOptions: {gl: 'swangle'},
});
for (const c of comp.split(',')) {
	const composition = await selectComposition({serveUrl, id: c, puppeteerInstance: browser});
	for (const f of frames.split(',').map(Number)) {
		if (f >= composition.durationInFrames) continue;
		const t0 = Date.now();
		await renderStill({serveUrl, composition, frame: f, output: `out/stills/${c}-${f}.jpg`, imageFormat: 'jpeg', jpegQuality: 80, scale: Number(scale), puppeteerInstance: browser, chromiumOptions: {gl: 'swangle'}});
		console.log(c, f, Date.now() - t0, 'ms');
	}
}
await browser.close({silent: true});
