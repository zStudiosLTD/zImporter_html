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
    el;
    // ── Orientation data ─────────────────────────────────────────────────────
    portrait;
    landscape;
    currentTransform;
    // ── State flags ───────────────────────────────────────────────────────────
    resizeable = true;
    name = "";
    _fitToScreen = false;
    originalTextWidth;
    originalTextHeight;
    originalFontSize;
    fixedBoxSize;
    _props;
    // ── Internal transform values ─────────────────────────────────────────────
    _x = 0;
    _y = 0;
    _rotation = 0;
    _scaleX = 1;
    _scaleY = 1;
    _pivotX = 0;
    _pivotY = 0;
    _alpha = 1;
    _visible = true;
    // ── Interaction ───────────────────────────────────────────────────────────
    interactive = false;
    interactiveChildren = true;
    // ── Scene graph ───────────────────────────────────────────────────────────
    /** Typed child list (mirrors PIXI's children array). */
    children = [];
    parent = null;
    constructor() {
        this.el = document.createElement('div');
        this.el.style.cssText =
            'position:absolute;left:0;top:0;width:0;height:0;overflow:visible;transform-origin:0 0;';
        // Build the PIXI-compatible `scale` proxy that delegates to scaleX/Y setters.
        // `self` captures the ZContainer instance before TS readonly enforcement.
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;
        this.scale = {
            get x() { return self._scaleX; },
            set x(v) { self.scaleX = v; },
            get y() { return self._scaleY; },
            set y(v) { self.scaleY = v; },
        };
    }
    // ─────────────────────────────────────────────────────────────────────────
    // Scene-graph: addChild / removeChild / getChild*
    // ─────────────────────────────────────────────────────────────────────────
    addChild(child) {
        if (child.parent) {
            child.parent.removeChild(child);
        }
        child.parent = this;
        this.children.push(child);
        this.el.appendChild(child.el);
        return child;
    }
    removeChild(child) {
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
    removeChildren() {
        for (const c of [...this.children])
            this.removeChild(c);
    }
    getChildByName(name) {
        for (const child of this.children) {
            if (child.name === name)
                return child;
        }
        return null;
    }
    getChildAt(index) {
        return this.children[index];
    }
    // ── Breadth-first search helpers ──────────────────────────────────────────
    get(childName) {
        const queue = [...this.children];
        while (queue.length > 0) {
            const current = queue.shift();
            if (current.name === childName)
                return current;
            queue.push(...current.children);
        }
        return null;
    }
    getAll(childName) {
        const results = [];
        const queue = [...this.children];
        while (queue.length > 0) {
            const current = queue.shift();
            if (current.name === childName)
                results.push(current);
            queue.push(...current.children);
        }
        return results;
    }
    getAllOfType(type) {
        const results = [];
        const queue = [...this.children];
        while (queue.length > 0) {
            const current = queue.shift();
            if (current.getType && current.getType() === type) {
                results.push(current);
            }
            queue.push(...current.children);
        }
        return results;
    }
    // ─────────────────────────────────────────────────────────────────────────
    // Transform: PIXI-equivalent setters/getters
    // ─────────────────────────────────────────────────────────────────────────
    get x() { return this._x; }
    set x(value) {
        this._x = value;
        if (this.currentTransform)
            this.currentTransform.x = value;
        this._applyTransform();
    }
    get y() { return this._y; }
    set y(value) {
        this._y = value;
        if (this.currentTransform)
            this.currentTransform.y = value;
        this._applyTransform();
    }
    get rotation() { return this._rotation; }
    set rotation(value) {
        this._rotation = value;
        if (this.portrait)
            this.portrait.rotation = value;
        if (this.landscape)
            this.landscape.rotation = value;
        this._applyTransform();
    }
    get scaleX() { return this._scaleX; }
    set scaleX(value) {
        this._scaleX = value;
        if (this.currentTransform)
            this.currentTransform.scaleX = value;
        this._applyTransform();
    }
    get scaleY() { return this._scaleY; }
    set scaleY(value) {
        this._scaleY = value;
        if (this.currentTransform)
            this.currentTransform.scaleY = value;
        this._applyTransform();
    }
    get pivotX() { return this._pivotX; }
    set pivotX(value) {
        this._pivotX = value;
        if (this.currentTransform)
            this.currentTransform.pivotX = value;
        this._applyTransform();
    }
    get pivotY() { return this._pivotY; }
    set pivotY(value) {
        this._pivotY = value;
        if (this.currentTransform)
            this.currentTransform.pivotY = value;
        this._applyTransform();
    }
    get alpha() { return this._alpha; }
    set alpha(value) {
        this._alpha = value;
        this.el.style.opacity = String(value);
    }
    get visible() { return this._visible; }
    set visible(value) {
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
    scale;
    // ─────────────────────────────────────────────────────────────────────────
    // CSS transform writer
    // ─────────────────────────────────────────────────────────────────────────
    /**
     * Writes the CSS transform that replicates PIXI's:
     *   T(x,y) · R(rotation) · S(scaleX,scaleY) · T(-pivotX,-pivotY)
     */
    _applyTransform() {
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
    setInstanceData(data, orientation) {
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
    applyTransform() {
        if (!this.currentTransform || !this.resizeable)
            return;
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
    _applyAnchor() {
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
    _getStageScale() {
        let node = this.parent;
        while (node) {
            if (!node.parent) {
                // root stage node — its scaleX is the scene scale
                return node._scaleX || 1;
            }
            node = node.parent;
        }
        return 1;
    }
    resize(width, height, orientation) {
        this.currentTransform = orientation === 'portrait' ? this.portrait : this.landscape;
        this.applyTransform();
    }
    isAnchored() {
        return !!(this.currentTransform?.isAnchored);
    }
    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────
    setAlpha(value) {
        this.alpha = value;
        if (this.portrait)
            this.portrait.alpha = value;
        if (this.landscape)
            this.landscape.alpha = value;
    }
    getAlpha() { return this._alpha; }
    setVisible(value) {
        this.visible = value;
        if (this.portrait)
            this.portrait.visible = value;
        if (this.landscape)
            this.landscape.visible = value;
    }
    getVisible() { return this._visible; }
    getProps() { return this._props; }
    getType() { return 'ZContainer'; }
    setFixedBoxSize(value) { this.fixedBoxSize = value; }
    // ─────────────────────────────────────────────────────────────────────────
    // Text helpers
    // ─────────────────────────────────────────────────────────────────────────
    /**
     * Finds the first text element (a `<span class="z-text">`) among children.
     * Mirrors PIXI's `getTextField()`.
     */
    getTextField() {
        // Check for a child ZContainer named "label" first
        const labelChild = this.getChildByName('label');
        if (labelChild) {
            const span = labelChild.el.querySelector('.z-text');
            if (span)
                return span;
        }
        // Fall back to first .z-text in this element
        return this.el.querySelector('.z-text');
    }
    setText(text) {
        const tf = this.getTextField();
        if (tf) {
            tf.textContent = text;
            if (this.fixedBoxSize)
                this._resizeText(tf);
        }
    }
    setTextStyle(data) {
        const tf = this.getTextField();
        if (!tf)
            return;
        Object.assign(tf.style, data);
    }
    getTextStyle() {
        const tf = this.getTextField();
        return tf ? tf.style : null;
    }
    _resizeText(el) {
        if (!this.fixedBoxSize)
            return;
        const maxW = this.originalTextWidth ?? Infinity;
        const maxH = this.originalTextHeight ?? Infinity;
        let size = this.originalFontSize ?? parseFloat(el.style.fontSize || '16');
        while (size > 1 && (el.scrollWidth > maxW || el.scrollHeight > maxH)) {
            size -= 1;
            el.style.fontSize = size + 'px';
        }
    }
    /** Called once all children have been added. Captures original text dimensions. */
    init() {
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
    set cursor(value) {
        this.el.style.cursor = value;
    }
    get cursor() {
        return this.el.style.cursor;
    }
    // ─────────────────────────────────────────────────────────────────────────
    // Event forwarding (mirrors PIXI EventEmitter used by ZButton)
    // ─────────────────────────────────────────────────────────────────────────
    _listeners = new Map();
    on(event, listener) {
        if (!this._listeners.has(event))
            this._listeners.set(event, new Set());
        this._listeners.get(event).add(listener);
        this._syncDOMListeners(event);
        return this;
    }
    off(event, listener) {
        this._listeners.get(event)?.delete(listener);
        return this;
    }
    removeAllListeners(event) {
        if (event) {
            this._listeners.delete(event);
        }
        else {
            this._listeners.clear();
        }
        return this;
    }
    emit(event, ...args) {
        this._listeners.get(event)?.forEach(fn => fn(...args));
    }
    /**
     * Maps the PIXI event names used by ZButton to their DOM equivalents
     * and attaches a single delegating DOM listener.
     */
    _domListeners = new Map();
    _syncDOMListeners(pixiEvent) {
        const domEvent = ZContainer._pixiToDom(pixiEvent);
        if (!domEvent || this._domListeners.has(pixiEvent))
            return;
        const handler = (e) => {
            const wrapped = ZContainer._wrapEvent(e);
            this._listeners.get(pixiEvent)?.forEach(fn => fn(wrapped));
        };
        this._domListeners.set(pixiEvent, handler);
        this.el.addEventListener(domEvent, handler, { passive: true });
    }
    static _pixiToDom(pixiEvent) {
        const map = {
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
    static _wrapEvent(e) {
        // Provide a minimal PIXI-like event object with `global` coords
        const point = e instanceof TouchEvent
            ? { x: e.changedTouches[0]?.clientX ?? 0, y: e.changedTouches[0]?.clientY ?? 0 }
            : e instanceof MouseEvent
                ? { x: e.clientX, y: e.clientY }
                : { x: 0, y: 0 };
        return { original: e, global: point, data: { global: point } };
    }
}
//# sourceMappingURL=ZContainer.js.map