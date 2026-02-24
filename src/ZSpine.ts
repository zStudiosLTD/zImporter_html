import { ZContainer } from './ZContainer';
import { ZUpdatables } from './ZUpdatables';

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
export class ZSpine extends ZContainer {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    // Spine runtime objects (typed as `any` to avoid a hard dependency).
    private skeleton: any = null;
    private animState: any = null;
    private lastTime: number = 0;
    private _loaded = false;
    private _pendingAnim: { name: string; loop: boolean } | null = null;
    /** Updatable adaptor registered with ZUpdatables. */
    private _updatable: { update: () => void };

    constructor() {
        super();

        this.canvas = document.createElement('canvas');
        this.canvas.style.position = 'absolute';
        this.canvas.style.pointerEvents = 'none';
        this.ctx = this.canvas.getContext('2d')!;

        this.el.appendChild(this.canvas);

        // Bind update once so we can remove the exact same reference later.
        this._updatable = { update: this._update.bind(this) };
    }

    public getType(): string { return 'ZSpine'; }

    // ─────────────────────────────────────────────────────────────────────────
    // Loading
    // ─────────────────────────────────────────────────────────────────────────

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
    public async load(
        basePath: string,
        jsonPath: string,
        atlasPath: string,
        pngPaths: string[],
        skin: string = 'default',
        width: number = 512,
        height: number = 512,
    ): Promise<void> {
        const spine = (window as any).spine;
        if (!spine) {
            console.warn('[ZSpine] spine runtime not found on window.spine — asset will be skipped.');
            return;
        }

        this.canvas.width = width;
        this.canvas.height = height;

        try {
            // Load atlas text.
            const atlasText = await fetch(basePath + atlasPath).then(r => r.text());

            // Load textures.
            const textures: Record<string, HTMLImageElement> = {};
            await Promise.all(pngPaths.map(p => new Promise<void>((resolve) => {
                const img = new Image();
                img.onload = () => { textures[p.split('/').pop()!] = img; resolve(); };
                img.onerror = () => resolve();
                img.src = basePath + p;
            })));

            // Build TextureAtlas.
            const atlasLoader = new spine.TextureAtlas(atlasText, (path: string) => {
                const img = textures[path];
                if (!img) { console.warn('[ZSpine] missing texture:', path); return null; }
                return new spine.canvas.CanvasTexture(img);
            });

            // Build skeleton.
            const atlasAttachmentLoader = new spine.AtlasAttachmentLoader(atlasLoader);
            const skeletonJson = new spine.SkeletonJson(atlasAttachmentLoader);
            const jsonText = await fetch(basePath + jsonPath).then(r => r.json());
            const skeletonData = skeletonJson.readSkeletonData(jsonText);
            this.skeleton = new spine.Skeleton(skeletonData);
            this.skeleton.setSkinByName(skin);
            this.skeleton.setToSetupPose();
            this.skeleton.updateWorldTransform();

            // Build animation state.
            const stateData = new spine.AnimationStateData(skeletonData);
            this.animState = new spine.AnimationState(stateData);

            this._loaded = true;
            ZUpdatables.addUpdateAble(this._updatable);

            // Play any animation that was queued before loading finished.
            if (this._pendingAnim) {
                this.play(this._pendingAnim.name, this._pendingAnim.loop);
                this._pendingAnim = null;
            }
        } catch (err) {
            console.error('[ZSpine] Failed to load spine asset:', err);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Playback API (mirrors Phaser ZSpine)
    // ─────────────────────────────────────────────────────────────────────────

    public play(animationName: string, loop: boolean = true): void {
        if (!this._loaded || !this.animState) {
            this._pendingAnim = { name: animationName, loop };
            return;
        }
        this.lastTime = 0;
        this.animState.setAnimation(0, animationName, loop);
    }

    public stop(): void {
        if (!this.animState) return;
        this.animState.clearTracks();
        this.skeleton?.setToSetupPose();
    }

    public setSkin(skinName: string): void {
        if (!this.skeleton) return;
        this.skeleton.setSkinByName(skinName);
        this.skeleton.setToSetupPose();
        this.skeleton.updateWorldTransform();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Per-frame update
    // ─────────────────────────────────────────────────────────────────────────

    private _update(): void {
        if (!this._loaded) return;

        const now = performance.now() / 1000;
        const delta = this.lastTime === 0 ? 0 : now - this.lastTime;
        this.lastTime = now;

        this.animState.update(delta);
        this.animState.apply(this.skeleton);
        this.skeleton.updateWorldTransform();

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const spine = (window as any).spine;
        if (spine?.canvas?.SkeletonRenderer) {
            const renderer = new spine.canvas.SkeletonRenderer(this.ctx);
            renderer.debugRendering = false;
            renderer.draw(this.skeleton);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Destroy
    // ─────────────────────────────────────────────────────────────────────────

    public destroy(): void {
        ZUpdatables.removeUpdateAble(this._updatable);
        if (this.el.parentElement) this.el.parentElement.removeChild(this.el);
    }
}
