import { ZCuePointsManager } from './ZCuePointsManager';
import { ZContainer } from './ZContainer';
import { ZUpdatables } from './ZUpdatables';
/**
 * Frame-based animation container.
 * Works identically to the PIXI version: children are keyed by their
 * `instanceName` and per-frame transform deltas are written directly to
 * their CSS via `ZContainer` setters.
 */
export class ZTimeline extends ZContainer {
    totalFrames;
    _frames;
    currentFrame = 0;
    looping = true;
    cuePoints = {};
    func;
    constructor() {
        super();
        this.currentFrame = 0;
        this.looping = true;
    }
    setCuePoints(cuePoints) {
        this.cuePoints = cuePoints;
    }
    getFrames() {
        return this._frames;
    }
    init() {
        super.init();
        this.play();
    }
    setFrames(value) {
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
    removeStateEndEventListener() {
        this.func = undefined;
    }
    addStateEndEventListener(func) {
        this.func = func;
    }
    play() {
        ZUpdatables.addUpdateAble(this);
        for (const child of this.children) {
            if (child instanceof ZTimeline)
                child.play();
        }
    }
    stop() {
        ZUpdatables.removeUpdateAble(this);
        for (const child of this.children) {
            if (child instanceof ZTimeline)
                child.stop();
        }
    }
    gotoAndPlay(frameNum) {
        this.currentFrame = frameNum;
        ZUpdatables.removeUpdateAble(this);
        this.play();
    }
    update() {
        this.gotoAndStop(this.currentFrame);
        if (this.cuePoints?.[this.currentFrame] !== undefined) {
            ZCuePointsManager.triggerCuePoint(this.cuePoints[this.currentFrame], this);
        }
        this.currentFrame++;
        if (this.currentFrame > (this.totalFrames ?? 0)) {
            if (this.looping) {
                this.currentFrame = 0;
            }
            else {
                ZUpdatables.removeUpdateAble(this);
            }
            if (this.func) {
                this.func(this);
            }
        }
    }
    gotoAndStop(frameNum) {
        this.currentFrame = frameNum;
        if (this._frames == null)
            return;
        for (const k in this._frames) {
            const frameData = this._frames[k][this.currentFrame];
            if (!frameData)
                continue;
            // `this[k]` is a child ZContainer set by ZScene as `mc[instanceName] = child`
            const child = this[k];
            if (!child)
                continue;
            if (frameData.pivotX != null)
                child.pivotX = frameData.pivotX;
            if (frameData.pivotY != null)
                child.pivotY = frameData.pivotY;
            if (frameData.scaleX != null)
                child.scaleX = frameData.scaleX;
            if (frameData.scaleY != null)
                child.scaleY = frameData.scaleY;
            if (frameData.x != null)
                child.x = frameData.x;
            if (frameData.y != null)
                child.y = frameData.y;
            if (frameData.alpha != null)
                child.alpha = frameData.alpha;
            if (frameData.rotation != null)
                child.rotation = frameData.rotation;
            // Apply Flash skew: skewY is Flash's X-axis angle, skewX is Y-axis angle.
            if (frameData.skewY != null) {
                child.skew.y = frameData.skewY - child.rotation;
            }
            if (frameData.skewX != null) {
                child.skew.x = child.rotation - frameData.skewX;
            }
        }
    }
    getType() {
        return 'ZTimeline';
    }
}
//# sourceMappingURL=ZTimeline.js.map