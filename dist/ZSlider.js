import { ZContainer } from './ZContainer';
/**
 * HTML div–based slider.
 *
 * Mirrors the Phaser ZSlider API.  Requires child containers named "handle"
 * and "track" in the scene data.  The handle is dragged horizontally within
 * the track bounds and a 0–1 normalised callback value is emitted.
 */
export class ZSlider extends ZContainer {
    dragging = false;
    sliderWidth = 0;
    callback;
    handle;
    track;
    /** Offset (in track-local px) between the click point and handle.x at drag start. */
    _dragOffsetX = 0;
    _onDragStart = this._handleDragStart.bind(this);
    _onDragEnd = this._handleDragEnd.bind(this);
    _onDrag = this._handleDrag.bind(this);
    init() {
        super.init();
        this.handle = this.get('handle');
        this.track = this.get('track');
        if (!this.handle || !this.track) {
            console.error('ZSlider: missing "handle" or "track" child.');
            return;
        }
        // Measure track width in scene units.
        // Prefer the authored width from the transform data; fall back to
        // offsetWidth (only valid when style.width is explicitly set) or
        // getBoundingClientRect divided by stageScale.
        setTimeout(() => {
            this.sliderWidth = this._measureTrackWidth();
        }, 0);
        this.handle.el.style.cursor = 'pointer';
        this.handle.el.addEventListener('pointerdown', this._onDragStart);
        this.handle.el.addEventListener('touchstart', this._onDragStart);
    }
    getType() { return 'ZSlider'; }
    // ─────────────────────────────────────────────────────────────────────────
    // Public API
    // ─────────────────────────────────────────────────────────────────────────
    setHandlePosition(t) {
        if (!this.handle || !this.sliderWidth)
            return;
        const maxX = this.sliderWidth - this._measureHandleWidth();
        this.handle.x = t * maxX;
        this.callback?.(t);
    }
    setCallback(callback) {
        this.callback = callback;
    }
    removeCallback() {
        this.callback = undefined;
    }
    // ─────────────────────────────────────────────────────────────────────────
    // Drag handling
    // ─────────────────────────────────────────────────────────────────────────
    _handleDragStart(e) {
        this.dragging = true;
        // Re-measure in case the deferred measurement ran before layout settled.
        this.sliderWidth = this._measureTrackWidth();
        // Record how far inside the handle the user clicked so we can preserve
        // that offset throughout the drag (prevents the handle from jumping).
        // Divide screen pixels by stageScale to convert to scene units.
        const clientX = this._getClientX(e);
        if (clientX !== undefined && this.sliderWidth) {
            const rect = this.track.el.getBoundingClientRect();
            const scale = ZContainer.stageScale || 1;
            const clickLocalX = (clientX - rect.left) / scale;
            this._dragOffsetX = clickLocalX - this.handle.x;
        }
        else {
            this._dragOffsetX = 0;
        }
        window.addEventListener('pointerup', this._onDragEnd);
        window.addEventListener('touchend', this._onDragEnd);
        window.addEventListener('pointermove', this._onDrag);
        window.addEventListener('touchmove', this._onDrag);
    }
    _handleDragEnd(_e) {
        this.dragging = false;
        window.removeEventListener('pointerup', this._onDragEnd);
        window.removeEventListener('touchend', this._onDragEnd);
        window.removeEventListener('pointermove', this._onDrag);
        window.removeEventListener('touchmove', this._onDrag);
    }
    _handleDrag(e) {
        if (!this.dragging || !this.sliderWidth)
            return;
        const clientX = this._getClientX(e);
        if (clientX === undefined)
            return;
        // Divide screen pixels by stageScale to convert to scene units.
        // Clamp to [0, trackWidth - handleWidth] so the handle stays inside the track.
        const rect = this.track.el.getBoundingClientRect();
        const scale = ZContainer.stageScale || 1;
        const maxX = this.sliderWidth - this._measureHandleWidth();
        const localX = Math.max(0, Math.min((clientX - rect.left) / scale - this._dragOffsetX, maxX));
        this.handle.x = localX;
        this.callback?.(maxX > 0 ? localX / maxX : 0);
    }
    /** Extract clientX from a PointerEvent or TouchEvent. */
    _getClientX(e) {
        if (e.touches?.length) {
            return e.touches[0].clientX;
        }
        if (typeof e.clientX === 'number') {
            return e.clientX;
        }
        return undefined;
    }
    /**
     * Measure the track's usable width in scene units.
     *
     * track.el is position:absolute with no explicit CSS width — its own
     * offsetWidth / getBoundingClientRect is 0. The actual width comes from
     * the image (or other content) placed inside it, which also has
     * position:absolute. We walk the DOM tree to find the widest leaf element
     * and read its offsetWidth (the rendered pixel width of an absolutely-
     * positioned element with a fixed style.width is always correct), then
     * divide by stageScale to convert back to scene units.
     */
    _measureTrackWidth() {
        // 1. Authored width in scene data.
        const ctW = this.track.currentTransform?.width;
        if (ctW && ctW > 0)
            return ctW;
        const scale = ZContainer.stageScale || 1;
        // 2. Walk all descendants; find the maximum (x + offsetWidth) relative
        //    to the track's own bounding rect left edge.
        const trackLeft = this.track.el.getBoundingClientRect().left;
        let maxRight = 0;
        const walk = (el) => {
            if (el.offsetWidth > 0) {
                const r = el.getBoundingClientRect();
                const right = (r.left - trackLeft) / scale + el.offsetWidth / scale;
                if (right > maxRight)
                    maxRight = right;
            }
            for (const child of Array.from(el.children)) {
                walk(child);
            }
        };
        for (const child of Array.from(this.track.el.children)) {
            walk(child);
        }
        if (maxRight > 0)
            return maxRight;
        // 3. Last resort.
        return 200;
    }
    /** Measure the handle's visual width in scene units by walking its descendants. */
    _measureHandleWidth() {
        const ctW = this.handle.currentTransform?.width;
        if (ctW && ctW > 0)
            return ctW;
        const scale = ZContainer.stageScale || 1;
        let maxW = 0;
        const walk = (el) => {
            if (el.offsetWidth > 0) {
                const w = el.offsetWidth / scale;
                if (w > maxW)
                    maxW = w;
            }
            for (const child of Array.from(el.children)) {
                walk(child);
            }
        };
        for (const child of Array.from(this.handle.el.children)) {
            walk(child);
        }
        return maxW > 0 ? maxW : 0;
    }
}
//# sourceMappingURL=ZSlider.js.map