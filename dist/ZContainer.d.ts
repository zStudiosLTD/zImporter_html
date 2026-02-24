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
export declare class ZContainer {
    /** The root div element for this container. */
    readonly el: HTMLDivElement;
    portrait: OrientationData;
    landscape: OrientationData;
    currentTransform: OrientationData;
    resizeable: boolean;
    name: string;
    _fitToScreen: boolean;
    originalTextWidth?: number;
    originalTextHeight?: number;
    originalFontSize?: number;
    fixedBoxSize?: boolean;
    _props?: any;
    private _x;
    private _y;
    private _rotation;
    private _scaleX;
    private _scaleY;
    private _pivotX;
    private _pivotY;
    private _alpha;
    private _visible;
    interactive: boolean;
    interactiveChildren: boolean;
    /** Typed child list (mirrors PIXI's children array). */
    children: ZContainer[];
    parent: ZContainer | null;
    constructor();
    addChild(child: ZContainer): ZContainer;
    removeChild(child: ZContainer): ZContainer;
    removeChildren(): void;
    getChildByName(name: string): ZContainer | null;
    getChildAt(index: number): ZContainer;
    get(childName: string): ZContainer | null;
    getAll(childName: string): ZContainer[];
    getAllOfType(type: string): ZContainer[];
    get x(): number;
    set x(value: number);
    get y(): number;
    set y(value: number);
    get rotation(): number;
    set rotation(value: number);
    get scaleX(): number;
    set scaleX(value: number);
    get scaleY(): number;
    set scaleY(value: number);
    get pivotX(): number;
    set pivotX(value: number);
    get pivotY(): number;
    set pivotY(value: number);
    get alpha(): number;
    set alpha(value: number);
    get visible(): boolean;
    set visible(value: boolean);
    /**
     * PIXI-compatible scale object. Setting `.x` / `.y` delegates to the
     * `scaleX` / `scaleY` setters so that ZScene can write
     * `stage.scale.x = s` exactly as in the PIXI version.
     *
     * Initialised in the constructor so `this` is captured correctly.
     */
    readonly scale: {
        x: number;
        y: number;
    };
    /**
     * Writes the CSS transform that replicates PIXI's:
     *   T(x,y) · R(rotation) · S(scaleX,scaleY) · T(-pivotX,-pivotY)
     */
    private _applyTransform;
    setInstanceData(data: InstanceData, orientation: string): void;
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
    executeFitToScreen(viewportW: number, viewportH: number, stageOffsetX: number, stageOffsetY: number, stageScale: number): void;
    applyTransform(): void;
    private _applyAnchor;
    private _getStageScale;
    resize(width: number, height: number, orientation: 'portrait' | 'landscape'): void;
    isAnchored(): boolean;
    setAlpha(value: number): void;
    getAlpha(): number;
    setVisible(value: boolean): void;
    getVisible(): boolean;
    getProps(): any;
    getType(): string;
    setFixedBoxSize(value: boolean): void;
    /**
     * Finds the first text element (a `<span class="z-text">`) among children.
     * Mirrors PIXI's `getTextField()`.
     */
    getTextField(): HTMLElement | null;
    setText(text: string): void;
    setTextStyle(data: Partial<CSSStyleDeclaration>): void;
    getTextStyle(): CSSStyleDeclaration | null;
    private _resizeText;
    /** Called once all children have been added. Captures original text dimensions. */
    init(): void;
    set cursor(value: string);
    get cursor(): string;
    private _listeners;
    on(event: string, listener: Function): this;
    off(event: string, listener: Function): this;
    removeAllListeners(event?: string): this;
    emit(event: string, ...args: any[]): void;
    /**
     * Maps the PIXI event names used by ZButton to their DOM equivalents
     * and attaches a single delegating DOM listener.
     */
    private _domListeners;
    private _syncDOMListeners;
    private static _pixiToDom;
    private static _wrapEvent;
}
//# sourceMappingURL=ZContainer.d.ts.map