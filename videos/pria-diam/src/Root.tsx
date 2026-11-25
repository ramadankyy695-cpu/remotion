import React from 'react';
import {Composition} from 'remotion';
import {Scene1, Scene2} from './scenes/Bedroom';
import {TOTAL_FRAMES, Video} from './Video';
import {Scene3} from './scenes/Flashback';
import {Scene4} from './scenes/Street';
import {Scene5a, Scene5b, Scene56} from './scenes/Social';
import {Scene7, Scene89} from './scenes/Window';

const W = 1080;
const H = 1920;

export const RemotionRoot: React.FC = () => {
	return (
		<>
			<Composition id="PriaDiam" component={Video} durationInFrames={TOTAL_FRAMES} fps={30} width={W} height={H} />
			<Composition id="S1" component={Scene1} durationInFrames={212} fps={30} width={W} height={H} />
			<Composition id="S2" component={Scene2} durationInFrames={240} fps={30} width={W} height={H} />
			<Composition id="S3" component={Scene3} durationInFrames={170} fps={30} width={W} height={H} />
			<Composition id="S4" component={Scene4} durationInFrames={318} fps={30} width={W} height={H} />
			<Composition id="S5a" component={Scene5a} durationInFrames={54} fps={30} width={W} height={H} />
			<Composition id="S5b" component={Scene5b} durationInFrames={40} fps={30} width={W} height={H} />
			<Composition id="S56" component={Scene56} durationInFrames={170} fps={30} width={W} height={H} />
			<Composition id="S7" component={Scene7} durationInFrames={160} fps={30} width={W} height={H} />
			<Composition id="S89" component={Scene89} durationInFrames={235} fps={30} width={W} height={H} />
		</>
	);
};
