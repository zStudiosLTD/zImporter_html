import { ZContainer } from './ZContainer';
/**
 * Frame-based animation container.
 * Works identically to the PIXI version: children are keyed by their
 * `instanceName` and per-frame transform deltas are written directly to
 * their CSS via `ZContainer` setters.
 */
export declare class ZTimeline extends ZContainer {
    [key: string]: any;
    totalFrames: number | undefined;
    _frames: any;
    currentFrame: number;
    looping: boolean;
    cuePoints: Record<number, string>;
    func: ((self: ZTimeline) => void) | undefined;
    constructor();
    setCuePoints(cuePoints: Record<number, string>): void;
    getFrames(): any;
    init(): void;
    setFrames(value: any): void;
    removeStateEndEventListener(): void;
    addStateEndEventListener(func: (self: ZTimeline) => void): void;
    play(): void;
    stop(): void;
    gotoAndPlay(frameNum: number): void;
    update(): void;
    gotoAndStop(frameNum: number): void;
    getType(): string;
}
//# sourceMappingURL=ZTimeline.d.ts.map