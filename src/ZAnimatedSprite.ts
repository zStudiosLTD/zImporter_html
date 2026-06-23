import { ZContainer } from './ZContainer';
import { ZUpdatables } from './ZUpdatables';

/**
 * HTML equivalent of PIXI.AnimatedSprite.
 * Swaps a single <img> src on each frame tick driven by ZUpdatables.
 * API mirrors PIXI.AnimatedSprite: animationSpeed, loop, onComplete,
 * play(), stop(), gotoAndPlay(), gotoAndStop(), currentFrame, totalFrames.
 */
export class ZAnimatedSprite extends ZContainer {
    private _framePaths: string[] = [];
    private _assetBasePath: string = '';
    private _imgEl: HTMLImageElement;
    private _accumulator: number = 0;
    private _lastTime: number = 0;

    currentFrame: number = 0;
    totalFrames: number = 0;
    /** Frames per 60-fps tick — identical to PIXI.AnimatedSprite.animationSpeed. */
    animationSpeed: number = 1;
    loop: boolean = false;
    isPlaying: boolean = false;
    onComplete: (() => void) | null = null;

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
    setup(framePaths: string[], assetBasePath: string): void {
        this._assetBasePath = assetBasePath;
        this._framePaths = [...framePaths];
        this.totalFrames = framePaths.length;
        this._showFrame(0);
    }

    private _showFrame(index: number): void {
        if (index < 0 || index >= this.totalFrames) return;
        this._imgEl.src = this._assetBasePath + this._framePaths[index];
    }

    play(): void {
        if (this.isPlaying) return;
        this.isPlaying = true;
        this._lastTime = 0;
        ZUpdatables.addUpdateAble(this);
    }

    stop(): void {
        this.isPlaying = false;
        ZUpdatables.removeUpdateAble(this);
    }

    gotoAndPlay(frame: number): void {
        this.currentFrame = frame;
        this._accumulator = 0;
        this._showFrame(frame);
        this.play();
    }

    gotoAndStop(frame: number): void {
        this.stop();
        this.currentFrame = frame;
        this._accumulator = 0;
        this._showFrame(frame);
    }

    update(): void {
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
                } else {
                    this.currentFrame = this.totalFrames - 1;
                    this._showFrame(this.currentFrame);
                    this.stop();
                    if (this.onComplete) this.onComplete();
                    return;
                }
            }
        }

        if (advanced) this._showFrame(this.currentFrame);
    }

    public override getType(): string { return 'ZAnimatedSprite'; }
}
