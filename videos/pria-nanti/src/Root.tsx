import React from 'react';
import {Composition} from 'remotion';
import {Video} from './Video';
import {s, SHOTS, ShotId, TOTAL_FRAMES} from './timeline';
import {Scene1} from './scenes/Scene1';
import {Scene2a, Scene2b, Scene2c} from './scenes/Scene2';
import {Scene3a, Scene3b} from './scenes/Scene3';
import {Scene4a, Scene4b, Scene4c} from './scenes/Scene4';
import {Scene5a, Scene5b, Scene5c, Scene5d} from './scenes/Scene5';
import {Scene6a, Scene6b, Scene6c, Scene6d, Scene6e} from './scenes/Scene6';
import {Scene7a, Scene7b, Scene7c} from './scenes/Scene7';
import {Scene8a, Scene8b, Scene8c} from './scenes/Scene8';
import {Scene9} from './scenes/Scene9';

const shots: Record<ShotId, React.FC> = {
	s1: Scene1, s2a: Scene2a, s2b: Scene2b, s2c: Scene2c, s3a: Scene3a, s3b: Scene3b, s4a: Scene4a, s4b: Scene4b, s4c: Scene4c,
	s5a: Scene5a, s5b: Scene5b, s5c: Scene5c, s5d: Scene5d, s6a: Scene6a, s6b: Scene6b, s6c: Scene6c, s6d: Scene6d, s6e: Scene6e,
	s7a: Scene7a, s7b: Scene7b, s7c: Scene7c, s8a: Scene8a, s8b: Scene8b, s8c: Scene8c, s9: Scene9,
};

export const Root: React.FC = () => (
	<>
		<Composition id="PriaNanti" component={Video} width={1080} height={1920} fps={30} durationInFrames={TOTAL_FRAMES} />
		{(Object.keys(SHOTS) as ShotId[]).map((id) => (
			<Composition key={id} id={`shot-${id}`} component={shots[id]} width={1080} height={1920} fps={30} durationInFrames={s(SHOTS[id][1]) - s(SHOTS[id][0]) + 16} />
		))}
	</>
);
