import {Composition} from 'remotion';
import {SahabatHarta} from './SahabatHarta';
import {FPS, TOTAL_FRAMES} from './timeline';

export const RemotionRoot = () => {
	return (
		<Composition
			id="SahabatHarta"
			component={SahabatHarta}
			durationInFrames={TOTAL_FRAMES}
			fps={FPS}
			width={1080}
			height={1920}
		/>
	);
};
