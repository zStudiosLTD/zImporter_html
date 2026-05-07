import { ZCuePointsManager } from './ZCuePointsManager';
import { ZContainer } from './ZContainer';
import { ZUpdatables } from './ZUpdatables';
import { InstanceData } from './SceneData';

/**
 * Frame-based animation container.
 * Works identically to the PIXI version: children are keyed by their
 * `instanceName` and per-frame transform deltas are written directly to
 * their CSS via `ZContainer` setters.
 */
export class ZTimeline extends ZContainer {
    [key: string]: any;

    totalFrames: number | undefined;
    _frames: any;
    currentFrame: number = 0;
    looping: boolean = true;
    cuePoints: Record<number, string> = {};
    func: ((self: ZTimeline) => void) | undefined;

    constructor() {
        super();
        this.currentFrame = 0;
        this.looping = true;
    }

    setCuePoints(cuePoints: Record<number, string>): void {
        this.cuePoints = cuePoints;
    }

    public setInstanceData(data: InstanceData, orientation: string): void {
        super.setInstanceData(data, orientation);
        this.looping = data.looping ?? false;
        if (data.playOnStart) {
            this.play();
        }
    }

    getFrames(): any {
        return this._frames;
    }

    setFrames(value: any): void {
        this._frames = value;
        let totalFrames = 0;
        if (this._frames != null) {
            for (const k in this._frames) {
                if (Array.isArray(this._frames[k])) {
                    if (this._frames[k].length > totalFrames) {
                        totalFrames = this._frames[k].length;
                    }
                }
            }
        }
        this.totalFrames = totalFrames;
    }

    removeStateEndEventListener(): void {
        this.func = undefined;
    }

    addStateEndEventListener(func: (self: ZTimeline) => void): void {
        this.func = func;
    }

    play(): void {
        ZUpdatables.addUpdateAble(this);
        for (const child of this.children) {
            if (child instanceof ZTimeline) child.play();
        }
    }

    stop(): void {
        ZUpdatables.removeUpdateAble(this);
        for (const child of this.children) {
            if (child instanceof ZTimeline) child.stop();
        }
    }

    gotoAndPlay(frameNum: number): void {
        this.currentFrame = frameNum;
        ZUpdatables.removeUpdateAble(this);
        this.play();
    }

    update(): void {
        this.gotoAndStop(this.currentFrame);

        if (this.cuePoints?.[this.currentFrame] !== undefined) {
            ZCuePointsManager.triggerCuePoint(this.cuePoints[this.currentFrame], this);
        }

        this.currentFrame++;

        if (this.currentFrame > (this.totalFrames ?? 0)) {
            if (this.looping) {
                this.currentFrame = 0;
            } else {
                ZUpdatables.removeUpdateAble(this);
            }
            if (this.func) {
                this.func(this);
            }
        }
    }

    gotoAndStop(frameNum: number): void {
        this.currentFrame = frameNum;
        if (this._frames == null) return;

        for (const k in this._frames) {
            const frameData = this._frames[k][this.currentFrame];
            if (!frameData) continue;

            // `this[k]` is a child ZContainer set by ZScene as `mc[instanceName] = child`
            const child: ZContainer | undefined = (this as any)[k];
            if (!child) continue;

            if (frameData.pivotX != null) child.pivotX = frameData.pivotX;
            if (frameData.pivotY != null) child.pivotY = frameData.pivotY;
            if (frameData.scaleX != null) child.scaleX = frameData.scaleX;
            if (frameData.scaleY != null) child.scaleY = frameData.scaleY;
            if (frameData.x != null) child.x = frameData.x;
            if (frameData.y != null) child.y = frameData.y;
            if (frameData.alpha != null) child.alpha = frameData.alpha;
            if (frameData.rotation != null) child.rotation = frameData.rotation;
            // Apply Flash skew: skewY is Flash's X-axis angle, skewX is Y-axis angle.
            if (frameData.skewY != null) {
                child.skew.y = frameData.skewY - child.rotation;
            }
            if (frameData.skewX != null) {
                child.skew.x = child.rotation - frameData.skewX;
            }
        }
    }

    public override getType(): string {
        return 'ZTimeline';
    }

    public destroy(): void {
        this.stop();
        for (const child of this.children) {
            if (child instanceof ZTimeline) {
                child.destroy();
            }
        }
    }
}
