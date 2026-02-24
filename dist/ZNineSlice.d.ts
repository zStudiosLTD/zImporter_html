import { ZContainer } from './ZContainer';
import { NineSliceData } from './SceneData';
/**
 * HTML div–based nine-slice container.
 *
 * Wraps a CSS `border-image` div that stretches the edges/corners while
 * keeping the slice cuts intact — equivalent to Phaser.NineSlice and
 * PIXI.NineSlicePlane.
 *
 * ZNineSlice extends ZContainer so it participates directly in the
 * resize map and scene graph. The inner div owns the CSS border-image;
 * the outer ZContainer el carries the CSS transform (position/scale).
 */
export declare class ZNineSlice extends ZContainer {
    private innerDiv;
    private nsData;
    constructor(data: NineSliceData, orientation: 'portrait' | 'landscape', assetBasePath: string);
    applyTransform(): void;
    resize(_width: number, _height: number, orientation: 'portrait' | 'landscape'): void;
    private _applySize;
    getType(): string;
}
//# sourceMappingURL=ZNineSlice.d.ts.map