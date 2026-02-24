import { ZContainer } from './ZContainer';

/**
 * HTML div–based scroll container.
 *
 * Mirrors the Phaser ZScroll API.  Children named "scrollBar", "scrollContent",
 * and "beed" must exist in the scene data.
 *
 * - scrollBar  : defines the visible clip area (height is used for clipping)
 * - scrollContent : the tall container that moves up and down
 * - beed       : the draggable scrollbar handle
 *
 * Clipping is achieved with a CSS overflow:hidden wrapper div injected around
 * scrollContent.  Dragging the beed or the content area, and the wheel event,
 * all update the scroll offset.
 */
export class ZScroll extends ZContainer {
    scrollBarHeight: number = 0;
    contentHeight: number = 0;
    scrollingEnabled: boolean = true;

    beed!: ZContainer;
    scrollBar!: ZContainer;
    scrollContent!: ZContainer;

    /** Extra Y offset applied on top of scrollContent's authored position. */
    private _scrollOffsetY: number = 0;
    private _clipEl: HTMLDivElement | null = null;

    private _isDragging = false;
    private _isBeedDragging = false;
    private _dragStartY = 0;
    private _beedStartY = 0;

    private _onPointerDown = this._handlePointerDown.bind(this);
    private _onPointerMove = this._handlePointerMove.bind(this);
    private _onPointerUp = this._handlePointerUp.bind(this);
    private _onWheel = this._handleWheel.bind(this);

    public override init(): void {
        super.init();
        this.beed = this.get('beed') as ZContainer;
        this.scrollBar = this.get('scrollBar') as ZContainer;
        this.scrollContent = this.get('scrollContent') as ZContainer;

        if (!this.beed || !this.scrollBar || !this.scrollContent) {
            console.warn(`ZScroll "${this.name}": requires 'beed', 'scrollBar', 'scrollContent' children.`);
            return;
        }

        // Defer so children finish their applyTransform before we measure them.
        setTimeout(() => this._setup(), 0);
    }

    public getType(): string { return 'ZScroll'; }

    // ─────────────────────────────────────────────────────────────────────────
    // Setup / teardown
    // ─────────────────────────────────────────────────────────────────────────

    private _setup(): void {
        this._removeListeners();
        if (!this.scrollBar || !this.scrollContent || !this.beed) return;

        const scale = ZContainer.stageScale || 1;

        // scrollBarHeight: height of the scroll viewport in scene units.
        // scrollBar.el is position:absolute with no explicit CSS height; its
        // actual height lives on its descendants (e.g. a ZNineSlice).  Walk the
        // DOM tree to find the real rendered bottom edge.
        this.scrollBarHeight = this._measureDescendantHeight(this.scrollBar.el, scale);
        if (this.scrollBarHeight <= 0) {
            this.scrollBarHeight = this.scrollBar.currentTransform?.height ?? 200;
        }

        // contentHeight: total height of the scrollable content in scene units.
        this.contentHeight = this._measureDescendantHeight(this.scrollContent.el, scale);

        if (this.contentHeight <= this.scrollBarHeight) {
            this.beed.visible = false;
            this._scrollOffsetY = 0;
            this._applyScrollOffset();
            return;
        }

        this.beed.visible = true;

        // ── CSS clip: overflow:hidden wrapper around scrollContent.el ─────────
        this._injectClipWrapper();

        this._scrollOffsetY = 0;
        this._applyScrollOffset();
        this._syncBeed();

        this._addListeners();
    }

    /** Wrap scrollContent.el in a clip div so overflow is hidden. */
    private _injectClipWrapper(): void {
        // Remove stale wrapper if re-setup is called.
        if (this._clipEl) {
            this.el.appendChild(this.scrollContent.el);
            this._clipEl.remove();
            this._clipEl = null;
        }

        // The clip covers the scrollable content area — NOT the scrollbar track.
        // scrollBar sits at the right edge (e.g. x=420); that x value is the clip width.
        // The clip is vertically aligned with the scrollBar track.
        const clipW = this.scrollBar.currentTransform?.x
            ?? this._measureDescendantWidth(this.scrollContent.el, ZContainer.stageScale || 1);
        const clipY = this.scrollBar.currentTransform?.y ?? 0;

        const clip = document.createElement('div');
        clip.style.cssText =
            `position:absolute;overflow:hidden;` +
            `left:0px;top:${clipY}px;` +
            `width:${clipW}px;height:${this.scrollBarHeight}px;`;

        // Move scrollContent's el into the clip div.
        clip.appendChild(this.scrollContent.el);
        this.el.appendChild(clip);
        this._clipEl = clip;
    }

    private _addListeners(): void {
        this.el.addEventListener('pointerdown', this._onPointerDown);
        window.addEventListener('pointermove', this._onPointerMove);
        window.addEventListener('pointerup', this._onPointerUp);
        this.el.addEventListener('wheel', this._onWheel, { passive: true });
    }

    private _removeListeners(): void {
        this.el.removeEventListener('pointerdown', this._onPointerDown);
        window.removeEventListener('pointermove', this._onPointerMove);
        window.removeEventListener('pointerup', this._onPointerUp);
        this.el.removeEventListener('wheel', this._onWheel);
    }

    public removeListeners(): void { this._removeListeners(); }

    // ─────────────────────────────────────────────────────────────────────────
    // Event handlers
    // ─────────────────────────────────────────────────────────────────────────

    private _handlePointerDown(e: PointerEvent): void {
        const localY = this._toLocalY(e.clientY);

        // Check if the pointer is on the beed handle.
        const beedRect = this.beed.el.getBoundingClientRect();
        if (
            e.clientY >= beedRect.top && e.clientY <= beedRect.bottom &&
            e.clientX >= beedRect.left && e.clientX <= beedRect.right
        ) {
            this._isBeedDragging = true;
            this._dragStartY = localY;
            this._beedStartY = this._beedY();
            return;
        }

        // Otherwise check content area.
        const clipRect = (this._clipEl ?? this.scrollBar.el).getBoundingClientRect();
        if (
            e.clientY >= clipRect.top && e.clientY <= clipRect.bottom &&
            e.clientX >= clipRect.left && e.clientX <= clipRect.right
        ) {
            this._isDragging = true;
            this._dragStartY = localY;
            this._beedStartY = this._beedY();
        }
    }

    private _handlePointerMove(e: PointerEvent): void {
        if (!this._isDragging && !this._isBeedDragging) return;
        const currentY = this._toLocalY(e.clientY);
        const deltaY = currentY - this._dragStartY;

        if (this._isBeedDragging) {
            this._setBeedY(this._beedStartY + deltaY);
        } else {
            // Content drag: invert so dragging down scrolls content up.
            this._setBeedY(this._beedStartY - deltaY);
        }
        this._syncScrollFromBeed();
    }

    private _handlePointerUp(): void {
        this._isDragging = false;
        this._isBeedDragging = false;
    }

    private _handleWheel(e: WheelEvent): void {
        if (!this.scrollingEnabled) return;
        this._setBeedY(this._beedY() + e.deltaY * 0.5);
        this._syncScrollFromBeed();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Scroll math
    // ─────────────────────────────────────────────────────────────────────────

    /** Beed current Y in its parent container's local space. */
    private _beedY(): number {
        return (this.beed as any)._y ?? 0;
    }

    private _beedHeight(): number {
        // beed.el is position:absolute — walk descendants for real height.
        const h = this._measureDescendantHeight(this.beed.el, ZContainer.stageScale || 1);
        return h > 0 ? h : 20;
    }

    private _setBeedY(y: number): void {
        const maxY = Math.max(0, this.scrollBarHeight - this._beedHeight());
        const clamped = Math.max(0, Math.min(y, maxY));
        this.beed.y = clamped;
    }

    private _syncScrollFromBeed(): void {
        const maxBeedY = Math.max(0, this.scrollBarHeight - this._beedHeight());
        const per = maxBeedY > 0 ? this._beedY() / maxBeedY : 0;
        const maxScroll = this.contentHeight - this.scrollBarHeight;
        this._scrollOffsetY = -(per * maxScroll);
        this._applyScrollOffset();
    }

    private _syncBeed(): void {
        const maxScroll = Math.max(0, this.contentHeight - this.scrollBarHeight);
        const per = maxScroll > 0 ? -this._scrollOffsetY / maxScroll : 0;
        const maxBeedY = Math.max(0, this.scrollBarHeight - this._beedHeight());
        this._setBeedY(per * maxBeedY);
    }

    /** Write _scrollOffsetY into scrollContent.el's CSS transform. */
    private _applyScrollOffset(): void {
        if (!this.scrollContent) return;
        const t = this.scrollContent.currentTransform;
        const baseX = t?.x ?? 0;
        const baseY = t?.y ?? 0;
        const rot = t?.rotation ?? 0;
        const sx = t?.scaleX ?? 1;
        const sy = t?.scaleY ?? 1;
        const px = t?.pivotX ?? 0;
        const py = t?.pivotY ?? 0;
        this.scrollContent.el.style.transform =
            `translate(${baseX}px,${baseY + this._scrollOffsetY}px)` +
            ` rotate(${rot}rad)` +
            ` scale(${sx},${sy})` +
            ` translate(${-px}px,${-py}px)`;
    }

    /**
     * Convert clientY (viewport/screen pixels) to ZScroll-local Y in scene
     * units by subtracting the element's top and dividing by stageScale.
     */
    private _toLocalY(clientY: number): number {
        const rect = this.el.getBoundingClientRect();
        return (clientY - rect.top) / (ZContainer.stageScale || 1);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Measurement helpers
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Walk all DOM descendants of `el` and return the maximum bottom-edge
     * distance from el's own top, converted to scene units.
     * Works for position:absolute subtrees where offsetHeight / scrollHeight = 0.
     */
    private _measureDescendantHeight(el: HTMLElement, scale: number): number {
        const refTop = el.getBoundingClientRect().top;
        let maxBottom = 0;
        const walk = (node: HTMLElement) => {
            if (node !== el && node.offsetHeight > 0) {
                const r = node.getBoundingClientRect();
                const bottom = (r.bottom - refTop) / scale;
                if (bottom > maxBottom) maxBottom = bottom;
            }
            for (const child of Array.from(node.children) as HTMLElement[]) {
                walk(child);
            }
        };
        walk(el);
        return maxBottom;
    }

    /**
     * Walk all DOM descendants of `el` and return the maximum right-edge
     * distance from el's own left, converted to scene units.
     */
    private _measureDescendantWidth(el: HTMLElement, scale: number): number {
        const refLeft = el.getBoundingClientRect().left;
        let maxRight = 0;
        const walk = (node: HTMLElement) => {
            if (node !== el && node.offsetWidth > 0) {
                const r = node.getBoundingClientRect();
                const right = (r.right - refLeft) / scale;
                if (right > maxRight) maxRight = right;
            }
            for (const child of Array.from(node.children) as HTMLElement[]) {
                walk(child);
            }
        };
        walk(el);
        return maxRight;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Resize
    // ─────────────────────────────────────────────────────────────────────────

    public override applyTransform(): void {
        super.applyTransform();
        // Re-setup after orientation changes.
        if (this.beed && this.scrollBar && this.scrollContent) {
            setTimeout(() => this._setup(), 0);
        }
    }
}
