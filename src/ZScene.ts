import { ZButton } from './ZButton';
import { ZContainer } from './ZContainer';
import { ZTimeline } from './ZTimeline';
import {
    AnimTrackData, BaseAssetData, InstanceData, NineSliceData,
    SceneData, SpriteData, TemplateData, TextData
} from './SceneData';
import { ZState } from './ZState';
import { ZToggle } from './ZToggle';

export type AssetType =
    | 'btn' | 'asset' | 'state' | 'toggle' | 'none'
    | 'slider' | 'scrollBar' | 'fullScreen' | 'animation';

/**
 * HTML div–based ZScene.
 *
 * Loads `placements.json` from an asset base path, constructs the scene
 * hierarchy as nested `ZContainer` divs, scales and centres the stage to
 * fit the viewport, and exposes the same public API as the PIXI / Phaser
 * versions of zImporter.
 *
 * Spine and particle assets are silently skipped (not supported in HTML).
 */
export class ZScene {

    static assetTypes: Map<AssetType, any> = new Map([
        ['btn', ZButton],
        ['asset', ZContainer],
        ['state', ZState],
        ['toggle', ZToggle],
        ['slider', ZContainer],   // sliders rendered as plain containers for now
        ['scrollBar', ZContainer],
        ['fullScreen', ZContainer],
        ['animation', ZTimeline],
    ]);

    private assetBasePath: string = '';
    private data!: SceneData;
    private _sceneStage: ZContainer = new ZContainer();
    private resizeMap: Map<ZContainer, boolean> = new Map();
    private static SceneMap: Map<string, ZScene> = new Map();
    private sceneId: string;
    private orientation: 'landscape' | 'portrait' = 'portrait';

    /** Atlas frame rects keyed by frame name (no _IMG suffix). Populated when atlas:true. */
    private atlasFrames: Record<string, { x: number; y: number; w: number; h: number }> = {};
    /** Full URL of the atlas image (ta.png). */
    private atlasImageUrl: string = '';
    /** Full atlas image dimensions (needed for background-size). */
    private atlasSize: { w: number; h: number } = { w: 0, h: 0 };

    // ── Accessors ─────────────────────────────────────────────────────────────

    public get sceneStage(): ZContainer {
        return this._sceneStage;
    }

    public get sceneWidth(): number {
        return this.orientation === 'portrait'
            ? this.data.resolution.y : this.data.resolution.x;
    }

    public get sceneHeight(): number {
        return this.orientation === 'portrait'
            ? this.data.resolution.x : this.data.resolution.y;
    }

    // ── Construction ──────────────────────────────────────────────────────────

    constructor(sceneId: string) {
        this.sceneId = sceneId;
        this.setOrientation();
        ZScene.SceneMap.set(sceneId, this);
    }

    public setOrientation(): void {
        this.orientation = window.innerWidth > window.innerHeight
            ? 'landscape' : 'portrait';
    }

    public static getSceneById(sceneId: string): ZScene | undefined {
        return ZScene.SceneMap.get(sceneId);
    }

    // ── Loading ───────────────────────────────────────────────────────────────

    /**
     * Fetches `placements.json` (and `ta.json` when atlas:true) from
     * `assetBasePath` and builds the scene.
     */
    async load(
        assetBasePath: string,
        onComplete: () => void
    ): Promise<void> {
        this.assetBasePath = assetBasePath.endsWith('/') ? assetBasePath : assetBasePath + '/';
        const url = this.assetBasePath + 'placements.json?rnd=' + Math.random();
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data: SceneData = await res.json();

            // If the scene uses a texture atlas, load ta.json so we can do
            // CSS-sprite cropping for every img/9slice frame.
            if (data.atlas === true) {
                await this._loadAtlas();
            }

            this.initScene(data);
            onComplete();
        } catch (err) {
            console.error('[ZScene] Failed to load placements.json:', err);
        }
    }

    /** Fetches ta.json and ta.png metadata and caches the frame rects. */
    private async _loadAtlas(): Promise<void> {
        const atlasUrl = this.assetBasePath + 'ta.json?rnd=' + Math.random();
        try {
            const res = await fetch(atlasUrl);
            if (!res.ok) return; // no atlas available — fall back to individual images
            const json = await res.json();

            // TexturePacker JSON-hash format: { frames: { name: { frame:{x,y,w,h} } }, meta: { image, size } }
            const frames = json.frames as Record<string, any>;
            for (const key in frames) {
                const f = frames[key].frame ?? frames[key];
                this.atlasFrames[key] = { x: f.x, y: f.y, w: f.w, h: f.h };
            }

            const meta = json.meta ?? {};
            const imageFile = meta.image ?? 'ta.png';
            this.atlasImageUrl = this.assetBasePath + imageFile;
            this.atlasSize = { w: meta.size?.w ?? 0, h: meta.size?.h ?? 0 };
        } catch (err) {
            console.warn('[ZScene] Could not load atlas ta.json:', err);
        }
    }

    public initScene(data: SceneData): void {
        this.data = data;
    }

    // ── Stage / resize ────────────────────────────────────────────────────────

    /**
     * Builds the scene's div hierarchy and appends it to `hostElement`.
     * @param hostElement - The DOM node that will contain the stage (default: document.body).
     */
    loadStage(
        hostElement: HTMLElement = document.body,
        loadChildren: boolean = true
    ): void {
        // Style the stage element to have an explicit internal resolution
        // so child coordinates match scene units.
        const stageEl = this._sceneStage.el;
        stageEl.style.position = 'absolute';
        stageEl.style.transformOrigin = '0 0';
        stageEl.style.overflow = 'hidden';

        this.resize(window.innerWidth, window.innerHeight);

        if (loadChildren && this.data?.stage?.children) {
            for (const child of this.data.stage.children) {
                const instanceData = child as InstanceData;
                if (instanceData.guide) continue;
                const mc = this.spawn(instanceData.name);
                if (mc) {
                    mc.setInstanceData(instanceData, this.orientation);
                    this.addToResizeMap(mc);
                    this._sceneStage.addChild(mc);
                    (this._sceneStage as any)[mc.name] = mc;
                }
            }
        }

        hostElement.appendChild(stageEl);
        this.resize(window.innerWidth, window.innerHeight);
    }

    public addToResizeMap(mc: ZContainer): void {
        this.resizeMap.set(mc, true);
    }

    public removeFromResizeMap(mc: ZContainer): void {
        this.resizeMap.delete(mc);
    }

    public getInnerDimensions(): { width: number; height: number } {
        return { width: this.sceneWidth, height: this.sceneHeight };
    }

    /**
     * Scales and centres the stage div to fill the viewport while preserving
     * the scene's internal aspect ratio. Mirrors ZScene.resize in PIXI.
     */
    public resize(width: number, height: number): void {
        if (!this.data?.resolution) return;

        this.setOrientation();
        const baseW = this.sceneWidth;
        const baseH = this.sceneHeight;
        const scale = Math.min(width / baseW, height / baseH);

        const stageEl = this._sceneStage.el;
        stageEl.style.width = baseW + 'px';
        stageEl.style.height = baseH + 'px';

        // Use CSS transform for scale + centering
        const offsetX = (width - baseW * scale) / 2;
        const offsetY = (height - baseH * scale) / 2;
        stageEl.style.transform =
            `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;

        // mirror on the ZContainer for ZContainer.scale / position reads
        this._sceneStage.scaleX = scale;
        this._sceneStage.scaleY = scale;

        for (const [mc] of this.resizeMap) {
            mc.resize(width, height, this.orientation);
        }
    }

    // ── Template spawning ─────────────────────────────────────────────────────

    spawn(tempName: string): ZContainer | undefined {
        const templates = this.data.templates;
        const baseNode = templates[tempName];
        if (!baseNode) return undefined;

        const frames = this.getChildrenFrames(tempName);
        let mc: ZContainer;

        if (Object.keys(frames).length > 0) {
            mc = new ZTimeline();
            this.createAsset(mc, baseNode);
            (mc as ZTimeline).setFrames(frames);
            if (this.data.cuePoints?.[tempName]) {
                (mc as ZTimeline).setCuePoints(this.data.cuePoints[tempName]);
            }
            (mc as ZTimeline).gotoAndStop(0);
        } else {
            const Ctor = ZScene.getAssetType(baseNode.type) ?? ZContainer;
            mc = new Ctor();
            this.createAsset(mc, baseNode);
            mc.init();
        }

        return mc;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Asset creation
    // ─────────────────────────────────────────────────────────────────────────

    createAsset(mc: ZContainer, baseNode: TemplateData): void {
        for (const childNode of baseNode.children) {
            const _name = childNode.name;
            const type = childNode.type;

            // ── 1. Image ────────────────────────────────────────────────────
            if (type === 'img') {
                const spriteData = childNode as SpriteData;
                const img = this._createImageElement(spriteData);
                img.style.position = 'absolute';
                img.style.left = (spriteData.x || 0) + 'px';
                img.style.top = (spriteData.y || 0) + 'px';
                img.style.width = (spriteData.width || 0) + 'px';
                img.style.height = (spriteData.height || 0) + 'px';
                img.style.transformOrigin = '0 0';
                if (spriteData.pivotX || spriteData.pivotY) {
                    img.style.transform =
                        `translate(${-(spriteData.pivotX || 0)}px, ${-(spriteData.pivotY || 0)}px)`;
                }
                img.dataset.name = _name;
                (mc as any)[_name.replace(/_IMG$/, '')] = img;
                mc.el.appendChild(img);
            }

            // ── 2. Nine-slice ────────────────────────────────────────────────
            else if (type === '9slice') {
                const nsData = childNode as NineSliceData;
                const wrapper = this._createNineSliceElement(nsData);
                (mc as any)[_name.replace(/_9S$/, '')] = wrapper;
                mc.el.appendChild(wrapper);
            }

            // ── 3. Text / bitmap text ─────────────────────────────────────────
            else if (type === 'textField' || type === 'bitmapText' || type === 'bitmapFontLocked') {
                const textData = childNode as TextData;
                const container = this._createTextElement(textData);
                (mc as any)[_name] = container;
                mc.el.appendChild(container.el);
            }

            // ── 4. Sub-containers / buttons / states / timelines ──────────────
            else if (ZScene.isAssetType(type)) {
                const instanceData = childNode as InstanceData;
                if (instanceData.guide) continue;

                const frames = this.getChildrenFrames(_name);
                let asset: ZContainer;

                if (Object.keys(frames).length > 0) {
                    asset = new ZTimeline();
                    (asset as ZTimeline).setFrames(frames);
                    if (this.data.cuePoints?.[_name]) {
                        (asset as ZTimeline).setCuePoints(this.data.cuePoints[_name]);
                    }
                } else {
                    const Ctor = ZScene.getAssetType(type) ?? ZContainer;
                    asset = new Ctor();
                }

                asset.name = instanceData.instanceName;
                if (!asset.name) continue;

                (mc as any)[asset.name] = asset;
                asset.setInstanceData(instanceData, this.orientation);
                mc.addChild(asset);
                this.addToResizeMap(asset);

                // recurse into child template if it exists
                const childTemplate = this.data.templates[_name];
                if (childTemplate?.children) {
                    this.createAsset(asset, childTemplate);
                }

                asset.init();
            }

            // ── 5. Spine / particle — not supported in HTML ──────────────────
            else if (type === 'spine' || type === 'particle') {
                console.warn(`[ZScene] ${type} assets are not supported in the HTML renderer.`);
            }

            // ── Check for a child template (for non-asset-type children) ─────
            const childTemplate = this.data.templates?.[_name];
            if (childTemplate?.children && !ZScene.isAssetType(type)) {
                // Create a wrapper container and recurse
                const asset = new ZContainer();
                asset.name = _name;
                (mc as any)[_name] = asset;
                mc.addChild(asset);
                this.createAsset(asset, childTemplate);
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DOM element factories
    // ─────────────────────────────────────────────────────────────────────────

    private _createImageElement(data: SpriteData): HTMLElement {
        // Frame name in the atlas is the sprite name without the _IMG suffix.
        const frameName = data.name.replace(/_IMG$/, '');
        const atlasFrame = this.atlasFrames[frameName];

        if (atlasFrame && this.atlasImageUrl) {
            // ── Atlas path: CSS-sprite crop from ta.png ────────────────────
            // The frame is at (atlasFrame.x, atlasFrame.y) inside the atlas.
            // We want to display it at the sprite's intended size (data.width × data.height).
            // CSS background-size scales the whole atlas sheet; we compute the
            // scale factor so the frame region fills the div exactly.
            const scaleX = (data.width || atlasFrame.w) / atlasFrame.w;
            const scaleY = (data.height || atlasFrame.h) / atlasFrame.h;
            const bgW = this.atlasSize.w * scaleX;
            const bgH = this.atlasSize.h * scaleY;
            const bgX = -atlasFrame.x * scaleX;
            const bgY = -atlasFrame.y * scaleY;

            const div = document.createElement('div');
            div.style.userSelect = 'none';
            div.style.backgroundImage = `url(${this.atlasImageUrl})`;
            div.style.backgroundRepeat = 'no-repeat';
            div.style.backgroundSize = `${bgW}px ${bgH}px`;
            div.style.backgroundPosition = `${bgX}px ${bgY}px`;
            div.dataset.frameName = frameName;
            return div;
        }

        // ── Individual image path ──────────────────────────────────────────
        const img = document.createElement('img');
        img.style.userSelect = 'none';
        img.draggable = false;
        if (data.filePath) {
            const cleanPath = data.filePath.replace(/^\.\//,'');
            img.src = this.assetBasePath + cleanPath;
        }
        return img;
    }

    private _createNineSliceElement(data: NineSliceData): HTMLDivElement {
        const div = document.createElement('div');
        div.style.position = 'absolute';
        div.style.left = (data.x || 0) + 'px';
        div.style.top = (data.y || 0) + 'px';

        // Use CSS border-image for 9-slice
        const src = this.assetBasePath + (data.filePath || '');
        const { top: t, right: r, bottom: b, left: l } = data;
        const origW = data.origWidth || data.width || 100;
        const origH = data.origHeight || data.height || 100;

        div.style.width = (data.width || origW) + 'px';
        div.style.height = (data.height || origH) + 'px';

        if (src && t != null) {
            div.style.borderImage = `url(${src}) ${t} ${r} ${b} ${l} fill / ${t}px ${r}px ${b}px ${l}px`;
        } else if (src) {
            div.style.backgroundImage = `url(${src})`;
            div.style.backgroundSize = '100% 100%';
        }

        div.dataset.name = data.name;
        return div;
    }

    private _createTextElement(data: TextData): ZContainer {
        const wrapper = new ZContainer();
        wrapper.name = data.name;
        wrapper.x = data.x || 0;
        wrapper.y = data.y || 0;
        (wrapper as any)._applyTransformPublic?.();

        const span = document.createElement('span');
        span.classList.add('z-text');
        span.textContent = data.text ?? '';

        // Font size
        const fontSize = typeof data.size === 'number' ? data.size : parseFloat(String(data.size));
        if (!isNaN(fontSize)) span.style.fontSize = fontSize + 'px';

        // Color
        if (data.color != null) {
            span.style.color = typeof data.color === 'number'
                ? '#' + data.color.toString(16).padStart(6, '0')
                : data.color;
        }

        // Font family
        if (data.fontName) {
            span.style.fontFamily = Array.isArray(data.fontName)
                ? data.fontName.join(', ')
                : data.fontName;
        }

        // font-weight: CSS keyword values are lowercase ('normal', 'bold')
        if (data.fontWeight) span.style.fontWeight = data.fontWeight.toLowerCase();
        if (data.lineHeight) span.style.lineHeight = data.lineHeight + 'px';

        // Set an explicit width when available so text-align works correctly.
        // Also used as the box for percentage-based translate centering.
        if (data.width) span.style.width = data.width + 'px';
        if (data.align) span.style.textAlign = data.align as any;

        // Word wrap
        if (data.wordWrap) {
            span.style.whiteSpace = 'normal';
            if (data.wordWrapWidth) span.style.width = data.wordWrapWidth + 'px';
        } else {
            span.style.whiteSpace = 'nowrap';
        }

        // Text stroke.
        // IMPORTANT: use paint-order:stroke fill so the white fill renders on
        // top of the stroke (default CSS paint-order is fill→stroke which puts
        // a thick stroke ON TOP of the fill, making white text appear dark).
        if (data.stroke && data.strokeThickness) {
            const strokeColor = typeof data.stroke === 'number'
                ? '#' + data.stroke.toString(16).padStart(6, '0')
                : data.stroke as string;
            span.style.webkitTextStroke = `${data.strokeThickness}px ${strokeColor}`;
            (span.style as any).paintOrder = 'stroke fill';
        }

        // Position the span based on anchor.
        // translate(-50%,-50%) centers the span on its origin point when
        // textAnchorX/Y are 0.5.
        span.style.position = 'absolute';
        const ancX = data.textAnchorX ?? 0;
        const ancY = data.textAnchorY ?? 0;
        if (ancX !== 0 || ancY !== 0) {
            span.style.transform = `translate(${-ancX * 100}%, ${-ancY * 100}%)`;
        }

        span.style.display = 'inline-block';
        wrapper.el.appendChild(span);
        return wrapper;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Frame / animation helpers
    // ─────────────────────────────────────────────────────────────────────────

    getChildrenFrames(templateName: string): Record<string, AnimTrackData[]> {
        const frames: Record<string, AnimTrackData[]> = {};
        const templates = this.data?.templates;
        const animTracks = this.data?.animTracks ?? {};
        const baseNode = templates?.[templateName];

        if (baseNode?.children) {
            for (const child of baseNode.children) {
                const instanceData = child as InstanceData;
                const childInstanceName = instanceData.instanceName;
                if (!childInstanceName) continue;
                const combinedName = childInstanceName + '_' + templateName;
                if (animTracks[combinedName]) {
                    frames[childInstanceName] = animTracks[combinedName];
                }
            }
        }
        return frames;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Static helpers
    // ─────────────────────────────────────────────────────────────────────────

    static getAssetType(value: string): (new () => ZContainer) | null {
        return this.assetTypes.get(value as AssetType) ?? null;
    }

    static isAssetType(value: string): value is AssetType {
        return this.assetTypes.has(value as AssetType);
    }

    degreesToRadians(degrees: number): number {
        return (degrees * Math.PI) / 180;
    }

    /**
     * Removes the scene's stage element from the DOM and clears the scene map.
     */
    destroy(): void {
        if (this._sceneStage.el.parentElement) {
            this._sceneStage.el.parentElement.removeChild(this._sceneStage.el);
        }
        ZScene.SceneMap.delete(this.sceneId);
    }
}
