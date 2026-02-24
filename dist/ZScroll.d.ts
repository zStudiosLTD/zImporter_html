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
export declare class ZScroll extends ZContainer {
    scrollBarHeight: number;
    contentHeight: number;
    scrollingEnabled: boolean;
    beed: ZContainer;
    scrollBar: ZContainer;
    scrollContent: ZContainer;
    /** Extra Y offset applied on top of scrollContent's authored position. */
    private _scrollOffsetY;
    private _clipEl;
    private _isDragging;
    private _isBeedDragging;
    private _dragStartY;
    private _beedStartY;
    private _onPointerDown;
    private _onPointerMove;
    private _onPointerUp;
    private _onWheel;
    init(): void;
    getType(): string;
    private _setup;
    /** Wrap scrollContent.el in a clip div so overflow is hidden. */
    private _injectClipWrapper;
    private _addListeners;
    private _removeListeners;
    removeListeners(): void;
    private _handlePointerDown;
    private _handlePointerMove;
    private _handlePointerUp;
    private _handleWheel;
    /** Beed current Y in its parent container's local space. */
    private _beedY;
    private _beedHeight;
    private _setBeedY;
    private _syncScrollFromBeed;
    private _syncBeed;
    /** Write _scrollOffsetY into scrollContent.el's CSS transform. */
    private _applyScrollOffset;
    /**
     * Convert clientY (viewport/screen pixels) to ZScroll-local Y in scene
     * units by subtracting the element's top and dividing by stageScale.
     */
    private _toLocalY;
    /**
     * Walk all DOM descendants of `el` and return the maximum bottom-edge
     * distance from el's own top, converted to scene units.
     * Works for position:absolute subtrees where offsetHeight / scrollHeight = 0.
     */
    private _measureDescendantHeight;
    /**
     * Walk all DOM descendants of `el` and return the maximum right-edge
     * distance from el's own left, converted to scene units.
     */
    private _measureDescendantWidth;
    applyTransform(): void;
}
//# sourceMappingURL=ZScroll.d.ts.map