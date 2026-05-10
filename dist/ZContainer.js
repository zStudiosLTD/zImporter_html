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
    // ── Stage metrics (set by ZScene.resize, read by _applyAnchor) ─────────
    /** Current CSS-pixel X offset of the stage from the viewport edge. */
    static stageOffsetX = 0;
    /** Current CSS-pixel Y offset of the stage from the viewport edge. */
    static stageOffsetY = 0;
    /** Current uniform CSS scale applied to the stage element. */
    static stageScale = 1;
    // ── Orientation data ─────────────────────────────────────────────────────
    portrait;
    landscape;
    currentTransform;
    // ── State flags ───────────────────────────────────────────────────────────
    resizeable = true;
    _name = "";
    get name() { return this._name; }
    set name(value) {
        this._name = value;
        if (value)
            this.el.id = value;
    }
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
    _skewX = 0;
    _skewY = 0;
    // ── Mask ─────────────────────────────────────────────────────────────────
    mask = null;
    _maskingTargets = [];
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
        this.skew = {
            get x() { return self._skewX; },
            set x(v) { self._skewX = v; self._applyTransform(); },
            get y() { return self._skewY; },
            set y(v) { self._skewY = v; self._applyTransform(); },
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
    skew;
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
                ` skewX(${this._skewX}rad) skewY(${this._skewY}rad)` +
                ` scale(${this._scaleX},${this._scaleY})` +
                ` translate(${-px}px,${-py}px)`;
        if (this._maskingTargets.length > 0)
            this._updateMaskTargets();
    }
    _updateMaskTargets() {
        for (const target of this._maskingTargets) {
            target._applyHtmlMask(this);
        }
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
        //at this moment the sybling that is masking may not be created yet. so wait. yes it's a hack for now...
        if (data.mask) {
            this.addMask(data.mask, 0);
        }
        this.applyTransform();
    }
    addMask(mskName, retry) {
        if (retry >= 3) {
            return;
        }
        setTimeout(() => {
            if (this.parent) {
                const sybling = this.parent.getChildByName(mskName);
                if (sybling) {
                    this.mask = sybling;
                    if (!sybling._maskingTargets.includes(this)) {
                        sybling._maskingTargets.push(this);
                    }
                    // The masker hides itself — its visual shape becomes the clip region.
                    sybling.el.style.visibility = 'hidden';
                    sybling.el.style.pointerEvents = 'none';
                    this._applyHtmlMask(sybling);
                }
                else {
                    this.addMask(mskName, retry + 1);
                }
            }
            else {
                this.addMask(mskName, retry + 1);
            }
        }, 50);
    }
    // Compute the bounding box of all visual content in this container's LOCAL space.
    // Uses CSS style values directly so it works even when the element is hidden.
    _getLocalBounds() {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        // Track which children elements belong to ZContainer children (to skip separately)
        const childEls = new Set(this.children.map(c => c.el));
        // Direct HTML children (imgs placed by createAsset)
        for (const node of this.el.children) {
            const el = node;
            if (childEls.has(el))
                continue;
            const w = parseFloat(el.style.width);
            const h = parseFloat(el.style.height);
            if (!(w > 0 && h > 0))
                continue;
            const l = parseFloat(el.style.left) || 0;
            const t = parseFloat(el.style.top) || 0;
            // img may carry translate(-pivotX, -pivotY) from createAsset's pivot handling
            const m = /translate\((-?[\d.]+)px,\s*(-?[\d.]+)px\)/.exec(el.style.transform || '');
            const tx = m ? parseFloat(m[1]) : 0;
            const ty = m ? parseFloat(m[2]) : 0;
            const ix = l + tx, iy = t + ty;
            if (ix < minX)
                minX = ix;
            if (ix + w > maxX)
                maxX = ix + w;
            if (iy < minY)
                minY = iy;
            if (iy + h > maxY)
                maxY = iy + h;
        }
        // ZContainer children — recurse and fold in their transforms
        for (const child of this.children) {
            const cb = child._getLocalBounds();
            if (!cb)
                continue;
            const cos = Math.cos(child._rotation);
            const sin = Math.sin(child._rotation);
            for (const [lx, ly] of [
                [cb.minX, cb.minY], [cb.maxX, cb.minY],
                [cb.maxX, cb.maxY], [cb.minX, cb.maxY],
            ]) {
                // Apply child's CSS transform: T(x,y) · rot · scale · T(-pivot)
                const ux = lx - child._pivotX;
                const uy = ly - child._pivotY;
                const rx = cos * ux * child._scaleX - sin * uy * child._scaleY + child._x;
                const ry = sin * ux * child._scaleX + cos * uy * child._scaleY + child._y;
                if (rx < minX)
                    minX = rx;
                if (rx > maxX)
                    maxX = rx;
                if (ry < minY)
                    minY = ry;
                if (ry > maxY)
                    maxY = ry;
            }
        }
        return isFinite(minX) ? { minX, minY, maxX, maxY } : null;
    }
    _applyHtmlMask(maskEl) {
        // Compute the mask element's visual bounds in its own local space,
        // then transform into the shared parent-local space.
        const lb = maskEl._getLocalBounds();
        if (!lb)
            return;
        const mcos = Math.cos(maskEl._rotation);
        const msin = Math.sin(maskEl._rotation);
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const [lx, ly] of [
            [lb.minX, lb.minY], [lb.maxX, lb.minY],
            [lb.maxX, lb.maxY], [lb.minX, lb.maxY],
        ]) {
            const ux = lx - maskEl._pivotX;
            const uy = ly - maskEl._pivotY;
            const rx = mcos * ux * maskEl._scaleX - msin * uy * maskEl._scaleY + maskEl._x;
            const ry = msin * ux * maskEl._scaleX + mcos * uy * maskEl._scaleY + maskEl._y;
            if (rx < minX)
                minX = rx;
            if (rx > maxX)
                maxX = rx;
            if (ry < minY)
                minY = ry;
            if (ry > maxY)
                maxY = ry;
        }
        if (!isFinite(minX))
            return;
        // Convert parent-local → this element's clip-path local space
        // by inverting this element's own transform.
        const cos = Math.cos(-this._rotation);
        const sin = Math.sin(-this._rotation);
        const localCorners = [
            [minX, minY], [maxX, minY], [maxX, maxY], [minX, maxY],
        ].map(([px, py]) => {
            const dx = px - this._x;
            const dy = py - this._y;
            const rx = cos * dx - sin * dy;
            const ry = sin * dx + cos * dy;
            const lx = rx / this._scaleX + this._pivotX;
            const ly = ry / this._scaleY + this._pivotY;
            return `${lx}px ${ly}px`;
        });
        this.el.style.clipPath = `polygon(${localCorners.join(', ')})`;
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
    executeFitToScreen(viewportW, viewportH, stageOffsetX, stageOffsetY, stageScale) {
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
        // querySelector('img') finds the image even when it's nested inside a child
        // ZContainer div (which has width:0;height:0 and is not itself an img).
        const firstChild = (this.el.querySelector('img') ?? this.el.firstElementChild);
        if (!firstChild)
            return;
        // Get the frame's natural (authored) dimensions.
        let frameW;
        let frameH;
        if (firstChild.dataset.atlasFrameW) {
            frameW = parseFloat(firstChild.dataset.atlasFrameW);
            frameH = parseFloat(firstChild.dataset.atlasFrameH);
        }
        else {
            const img = firstChild;
            frameW = img.naturalWidth || parseFloat(firstChild.style.width) || viewportW / stageScale;
            frameH = img.naturalHeight || parseFloat(firstChild.style.height) || viewportH / stageScale;
        }
        // Viewport in scene units.
        const vpW = viewportW / stageScale;
        const vpH = viewportH / stageScale;
        // "Cover" uniform scale: the image fills the viewport with no gaps,
        // overflowing on the shorter axis.  Center the overflow.
        const coverScale = Math.max(vpW / frameW, vpH / frameH);
        const displayW = frameW * coverScale;
        const displayH = frameH * coverScale;
        const imgLeft = (vpW - displayW) / 2;
        const imgTop = (vpH - displayH) / 2;
        firstChild.style.width = displayW + 'px';
        firstChild.style.height = displayH + 'px';
        firstChild.style.left = imgLeft + 'px';
        firstChild.style.top = imgTop + 'px';
        // Atlas CSS-sprite: recompute background-size / position with the
        // uniform coverScale so the frame crops correctly.
        if (firstChild.dataset.atlasFrameW) {
            const fx = parseFloat(firstChild.dataset.atlasFrameX);
            const fy = parseFloat(firstChild.dataset.atlasFrameY);
            const tw = parseFloat(firstChild.dataset.atlasTotalW);
            const th = parseFloat(firstChild.dataset.atlasTotalH);
            firstChild.style.backgroundSize = `${tw * coverScale}px ${th * coverScale}px`;
            firstChild.style.backgroundPosition = `${-fx * coverScale}px ${-fy * coverScale}px`;
        }
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
        // Apply Flash skew: skewY is Flash's X-axis angle, skewX is Y-axis angle.
        this._skewY = t.skewY !== undefined ? t.skewY - this._rotation : 0;
        this._skewX = t.skewX !== undefined ? this._rotation - t.skewX : 0;
        this._applyTransform();
        this._applyAnchor();
    }
    _applyAnchor() {
        this._doApplyAnchor();
    }
    /**
     * Public entry point for ZScene to re-run the anchor computation after all
     * containers in the resize map have been updated to the new orientation.
     * This guarantees that ancestor `_x / _y` values are current when chain
     * inversion runs.
     */
    reapplyAnchor() {
        if (this.currentTransform?.isAnchored)
            this._doApplyAnchor();
    }
    _doApplyAnchor() {
        if (!this.currentTransform?.isAnchored || !this.parent)
            return;
        const xPer = this.currentTransform.anchorPercentage?.x ?? 0;
        const yPer = this.currentTransform.anchorPercentage?.y ?? 0;
        // Step 1: Viewport % → stage (scene-unit) coordinates.
        // The stage element has CSS transform: translate(offsetX, offsetY) scale(stageScale)
        const sc = ZContainer.stageScale;
        let wx = (xPer * window.innerWidth - ZContainer.stageOffsetX) / sc;
        let wy = (yPer * window.innerHeight - ZContainer.stageOffsetY) / sc;
        // Step 2: Invert the full ancestor-chain transform to get parent-local coordinates.
        // Build the chain from the stage's direct child down to this.parent.
        // (Stop before the stage itself whose position is already accounted for above.)
        const chain = [];
        let node = this.parent;
        while (node && node.parent) {
            chain.unshift(node);
            node = node.parent;
        }
        // Apply each ancestor's inverse transform in order (outermost → innermost).
        for (const ancestor of chain) {
            // Forward: world = T(ax,ay) · R(ar) · S(asx,asy) · T(-apx,-apy) · local
            // Inverse:  local = T(apx,apy) · S(1/asx,1/asy) · R(-ar) · T(-ax,-ay) · world
            const dx = wx - ancestor._x;
            const dy = wy - ancestor._y;
            const cos = Math.cos(ancestor._rotation);
            const sin = Math.sin(ancestor._rotation);
            // Un-rotate (apply negative rotation)
            const rdx = cos * dx + sin * dy;
            const rdy = -sin * dx + cos * dy;
            // Un-scale + add pivot
            wx = rdx / ancestor._scaleX + ancestor._pivotX;
            wy = rdy / ancestor._scaleY + ancestor._pivotY;
        }
        this._x = wx;
        this._y = wy;
        this._applyTransform();
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