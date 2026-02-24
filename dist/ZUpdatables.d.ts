/**
 * A static tick-rate–throttled update manager.
 * Drives frame-based animations (ZTimeline) via `requestAnimationFrame`.
 */
export declare class ZUpdatables {
    static updatables: Map<any, boolean>;
    static fpsInterval: number;
    static then: number;
    static now: number;
    static elapsed: number;
    static startTime: number;
    private static _rafId;
    private static _running;
    /** Initialises the update loop at the desired frame rate and starts the RAF loop. */
    static init(fps?: number): void;
    private static _loop;
    /** Register an object with an `update()` method to receive per-tick calls. */
    static addUpdateAble(mc: any): void;
    /** Called each RAF tick; throttled to the configured FPS. */
    static update(): void;
    /** Stop sending update calls to `mc`. */
    static removeUpdateAble(mc: any): void;
}
//# sourceMappingURL=ZUpdatables.d.ts.map