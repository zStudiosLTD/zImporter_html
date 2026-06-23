import { ZContainer } from './ZContainer';
import { ZUpdatables } from './ZUpdatables';
/**
 * HTML equivalent of PIXI.AnimatedSprite.
 * Swaps a single <img> src on each frame tick driven by ZUpdatables.
 * API mirrors PIXI.AnimatedSprite: animationSpeed, loop, onComplete,
 * play(), stop(), gotoAndPlay(), gotoAndStop(), currentFrame, totalFrames.
 */
export class ZAnimatedSprite extends ZContainer {
    _framePaths = [];
    _assetBasePath = '';
    _imgEl;
    _accumulator = 0;
    _lastTime = 0;
    currentFrame = 0;
    totalFrames = 0;
    /** Frames per 60-fps tick — identical to PIXI.AnimatedSprite.animationSpeed. */
    animationSpeed = 1;
    loop = false;
    isPlaying = false;
    onComplete = null;
    constructor() {
        super();
        this._imgEl = document.createElement('img');
        this._imgEl.style.position = 'absolute';
        this._imgEl.style.left = '0px';
        this._imgEl.style.top = '0px';
        this._imgEl.style.userSelect = 'none';
        this._imgEl.draggable = false;
        this.el.appendChild(this._imgEl);
    }
    /** Called by ZScene after setting x/y/animationSpeed/loop. */
    setup(framePaths, assetBasePath) {
        this._assetBasePath = assetBasePath;
        this._framePaths = [...framePaths];
        this.totalFrames = framePaths.length;
        this._showFrame(0);
    }
    _showFrame(index) {
        if (index < 0 || index >= this.totalFrames)
            return;
        this._imgEl.src = this._assetBasePath + this._framePaths[index];
    }
    play() {
        if (this.isPlaying)
            return;
        this.isPlaying = true;
        this._lastTime = 0;
        ZUpdatables.addUpdateAble(this);
    }
    stop() {
        this.isPlaying = false;
        ZUpdatables.removeUpdateAble(this);
    }
    gotoAndPlay(frame) {
        this.currentFrame = frame;
        this._accumulator = 0;
        this._showFrame(frame);
        this.play();
    }
    gotoAndStop(frame) {
        this.stop();
        this.currentFrame = frame;
        this._accumulator = 0;
        this._showFrame(frame);
    }
    update() {
        const now = Date.now();
        if (this._lastTime === 0) {
            this._lastTime = now;
            return;
        }
        const dt = now - this._lastTime;
        this._lastTime = now;
        // animationSpeed = fps/60; convert to frames elapsed over dt ms
        this._accumulator += dt * (this.animationSpeed * 60) / 1000;
        let advanced = false;
        while (this._accumulator >= 1) {
            this._accumulator -= 1;
            this.currentFrame++;
            advanced = true;
            if (this.currentFrame >= this.totalFrames) {
                if (this.loop) {
                    this.currentFrame = 0;
                }
                else {
                    this.currentFrame = this.totalFrames - 1;
                    this._showFrame(this.currentFrame);
                    this.stop();
                    if (this.onComplete)
                        this.onComplete();
                    return;
                }
            }
        }
        if (advanced)
            this._showFrame(this.currentFrame);
    }
    getType() { return 'ZAnimatedSprite'; }
}
//# sourceMappingURL=ZAnimatedSprite.js.map