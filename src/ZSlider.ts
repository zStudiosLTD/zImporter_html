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
    sliderWidth: number = 0;
    callback?: (t: number) => void;

    handle!: ZContainer;
    track!: ZContainer;

    /** Offset (in track-local px) between the click point and handle.x at drag start. */
    private _dragOffsetX: number = 0;

    private _onDragStart = this._handleDragStart.bind(this);
    private _onDragEnd = this._handleDragEnd.bind(this);
    private _onDrag = this._handleDrag.bind(this);

    public override init(): void {
        super.init();

        this.handle = this.get('handle') as ZContainer;
        this.track = this.get('track') as ZContainer;

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

    public getType(): string { return 'ZSlider'; }

    // ─────────────────────────────────────────────────────────────────────────
    // Public API
    // ─────────────────────────────────────────────────────────────────────────

    setHandlePosition(t: number): void {
        if (!this.handle || !this.sliderWidth) return;
        const maxX = this.sliderWidth - this._measureHandleWidth();
        this.handle.x = t * maxX;
        this.callback?.(t);
    }

    setCallback(callback: (t: number) => void): void {
        this.callback = callback;
    }

    removeCallback(): void {
        this.callback = undefined;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Drag handling
    // ─────────────────────────────────────────────────────────────────────────

    private _handleDragStart(e: Event): void {
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
        } else {
            this._dragOffsetX = 0;
        }

        window.addEventListener('pointerup', this._onDragEnd);
        window.addEventListener('touchend', this._onDragEnd);
        window.addEventListener('pointermove', this._onDrag);
        window.addEventListener('touchmove', this._onDrag);
    }

    private _handleDragEnd(_e: Event): void {
        this.dragging = false;
        window.removeEventListener('pointerup', this._onDragEnd);
        window.removeEventListener('touchend', this._onDragEnd);
        window.removeEventListener('pointermove', this._onDrag);
        window.removeEventListener('touchmove', this._onDrag);
    }

    private _handleDrag(e: Event): void {
        if (!this.dragging || !this.sliderWidth) return;

        const clientX = this._getClientX(e);
        if (clientX === undefined) return;

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
    private _getClientX(e: Event): number | undefined {
        if ((e as TouchEvent).touches?.length) {
            return (e as TouchEvent).touches[0].clientX;
        }
        if (typeof (e as PointerEvent).clientX === 'number') {
            return (e as PointerEvent).clientX;
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
    private _measureTrackWidth(): number {
        // 1. Authored width in scene data.
        const ctW = this.track.currentTransform?.width;
        if (ctW && ctW > 0) return ctW;

        const scale = ZContainer.stageScale || 1;

        // 2. Walk all descendants; find the maximum (x + offsetWidth) relative
        //    to the track's own bounding rect left edge.
        const trackLeft = this.track.el.getBoundingClientRect().left;
        let maxRight = 0;

        const walk = (el: HTMLElement) => {
            if (el.offsetWidth > 0) {
                const r = el.getBoundingClientRect();
                const right = (r.left - trackLeft) / scale + el.offsetWidth / scale;
                if (right > maxRight) maxRight = right;
            }
            for (const child of Array.from(el.children) as HTMLElement[]) {
                walk(child);
            }
        };
        for (const child of Array.from(this.track.el.children) as HTMLElement[]) {
            walk(child);
        }
        if (maxRight > 0) return maxRight;

        // 3. Last resort.
        return 200;
    }

    /** Measure the handle's visual width in scene units by walking its descendants. */
    private _measureHandleWidth(): number {
        const ctW = this.handle.currentTransform?.width;
        if (ctW && ctW > 0) return ctW;

        const scale = ZContainer.stageScale || 1;
        let maxW = 0;
        const walk = (el: HTMLElement) => {
            if (el.offsetWidth > 0) {
                const w = el.offsetWidth / scale;
                if (w > maxW) maxW = w;
            }
            for (const child of Array.from(el.children) as HTMLElement[]) {
                walk(child);
            }
        };
        for (const child of Array.from(this.handle.el.children) as HTMLElement[]) {
            walk(child);
        }
        return maxW > 0 ? maxW : 0;
    }
}
