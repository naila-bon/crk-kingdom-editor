import {
    Application,
} from '@pixi/react';
import { RenderLayers } from './RenderLayers';

const GRID_SIZE = 800;


export const PixiCanvas = () => {

    return <Application resizeTo={window}
        backgroundColor={'green'}
        resolution={window.devicePixelRatio}
        autoDensity
        antialias
        preference="webgl"
        powerPreference="high-performance">
        <RenderLayers />
    </Application >;
};