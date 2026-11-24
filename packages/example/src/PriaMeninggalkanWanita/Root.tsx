import React from 'react';
import {Composition} from 'remotion';
import {DURATION, FPS, PriaMeninggalkanWanita} from './index';

export const PriaMeninggalkanWanitaComposition: React.FC = () => (
	<Composition
		id="PriaMeninggalkanWanita"
		component={PriaMeninggalkanWanita}
		width={1080}
		height={1920}
		fps={FPS}
		durationInFrames={DURATION}
	/>
);
