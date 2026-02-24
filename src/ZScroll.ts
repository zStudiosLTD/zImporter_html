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

        // Measure the scroll area height from the scrollBar element.
        this.scrollBarHeight = this.scrollBar.el.offsetHeight || (this.scrollBar.currentTransform?.height ?? 0);
        this.contentHeight = this.scrollContent.el.scrollHeight || this.scrollContent.el.offsetHeight;

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
            // Move scrollContent.el back to ZScroll.el before removing clip.
            this.el.appendChild(this.scrollContent.el);
            this._clipEl.remove();
            this._clipEl = null;
        }

        const clip = document.createElement('div');
        clip.style.cssText =
            `position:absolute;overflow:hidden;` +
            `left:${this.scrollBar.currentTransform?.x ?? 0}px;` +
            `top:${this.scrollBar.currentTransform?.y ?? 0}px;` +
            `width:${this.scrollBar.el.offsetWidth || (this.scrollBar.currentTransform?.width ?? 200)}px;` +
            `height:${this.scrollBarHeight}px;`;

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
        return this.beed.el.offsetHeight || 20;
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

    /** Convert clientY (viewport pixels) to ZScroll local Y. */
    private _toLocalY(clientY: number): number {
        const rect = this.el.getBoundingClientRect();
        return clientY - rect.top;
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
