import { ZContainer } from './ZContainer';
/**
 * HTML canvas–based Spine animation container.
 *
 * Uses @esotericsoftware/spine-canvas when it is available on
 * `window.spine` or via a global import. If the runtime is not found the
 * class degrades to an invisible ZContainer so the rest of the scene still
 * loads without errors.
 *
 * ### Usage
 * 1. Include the spine-canvas UMD bundle on the page before your game
 *    script (sets `window.spine`).
 * 2. In your scene JSON set the asset type to `"spine"` and supply
 *    `spineJson`, `spineAtlas`, and optional `skin` + `playOnStart`.
 * 3. Call `play(animationName, loop)` / `stop()` as needed.
 * 4. ZSpine automatically registers itself with ZUpdatables for its
 *    per-frame draw loop and unregisters on destroy.
 *
 * @remarks
 * ZTimeline-based animations remain the simpler path for frame-by-frame
 * tweens; ZSpine is only needed for skeletal-mesh animations exported
 * directly from Spine.
 */
export declare class ZSpine extends ZContainer {
    private canvas;
    private ctx;
    private skeleton;
    private animState;
    private lastTime;
    private _loaded;
    private _pendingAnim;
    /** Updatable adaptor registered with ZUpdatables. */
    private _updatable;
    constructor();
    getType(): string;
    /**
     * Load Spine assets and initialise the skeleton.
     *
     * @param basePath    URL prefix applied to all asset paths.
     * @param jsonPath    Spine JSON skeleton file (relative to basePath).
     * @param atlasPath   Spine atlas text file (relative to basePath).
     * @param pngPaths    Array of PNG texture file paths (relative to basePath).
     * @param skin        Optional skin name to activate (defaults to "default").
     * @param width       Canvas width in scene units.
     * @param height      Canvas height in scene units.
     */
    load(basePath: string, jsonPath: string, atlasPath: string, pngPaths: string[], skin?: string, width?: number, height?: number): Promise<void>;
    play(animationName: string, loop?: boolean): void;
    stop(): void;
    setSkin(skinName: string): void;
    private _update;
    destroy(): void;
}
//# sourceMappingURL=ZSpine.d.ts.map