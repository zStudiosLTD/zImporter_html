/**
 * A static tick-rate–throttled update manager.
 * Drives frame-based animations (ZTimeline) via `requestAnimationFrame`.
 */
export class ZUpdatables {
    static updatables: Map<any, boolean> = new Map();
    static fpsInterval: number = 0;
    static then: number = 0;
    static now: number = 0;
    static elapsed: number = 0;
    static startTime: number = 0;
    private static _rafId: number = 0;
    private static _running: boolean = false;

    /** Initialises the update loop at the desired frame rate and starts the RAF loop. */
    static init(fps: number = 24): void {
        this.fpsInterval = 1000 / fps;
        this.then = Date.now();
        this.startTime = this.then;
        if (!this._running) {
            this._running = true;
            this._loop();
        }
    }

    private static _loop(): void {
        ZUpdatables._rafId = requestAnimationFrame(() => ZUpdatables._loop());
        ZUpdatables.update();
    }

    /** Register an object with an `update()` method to receive per-tick calls. */
    static addUpdateAble(mc: any): void {
        if (!this._running) this.init();
        ZUpdatables.updatables.set(mc, true);
    }

    /** Called each RAF tick; throttled to the configured FPS. */
    static update(): void {
        this.now = Date.now();
        this.elapsed = this.now - this.then;
        if (this.elapsed > this.fpsInterval) {
            this.then = this.now - (this.elapsed % this.fpsInterval);
            for (const [key] of ZUpdatables.updatables) {
                (key as any).update();
            }
        }
    }

    /** Stop sending update calls to `mc`. */
    static removeUpdateAble(mc: any): void {
        ZUpdatables.updatables.delete(mc);
    }
}
