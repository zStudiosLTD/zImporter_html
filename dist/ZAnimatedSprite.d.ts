import { ZContainer } from './ZContainer';
/**
 * HTML equivalent of PIXI.AnimatedSprite.
 * Swaps a single <img> src on each frame tick driven by ZUpdatables.
 * API mirrors PIXI.AnimatedSprite: animationSpeed, loop, onComplete,
 * play(), stop(), gotoAndPlay(), gotoAndStop(), currentFrame, totalFrames.
 */
export declare class ZAnimatedSprite extends ZContainer {
    private _framePaths;
    private _assetBasePath;
    private _imgEl;
    private _accumulator;
    private _lastTime;
    currentFrame: number;
    totalFrames: number;
    /** Frames per 60-fps tick — identical to PIXI.AnimatedSprite.animationSpeed. */
    animationSpeed: number;
    loop: boolean;
    isPlaying: boolean;
    onComplete: (() => void) | null;
    constructor();
    /** Called by ZScene after setting x/y/animationSpeed/loop. */
    setup(framePaths: string[], assetBasePath: string): void;
    private _showFrame;
    play(): void;
    stop(): void;
    gotoAndPlay(frame: number): void;
    gotoAndStop(frame: number): void;
    update(): void;
    getType(): string;
}
//# sourceMappingURL=ZAnimatedSprite.d.ts.map