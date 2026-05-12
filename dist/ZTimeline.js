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
    playOnStart = true;
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
    setInstanceData(data, orientation) {
        super.setInstanceData(data, orientation);
        this.looping = data.looping ?? false;
        this.playOnStart = true; //we want animations to play by default unless explicitly told not to
        if (data.playOnStart == false) {
            this.playOnStart = false;
        }
        if (this.playOnStart) {
            this.gotoAndPlay(0);
        }
    }
    getFrames() {
        return this._frames;
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
    applyTransform() {
        super.applyTransform();
        this.gotoAndStop(this.currentFrame);
    }
    gotoAndStop(frameNum) {
        this.currentFrame = frameNum;
        if (this._frames == null)
            return;
        for (const k in this._frames) {
            let frame = this._frames[k][this.currentFrame];
            if (!frame)
                continue;
            // `this[k]` is a child ZContainer set by ZScene as `mc[instanceName] = child`
            const child = this[k];
            if (!child)
                continue;
            if (frame.pivotX != null)
                child.pivotX = frame.pivotX;
            if (frame.pivotY != null)
                child.pivotY = frame.pivotY;
            if (frame.scaleX != null)
                child.scaleX = frame.scaleX;
            if (frame.scaleY != null)
                child.scaleY = frame.scaleY;
            if (frame.x != null)
                child.x = frame.x;
            if (frame.y != null)
                child.y = frame.y;
            if (frame.alpha != null)
                child.alpha = frame.alpha;
            if (frame.rotation != null)
                child.rotation = frame.rotation;
            if (frame.skewY != null) {
                child.skew.y = frame.skewY - child.rotation;
            }
            if (frame.skewX != null) {
                child.skew.x = child.rotation - frame.skewX;
            }
        }
    }
    getType() {
        return 'ZTimeline';
    }
    destroy() {
        this.stop();
        for (const child of this.children) {
            if (child instanceof ZTimeline) {
                child.destroy();
            }
        }
    }
}
//# sourceMappingURL=ZTimeline.js.map