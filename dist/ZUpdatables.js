/**
 * A static tick-rate–throttled update manager.
 * Drives frame-based animations (ZTimeline) via `requestAnimationFrame`.
 */
export class ZUpdatables {
    static updatables = new Map();
    static fpsInterval = 0;
    static then = 0;
    static now = 0;
    static elapsed = 0;
    static startTime = 0;
    static _rafId = 0;
    static _running = false;
    /** Initialises the update loop at the desired frame rate and starts the RAF loop. */
    static init(fps = 24) {
        this.fpsInterval = 1000 / fps;
        this.then = Date.now();
        this.startTime = this.then;
        if (!this._running) {
            this._running = true;
            this._loop();
        }
    }
    static _loop() {
        ZUpdatables._rafId = requestAnimationFrame(() => ZUpdatables._loop());
        ZUpdatables.update();
    }
    /** Register an object with an `update()` method to receive per-tick calls. */
    static addUpdateAble(mc) {
        if (!this._running)
            this.init();
        ZUpdatables.updatables.set(mc, true);
    }
    /** Called each RAF tick; throttled to the configured FPS. */
    static update() {
        this.now = Date.now();
        this.elapsed = this.now - this.then;
        if (this.elapsed > this.fpsInterval) {
            this.then = this.now - (this.elapsed % this.fpsInterval);
            for (const [key] of ZUpdatables.updatables) {
                key.update();
            }
        }
    }
    /** Stop sending update calls to `mc`. */
    static removeUpdateAble(mc) {
        ZUpdatables.updatables.delete(mc);
    }
}
//# sourceMappingURL=ZUpdatables.js.map