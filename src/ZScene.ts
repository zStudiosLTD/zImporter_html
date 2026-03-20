import { ZButton } from './ZButton';
import { ZContainer } from './ZContainer';
import { ZTimeline } from './ZTimeline';
import { ZNineSlice } from './ZNineSlice';
import { ZScroll } from './ZScroll';
import { ZSlider } from './ZSlider';
import { ZTextInput } from './ZTextInput';
import { ZSpine } from './ZSpine';
import {
    AnimTrackData, BaseAssetData, GradientData, InstanceData, NineSliceData,
    SceneData, SpineData, SpriteData, TemplateData, TextData, TextInputData
} from './SceneData';

interface BitmapFontChar {
    x: number; y: number; w: number; h: number;
    xoffset: number; yoffset: number; xadvance: number;
}
interface BitmapFontData {
    img: HTMLImageElement;
    lineHeight: number;
    chars: Map<number, BitmapFontChar>;
}
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
        ['slider', ZSlider],
        ['scrollBar', ZScroll],
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
    /** Parsed bitmap fonts keyed by uniqueFontName (e.g. "Arial_1e00ffa19b9b_53"). */
    private bitmapFonts: Record<string, BitmapFontData> = {};

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
            // Default to true when atlas is null/undefined for backward compatibility
            // (old scenes use an atlas but don't have the atlas flag set).
            const isAtlas = (data.atlas === null || data.atlas === undefined) ? true : data.atlas;
            if (isAtlas) {
                await this._loadAtlas();
            }

            // Pre-load any bitmap fonts declared in the scene.
            if (data.fonts && data.fonts.length > 0) {
                await this._loadFonts(data.fonts);
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

    // ── Bitmap font loading ───────────────────────────────────────────────────

    private async _loadFonts(fontNames: string[]): Promise<void> {
        await Promise.all(fontNames.map(n => this._loadBitmapFont(n)));
    }

    private async _loadBitmapFont(fontName: string): Promise<void> {
        try {
            const fntUrl = this.assetBasePath + "bitmapFonts/" + fontName + '.fnt?rnd=' + Math.random();
            const res = await fetch(fntUrl);
            if (!res.ok) return;
            const xml = await res.text();

            const doc = new DOMParser().parseFromString(xml, 'text/xml');
            const lineHeight = parseInt(
                doc.querySelector('common')?.getAttribute('lineHeight') ?? '64', 10);

            const chars = new Map<number, BitmapFontChar>();
            doc.querySelectorAll('char').forEach(el => {
                const id = parseInt(el.getAttribute('id')!, 10);
                chars.set(id, {
                    x: parseInt(el.getAttribute('x')!, 10),
                    y: parseInt(el.getAttribute('y')!, 10),
                    w: parseInt(el.getAttribute('width')!, 10),
                    h: parseInt(el.getAttribute('height')!, 10),
                    xoffset: parseInt(el.getAttribute('xoffset')!, 10),
                    yoffset: parseInt(el.getAttribute('yoffset')!, 10),
                    xadvance: parseInt(el.getAttribute('xadvance')!, 10),
                });
            });

            const img = new Image();
            await new Promise<void>(resolve => {
                img.onload = () => resolve();
                img.onerror = () => resolve();
                img.src = this.assetBasePath + "bitmapFonts/" + fontName + '.png?rnd=' + Math.random();
            });

            this.bitmapFonts[fontName] = { img, lineHeight, chars };
        } catch (e) {
            console.warn('[ZScene] Could not load bitmap font:', fontName, e);
        }
    }

    // ── Bitmap text canvas renderer ───────────────────────────────────────────

    /**
     * Renders a bitmapText node onto a <canvas> using the pre-parsed glyph
     * atlas.  Supports solid-colour and vertical-gradient fills, plus a
     * shadow-based stroke outline that matches PIXI's strokeThickness.
     */
    private _createBitmapTextCanvas(data: TextData, fontData: BitmapFontData): HTMLCanvasElement {
        const text = data.text ?? '';
        const lineH = fontData.lineHeight;
        const strokeThick = data.strokeThickness ?? 0;
        const pad = Math.ceil(strokeThick);

        // Measure total advance width.
        let textW = 0;
        for (const ch of text) {
            const cd = fontData.chars.get(ch.charCodeAt(0));
            if (cd) textW += cd.xadvance;
        }

        const canvasW = textW + pad * 2;
        const canvasH = lineH + pad * 2;

        // ── Offscreen canvas A: raw glyph alpha mask ──────────────────────────
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = canvasW;
        maskCanvas.height = canvasH;
        const maskCtx = maskCanvas.getContext('2d')!;

        let cx = pad;
        for (const ch of text) {
            const cd = fontData.chars.get(ch.charCodeAt(0));
            if (!cd) continue;
            if (cd.w > 0 && cd.h > 0) {
                maskCtx.drawImage(
                    fontData.img,
                    cd.x, cd.y, cd.w, cd.h,
                    cx + cd.xoffset, pad + cd.yoffset, cd.w, cd.h
                );
            }
            cx += cd.xadvance;
        }

        // ── Offscreen canvas B: fill tint (gradient or solid) ─────────────────
        const fillCanvas = document.createElement('canvas');
        fillCanvas.width = canvasW;
        fillCanvas.height = canvasH;
        const fillCtx = fillCanvas.getContext('2d')!;

        // Draw the glyph mask first, then apply fill colour on top via
        // source-in so only the glyph shape is coloured.
        fillCtx.drawImage(maskCanvas, 0, 0);
        fillCtx.globalCompositeOperation = 'source-in';

        if (data.fillType === 'gradient' && data.gradientData) {
            const gd = data.gradientData as GradientData;
            const horiz = gd.fillGradientType === 1;
            const grad = horiz
                ? fillCtx.createLinearGradient(pad, 0, textW + pad, 0)
                : fillCtx.createLinearGradient(0, pad, 0, lineH + pad);
            gd.colors.forEach((c, i) => {
                grad.addColorStop(
                    gd.percentages[i] ?? i / (gd.colors.length - 1),
                    '#' + c.toString(16).padStart(6, '0')
                );
            });
            fillCtx.fillStyle = grad;
        } else {
            const c = data.color;
            fillCtx.fillStyle = c == null ? '#ffffff'
                : typeof c === 'number' ? '#' + c.toString(16).padStart(6, '0')
                    : c;
        }
        fillCtx.fillRect(0, 0, canvasW, canvasH);

        // ── Final canvas: stroke shadow behind, fill on top ───────────────────
        const canvas = document.createElement('canvas');
        canvas.width = canvasW;
        canvas.height = canvasH;
        const ctx = canvas.getContext('2d')!;

        if (strokeThick > 0 && data.stroke) {
            const strokeC = typeof data.stroke === 'number'
                ? '#' + data.stroke.toString(16).padStart(6, '0')
                : data.stroke as string;
            // Draw mask with shadow to produce an outline behind the fill.
            ctx.save();
            ctx.shadowColor = strokeC;
            ctx.shadowBlur = strokeThick;
            ctx.drawImage(maskCanvas, 0, 0);
            ctx.restore();
            // Clear the glyph pixels themselves (leave only the shadow halo).
            ctx.globalCompositeOperation = 'destination-out';
            ctx.drawImage(maskCanvas, 0, 0);
            ctx.globalCompositeOperation = 'source-over';
        }

        // Composite coloured fill on top.
        ctx.drawImage(fillCanvas, 0, 0);

        return canvas;
    }

    public initScene(data: SceneData): void {
        this.data = data;
        // Give the stage element an id matching its scene name.
        if (data.stage?.name) {
            this._sceneStage.name = data.stage.name;
        }
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
        // Do NOT set overflow:hidden here — fullscreen backgrounds need to
        // bleed past the stage bounds to cover the whole viewport.

        this.resize(window.innerWidth, window.innerHeight);

        if (loadChildren && this.data?.stage?.children) {
            for (const child of this.data.stage.children) {
                const instanceData = child as InstanceData;
                if (instanceData.guide) continue;
                const mc = this.spawn(instanceData.name);
                if (mc) {
                    // addChild before setInstanceData so parent is set when
                    // _applyAnchor runs inside applyTransform().
                    this._sceneStage.addChild(mc);
                    mc.setInstanceData(instanceData, this.orientation);
                    this.addToResizeMap(mc);
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

        // Publish metrics so ZContainer._applyAnchor can convert viewport% → scene coords.
        ZContainer.stageOffsetX = offsetX;
        ZContainer.stageOffsetY = offsetY;
        ZContainer.stageScale = scale;

        for (const [mc] of this.resizeMap) {
            if (mc._fitToScreen) {
                mc.executeFitToScreen(width, height, offsetX, offsetY, scale);
            } else {
                mc.resize(width, height, this.orientation);
            }
        }

        // Second pass: re-apply anchors now that ALL containers in the resize
        // map have been updated to the new orientation.  This prevents the
        // chain-inversion from seeing stale _x/_y values on ancestor containers
        // that hadn't been processed yet in the first pass.
        for (const [mc] of this.resizeMap) {
            mc.reapplyAnchor();
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
                img.id = _name;
                img.dataset.name = _name;
                (mc as any)[_name.replace(/_IMG$/, '')] = img;
                mc.el.appendChild(img);
            }

            // ── 2. Nine-slice ────────────────────────────────────────────────
            else if (type === '9slice') {
                const nsData = childNode as NineSliceData;
                const ns = new ZNineSlice(nsData, this.orientation, this.assetBasePath);
                ns.name = _name.replace(/_9S$/, '');
                (mc as any)[ns.name] = ns;
                mc.addChild(ns);
                this.addToResizeMap(ns);
            }

            // ── 3. Text / bitmap text ─────────────────────────────────────────
            else if (type === 'textField' || type === 'bitmapText' || type === 'bitmapFontLocked') {
                const textData = childNode as TextData;
                const container = this._createTextElement(textData);
                container.el.id = _name;
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
                // addChild BEFORE setInstanceData so asset.parent is set when
                // _applyAnchor() runs inside applyTransform().
                mc.addChild(asset);
                asset.setInstanceData(instanceData, this.orientation);
                this.addToResizeMap(asset);

                // recurse into child template if it exists
                const childTemplate = this.data.templates[_name];
                if (childTemplate?.children) {
                    this.createAsset(asset, childTemplate);
                }

                asset.init();
            }

            // ── 5. Input field ────────────────────────────────────────────────
            else if (type === 'inputField') {
                const inputData = childNode as TextInputData;
                const textInput = new ZTextInput(inputData);
                textInput.name = _name;
                textInput.x = inputData.x || 0;
                textInput.y = inputData.y || 0;
                (mc as any)[_name] = textInput;
                mc.addChild(textInput);
                this.addToResizeMap(textInput);
            }

            // ── 6. Spine ──────────────────────────────────────────────────────
            else if (type === 'spine') {
                const spineData = childNode as SpineData;
                const spineObj = new ZSpine();
                spineObj.name = _name;
                (mc as any)[_name] = spineObj;
                mc.addChild(spineObj);
                this.addToResizeMap(spineObj);
                spineObj.load(
                    this.assetBasePath,
                    spineData.spineJson,
                    spineData.spineAtlas,
                    spineData.pngFiles ?? [],
                    spineData.skin ?? 'default',
                ).then(() => {
                    if (spineData.playOnStart?.value) {
                        spineObj.play(spineData.playOnStart.animation, true);
                    }
                });
            }

            // ── 7. Particle — not supported in HTML ───────────────────────────
            else if (type === 'particle') {
                console.warn('[ZScene] particle assets are not supported in the HTML renderer.');
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
            // Store the raw atlas values so executeFitToScreen can recompute
            // the background-size/position when the container is stretched to
            // fill the viewport at a different size.
            div.dataset.atlasFrameX = String(atlasFrame.x);
            div.dataset.atlasFrameY = String(atlasFrame.y);
            div.dataset.atlasFrameW = String(atlasFrame.w);
            div.dataset.atlasFrameH = String(atlasFrame.h);
            div.dataset.atlasTotalW = String(this.atlasSize.w);
            div.dataset.atlasTotalH = String(this.atlasSize.h);
            return div;
        }

        // ── Individual image path ──────────────────────────────────────────
        const img = document.createElement('img');
        img.style.userSelect = 'none';
        img.draggable = false;
        if (data.filePath) {
            const cleanPath = data.filePath.replace(/^\.\//, '');
            img.src = this.assetBasePath + cleanPath;
        }
        return img;
    }



    private _createTextElement(data: TextData): ZContainer {
        const wrapper = new ZContainer();
        wrapper.name = data.name;
        wrapper.x = data.x || 0;
        wrapper.y = data.y || 0;
        (wrapper as any)._applyTransformPublic?.();

        // ── BitmapText path: render to <canvas> ───────────────────────────────
        const fontKey = data.uniqueFontName ?? (Array.isArray(data.fontName) ? data.fontName[0] : data.fontName);
        const fontData = fontKey ? this.bitmapFonts[fontKey] : undefined;

        if ((data.type === 'bitmapText' || data.type === 'bitmapFontLocked') && fontData) {
            const canvas = this._createBitmapTextCanvas(data, fontData);
            canvas.style.position = 'absolute';
            canvas.style.imageRendering = 'pixelated';

            // Apply anchor offset (same logic as span below).
            const ancX = data.textAnchorX ?? 0;
            const ancY = data.textAnchorY ?? 0;
            if (ancX !== 0 || ancY !== 0) {
                canvas.style.transform = `translate(${-ancX * 100}%, ${-ancY * 100}%)`;
            }

            wrapper.el.appendChild(canvas);
            return wrapper;
        }

        const span = document.createElement('span');
        span.classList.add('z-text');
        span.textContent = data.text ?? '';

        // Font size
        const fontSize = typeof data.size === 'number' ? data.size : parseFloat(String(data.size));
        if (!isNaN(fontSize)) span.style.fontSize = fontSize + 'px';

        // Color
        // Always set both `color` AND `-webkit-text-fill-color`.
        // When `-webkit-text-stroke` is applied later, WebKit requires an
        // explicit `-webkit-text-fill-color` to keep the fill visible;
        // without it the stroke colour can bleed into the fill.
        const fillColor = data.color != null
            ? (typeof data.color === 'number'
                ? '#' + data.color.toString(16).padStart(6, '0')
                : data.color)
            : null;
        if (fillColor) {
            span.style.color = fillColor;
            span.style.setProperty('-webkit-text-fill-color', fillColor);
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
        // Use setProperty for vendor-prefixed properties to guarantee they are
        // applied. paint-order:stroke fill draws the stroke first so the fill
        // colour sits on top (standard in Chrome/Firefox/Safari 15.4+).
        if (data.stroke && data.strokeThickness) {
            const strokeColor = typeof data.stroke === 'number'
                ? '#' + data.stroke.toString(16).padStart(6, '0')
                : data.stroke as string;
            span.style.setProperty('-webkit-text-stroke', `${data.strokeThickness}px ${strokeColor}`);
            span.style.setProperty('paint-order', 'stroke fill');
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
                } else {
                    // Fallback: the template name may contain underscores, causing the
                    // exporter (which splits on the last '_') to store the key with only
                    // part of the template name as the suffix. Re-derive the correct key
                    // by matching against all known template names.
                    for (const knownTemplate of Object.keys(templates)) {
                        const candidateKey = childInstanceName + '_' + knownTemplate;
                        if (animTracks[candidateKey]) {
                            frames[childInstanceName] = animTracks[candidateKey];
                            break;
                        }
                    }
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
     * Stops all playing timelines, removes the stage element from the DOM,
     * and clears internal maps.
     */
    destroy(): void {
        this._destroyTimelines(this._sceneStage);
        if (this._sceneStage.el.parentElement) {
            this._sceneStage.el.parentElement.removeChild(this._sceneStage.el);
        }
        this.resizeMap.clear();
        ZScene.SceneMap.delete(this.sceneId);
    }

    private _destroyTimelines(container: ZContainer): void {
        for (const child of container.children) {
            if (child instanceof ZTimeline) {
                child.destroy();
            } else {
                this._destroyTimelines(child);
            }
        }
    }
}
