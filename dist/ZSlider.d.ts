import { ZContainer } from './ZContainer';
/**
 * HTML div–based slider.
 *
 * Mirrors the Phaser ZSlider API.  Requires child containers named "handle"
 * and "track" in the scene data.  The handle is dragged horizontally within
 * the track bounds and a 0–1 normalised callback value is emitted.
 */
export declare class ZSlider extends ZContainer {
    dragging: boolean;
    sliderWidth: number;
    callback?: (t: number) => void;
    handle: ZContainer;
    track: ZContainer;
    /** Offset (in track-local px) between the click point and handle.x at drag start. */
    private _dragOffsetX;
    private _onDragStart;
    private _onDragEnd;
    private _onDrag;
    init(): void;
    getType(): string;
    setHandlePosition(t: number): void;
    setCallback(callback: (t: number) => void): void;
    removeCallback(): void;
    private _handleDragStart;
    private _handleDragEnd;
    private _handleDrag;
    /** Extract clientX from a PointerEvent or TouchEvent. */
    private _getClientX;
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
    private _measureTrackWidth;
    /** Measure the handle's visual width in scene units by walking its descendants. */
    private _measureHandleWidth;
}
//# sourceMappingURL=ZSlider.d.ts.map