import { InstanceData, OrientationData } from './SceneData';

/**
 * HTML div–based display object that mirrors the ZContainer interface from
 * the PIXI and Phaser versions of zImporter.
 *
 * Each ZContainer owns a single HTMLDivElement (`el`).  
 * The element is `position:absolute; left:0; top:0; width:0; height:0; overflow:visible`
 * so that children are positioned relative to its (0,0) origin and the
 * CSS transform maps 1-to-1 to PIXI's transform model:
 *
 *   T(x, y) · R(rotation) · S(scaleX, scaleY) · T(-pivotX, -pivotY)
 *
 * This is identical to how PIXI.Container resolves world coordinates.
 */
export class ZContainer {
    // ── DOM ──────────────────────────────────────────────────────────────────
    /** The root div element for this container. */
    readonly el: HTMLDivElement;

    // ── Orientation data ─────────────────────────────────────────────────────
    portrait!: OrientationData;
    landscape!: OrientationData;
    currentTransform!: OrientationData;

    // ── State flags ───────────────────────────────────────────────────────────
    resizeable: boolean = true;
    name: string = "";
    _fitToScreen: boolean = false;
    originalTextWidth?: number;
    originalTextHeight?: number;
    originalFontSize?: number;
    fixedBoxSize?: boolean;
    _props?: any;

    // ── Internal transform values ─────────────────────────────────────────────
    private _x: number = 0;
    private _y: number = 0;
    private _rotation: number = 0;
    private _scaleX: number = 1;
    private _scaleY: number = 1;
    private _pivotX: number = 0;
    private _pivotY: number = 0;
    private _alpha: number = 1;
    private _visible: boolean = true;

    // ── Interaction ───────────────────────────────────────────────────────────
    interactive: boolean = false;
    interactiveChildren: boolean = true;

    // ── Scene graph ───────────────────────────────────────────────────────────
    /** Typed child list (mirrors PIXI's children array). */
    children: ZContainer[] = [];
    parent: ZContainer | null = null;

    constructor() {
        this.el = document.createElement('div');
        this.el.style.cssText =
            'position:absolute;left:0;top:0;width:0;height:0;overflow:visible;transform-origin:0 0;';

        // Build the PIXI-compatible `scale` proxy that delegates to scaleX/Y setters.
        // `self` captures the ZContainer instance before TS readonly enforcement.
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;
        (this as any).scale = {
            get x() { return self._scaleX; },
            set x(v: number) { self.scaleX = v; },
            get y() { return self._scaleY; },
            set y(v: number) { self.scaleY = v; },
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Scene-graph: addChild / removeChild / getChild*
    // ─────────────────────────────────────────────────────────────────────────

    addChild(child: ZContainer): ZContainer {
        if (child.parent) {
            child.parent.removeChild(child);
        }
        child.parent = this;
        this.children.push(child);
        this.el.appendChild(child.el);
        return child;
    }

    removeChild(child: ZContainer): ZContainer {
        const idx = this.children.indexOf(child);
        if (idx !== -1) {
            this.children.splice(idx, 1);
            if (child.el.parentElement === this.el) {
                this.el.removeChild(child.el);
            }
            child.parent = null;
        }
        return child;
    }

    removeChildren(): void {
        for (const c of [...this.children]) this.removeChild(c);
    }

    getChildByName(name: string): ZContainer | null {
        for (const child of this.children) {
            if (child.name === name) return child;
        }
        return null;
    }

    getChildAt(index: number): ZContainer {
        return this.children[index];
    }

    // ── Breadth-first search helpers ──────────────────────────────────────────

    public get(childName: string): ZContainer | null {
        const queue: ZContainer[] = [...this.children];
        while (queue.length > 0) {
            const current = queue.shift()!;
            if (current.name === childName) return current;
            queue.push(...current.children);
        }
        return null;
    }

    public getAll(childName: string): ZContainer[] {
        const results: ZContainer[] = [];
        const queue: ZContainer[] = [...this.children];
        while (queue.length > 0) {
            const current = queue.shift()!;
            if (current.name === childName) results.push(current);
            queue.push(...current.children);
        }
        return results;
    }

    public getAllOfType(type: string): ZContainer[] {
        const results: ZContainer[] = [];
        const queue: ZContainer[] = [...this.children];
        while (queue.length > 0) {
            const current = queue.shift()!;
            if ((current as any).getType && (current as any).getType() === type) {
                results.push(current);
            }
            queue.push(...current.children);
        }
        return results;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Transform: PIXI-equivalent setters/getters
    // ─────────────────────────────────────────────────────────────────────────

    get x(): number { return this._x; }
    set x(value: number) {
        this._x = value;
        if (this.currentTransform) this.currentTransform.x = value;
        this._applyTransform();
    }

    get y(): number { return this._y; }
    set y(value: number) {
        this._y = value;
        if (this.currentTransform) this.currentTransform.y = value;
        this._applyTransform();
    }

    get rotation(): number { return this._rotation; }
    set rotation(value: number) {
        this._rotation = value;
        if (this.portrait) this.portrait.rotation = value;
        if (this.landscape) this.landscape.rotation = value;
        this._applyTransform();
    }

    get scaleX(): number { return this._scaleX; }
    set scaleX(value: number) {
        this._scaleX = value;
        if (this.currentTransform) this.currentTransform.scaleX = value;
        this._applyTransform();
    }

    get scaleY(): number { return this._scaleY; }
    set scaleY(value: number) {
        this._scaleY = value;
        if (this.currentTransform) this.currentTransform.scaleY = value;
        this._applyTransform();
    }

    get pivotX(): number { return this._pivotX; }
    set pivotX(value: number) {
        this._pivotX = value;
        if (this.currentTransform) this.currentTransform.pivotX = value;
        this._applyTransform();
    }

    get pivotY(): number { return this._pivotY; }
    set pivotY(value: number) {
        this._pivotY = value;
        if (this.currentTransform) this.currentTransform.pivotY = value;
        this._applyTransform();
    }

    get alpha(): number { return this._alpha; }
    set alpha(value: number) {
        this._alpha = value;
        this.el.style.opacity = String(value);
    }

    get visible(): boolean { return this._visible; }
    set visible(value: boolean) {
        this._visible = value;
        this.el.style.display = value ? '' : 'none';
    }

    /**
     * PIXI-compatible scale object. Setting `.x` / `.y` delegates to the
     * `scaleX` / `scaleY` setters so that ZScene can write
     * `stage.scale.x = s` exactly as in the PIXI version.
     *
     * Initialised in the constructor so `this` is captured correctly.
     */
    readonly scale!: { x: number; y: number };

    // ─────────────────────────────────────────────────────────────────────────
    // CSS transform writer
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Writes the CSS transform that replicates PIXI's:
     *   T(x,y) · R(rotation) · S(scaleX,scaleY) · T(-pivotX,-pivotY)
     */
    private _applyTransform(): void {
        const px = this._pivotX, py = this._pivotY;
        this.el.style.transform =
            `translate(${this._x}px,${this._y}px)` +
            ` rotate(${this._rotation}rad)` +
            ` scale(${this._scaleX},${this._scaleY})` +
            ` translate(${-px}px,${-py}px)`;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Instance data / orientation
    // ─────────────────────────────────────────────────────────────────────────

    public setInstanceData(data: InstanceData, orientation: string): void {
        this.portrait = data.portrait;
        this.landscape = data.landscape;
        this.currentTransform = orientation === 'portrait' ? this.portrait : this.landscape;
        this.name = data.instanceName || '';
        this._props = data;

        if (data.attrs?.fitToScreen !== undefined) {
            this._fitToScreen = data.attrs.fitToScreen;
        }

        this.applyTransform();
    }

    /**
     * Stretches this container to visually cover the entire browser viewport.
     * Mirrors PIXI's `executeFitToScreen` — positions the container at the
     * viewport's top-left (expressed in stage / scene-unit coords) and scales
     * the first child image element to fill the viewport dimensions.
     *
     * @param viewportW   - Current browser viewport width in CSS pixels.
     * @param viewportH   - Current browser viewport height in CSS pixels.
     * @param stageOffsetX - CSS-pixel X offset of the scaled stage from the viewport edge.
     * @param stageOffsetY - CSS-pixel Y offset of the scaled stage from the viewport edge.
     * @param stageScale   - Uniform CSS scale applied to the stage.
     */
    public executeFitToScreen(
        viewportW: number,
        viewportH: number,
        stageOffsetX: number,
        stageOffsetY: number,
        stageScale: number
    ): void {
        // Place this container so its (0,0) is at the viewport's top-left,
        // expressed in scene-unit coordinates.
        this._x = -stageOffsetX / stageScale;
        this._y = -stageOffsetY / stageScale;
        this._pivotX = 0;
        this._pivotY = 0;
        this._scaleX = 1;
        this._scaleY = 1;
        this._rotation = 0;
        this._applyTransform();

        const firstChild = this.el.firstElementChild as HTMLElement | null;
        if (!firstChild) return;

        // Get the frame's natural (authored) dimensions.
        let frameW: number;
        let frameH: number;
        if (firstChild.dataset.atlasFrameW) {
            frameW = parseFloat(firstChild.dataset.atlasFrameW!);
            frameH = parseFloat(firstChild.dataset.atlasFrameH!);
        } else {
            const img = firstChild as HTMLImageElement;
            frameW = img.naturalWidth  || parseFloat(firstChild.style.width)  || viewportW / stageScale;
            frameH = img.naturalHeight || parseFloat(firstChild.style.height) || viewportH / stageScale;
        }

        // Viewport in scene units.
        const vpW = viewportW / stageScale;
        const vpH = viewportH / stageScale;

        // "Cover" uniform scale: the image fills the viewport with no gaps,
        // overflowing on the shorter axis.  Center the overflow.
        const coverScale = Math.max(vpW / frameW, vpH / frameH);
        const displayW   = frameW * coverScale;
        const displayH   = frameH * coverScale;
        const imgLeft    = (vpW - displayW) / 2;
        const imgTop     = (vpH - displayH) / 2;

        firstChild.style.width  = displayW + 'px';
        firstChild.style.height = displayH + 'px';
        firstChild.style.left   = imgLeft + 'px';
        firstChild.style.top    = imgTop  + 'px';

        // Atlas CSS-sprite: recompute background-size / position with the
        // uniform coverScale so the frame crops correctly.
        if (firstChild.dataset.atlasFrameW) {
            const fx = parseFloat(firstChild.dataset.atlasFrameX!);
            const fy = parseFloat(firstChild.dataset.atlasFrameY!);
            const tw = parseFloat(firstChild.dataset.atlasTotalW!);
            const th = parseFloat(firstChild.dataset.atlasTotalH!);
            firstChild.style.backgroundSize     = `${tw * coverScale}px ${th * coverScale}px`;
            firstChild.style.backgroundPosition = `${-fx * coverScale}px ${-fy * coverScale}px`;
        }
    }

    public applyTransform(): void {
        if (!this.currentTransform || !this.resizeable) return;

        const t = this.currentTransform;
        this._x = t.x || 0;
        this._y = t.y || 0;
        this._rotation = t.rotation || 0;
        this._scaleX = t.scaleX ?? 1;
        this._scaleY = t.scaleY ?? 1;
        this._pivotX = t.pivotX || 0;
        this._pivotY = t.pivotY || 0;
        this.alpha = t.alpha ?? 1;
        this.visible = t.visible !== false;

        this._applyTransform();
        this._applyAnchor();
    }

    private _applyAnchor(): void {
        if (this.currentTransform?.isAnchored && this.parent) {
            const xPer = this.currentTransform.anchorPercentage?.x ?? 0;
            const yPer = this.currentTransform.anchorPercentage?.y ?? 0;
            // Convert screen-percentage to scene space:
            // parent.el is the stage, its scale is already applied.
            // We get scene-space coords by dividing by the stage's CSS scale.
            const stageScale = this._getStageScale();
            this._x = (xPer * window.innerWidth) / stageScale;
            this._y = (yPer * window.innerHeight) / stageScale;
            this._applyTransform();
        }
    }

    private _getStageScale(): number {
        let node: ZContainer | null = this.parent;
        while (node) {
            if (!node.parent) {
                // root stage node — its scaleX is the scene scale
                return node._scaleX || 1;
            }
            node = node.parent;
        }
        return 1;
    }

    public resize(width: number, height: number, orientation: 'portrait' | 'landscape'): void {
        this.currentTransform = orientation === 'portrait' ? this.portrait : this.landscape;
        this.applyTransform();
    }

    public isAnchored(): boolean {
        return !!(this.currentTransform?.isAnchored);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    public setAlpha(value: number): void {
        this.alpha = value;
        if (this.portrait) this.portrait.alpha = value;
        if (this.landscape) this.landscape.alpha = value;
    }

    public getAlpha(): number { return this._alpha; }

    public setVisible(value: boolean): void {
        this.visible = value;
        if (this.portrait) this.portrait.visible = value;
        if (this.landscape) this.landscape.visible = value;
    }

    public getVisible(): boolean { return this._visible; }

    public getProps(): any { return this._props; }

    public getType(): string { return 'ZContainer'; }

    public setFixedBoxSize(value: boolean): void { this.fixedBoxSize = value; }

    // ─────────────────────────────────────────────────────────────────────────
    // Text helpers
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Finds the first text element (a `<span class="z-text">`) among children.
     * Mirrors PIXI's `getTextField()`.
     */
    public getTextField(): HTMLElement | null {
        // Check for a child ZContainer named "label" first
        const labelChild = this.getChildByName('label');
        if (labelChild) {
            const span = labelChild.el.querySelector('.z-text') as HTMLElement;
            if (span) return span;
        }
        // Fall back to first .z-text in this element
        return this.el.querySelector('.z-text');
    }

    public setText(text: string): void {
        const tf = this.getTextField();
        if (tf) {
            tf.textContent = text;
            if (this.fixedBoxSize) this._resizeText(tf);
        }
    }

    public setTextStyle(data: Partial<CSSStyleDeclaration>): void {
        const tf = this.getTextField();
        if (!tf) return;
        Object.assign(tf.style, data);
    }

    public getTextStyle(): CSSStyleDeclaration | null {
        const tf = this.getTextField();
        return tf ? tf.style : null;
    }

    private _resizeText(el: HTMLElement): void {
        if (!this.fixedBoxSize) return;
        const maxW = this.originalTextWidth ?? Infinity;
        const maxH = this.originalTextHeight ?? Infinity;
        let size = this.originalFontSize ?? parseFloat(el.style.fontSize || '16');
        while (size > 1 && (el.scrollWidth > maxW || el.scrollHeight > maxH)) {
            size -= 1;
            el.style.fontSize = size + 'px';
        }
    }

    /** Called once all children have been added. Captures original text dimensions. */
    public init(): void {
        const tf = this.getTextField();
        if (tf) {
            this.setFixedBoxSize(false);
            this.originalTextWidth = tf.offsetWidth;
            this.originalTextHeight = tf.offsetHeight;
            this.originalFontSize = parseFloat(tf.style.fontSize || getComputedStyle(tf).fontSize);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // cursor shim (used by ZToggle / ZButton)
    // ─────────────────────────────────────────────────────────────────────────
    set cursor(value: string) {
        this.el.style.cursor = value;
    }
    get cursor(): string {
        return this.el.style.cursor;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Event forwarding (mirrors PIXI EventEmitter used by ZButton)
    // ─────────────────────────────────────────────────────────────────────────

    private _listeners: Map<string, Set<Function>> = new Map();

    on(event: string, listener: Function): this {
        if (!this._listeners.has(event)) this._listeners.set(event, new Set());
        this._listeners.get(event)!.add(listener);
        this._syncDOMListeners(event);
        return this;
    }

    off(event: string, listener: Function): this {
        this._listeners.get(event)?.delete(listener);
        return this;
    }

    removeAllListeners(event?: string): this {
        if (event) {
            this._listeners.delete(event);
        } else {
            this._listeners.clear();
        }
        return this;
    }

    emit(event: string, ...args: any[]): void {
        this._listeners.get(event)?.forEach(fn => fn(...args));
    }

    /**
     * Maps the PIXI event names used by ZButton to their DOM equivalents
     * and attaches a single delegating DOM listener.
     */
    private _domListeners: Map<string, EventListenerOrEventListenerObject> = new Map();

    private _syncDOMListeners(pixiEvent: string): void {
        const domEvent = ZContainer._pixiToDom(pixiEvent);
        if (!domEvent || this._domListeners.has(pixiEvent)) return;
        const handler = (e: Event) => {
            const wrapped = ZContainer._wrapEvent(e);
            this._listeners.get(pixiEvent)?.forEach(fn => fn(wrapped));
        };
        this._domListeners.set(pixiEvent, handler);
        this.el.addEventListener(domEvent, handler as EventListener, { passive: true });
    }

    private static _pixiToDom(pixiEvent: string): string | null {
        const map: Record<string, string> = {
            mousedown: 'mousedown',
            mouseup: 'mouseup',
            mouseupoutside: 'mouseleave',
            mouseover: 'mouseenter',
            mouseout: 'mouseleave',
            touchstart: 'touchstart',
            touchend: 'touchend',
            touchendoutside: 'touchcancel',
            pointermove: 'pointermove',
        };
        return map[pixiEvent] ?? null;
    }

    private static _wrapEvent(e: Event): any {
        // Provide a minimal PIXI-like event object with `global` coords
        const point = e instanceof TouchEvent
            ? { x: e.changedTouches[0]?.clientX ?? 0, y: e.changedTouches[0]?.clientY ?? 0 }
            : e instanceof MouseEvent
                ? { x: e.clientX, y: e.clientY }
                : { x: 0, y: 0 };
        return { original: e, global: point, data: { global: point } };
    }
}
