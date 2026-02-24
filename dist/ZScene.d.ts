import { ZContainer } from './ZContainer';
import { AnimTrackData, SceneData, TemplateData } from './SceneData';
export type AssetType = 'btn' | 'asset' | 'state' | 'toggle' | 'none' | 'slider' | 'scrollBar' | 'fullScreen' | 'animation';
/**
 * HTML div–based ZScene.
 *
 * Loads `placements.json` from an asset base path, constructs the scene
 * hierarchy as nested `ZContainer` divs, scales and centres the stage to
 * fit the viewport, and exposes the same public API as the PIXI / Phaser
 * versions of zImporter.
 *
 * Spine and particle assets are silently skipped (not supported in HTML).
 */
export declare class ZScene {
    static assetTypes: Map<AssetType, any>;
    private assetBasePath;
    private data;
    private _sceneStage;
    private resizeMap;
    private static SceneMap;
    private sceneId;
    private orientation;
    /** Atlas frame rects keyed by frame name (no _IMG suffix). Populated when atlas:true. */
    private atlasFrames;
    /** Full URL of the atlas image (ta.png). */
    private atlasImageUrl;
    /** Full atlas image dimensions (needed for background-size). */
    private atlasSize;
    /** Parsed bitmap fonts keyed by uniqueFontName (e.g. "Arial_1e00ffa19b9b_53"). */
    private bitmapFonts;
    get sceneStage(): ZContainer;
    get sceneWidth(): number;
    get sceneHeight(): number;
    constructor(sceneId: string);
    setOrientation(): void;
    static getSceneById(sceneId: string): ZScene | undefined;
    /**
     * Fetches `placements.json` (and `ta.json` when atlas:true) from
     * `assetBasePath` and builds the scene.
     */
    load(assetBasePath: string, onComplete: () => void): Promise<void>;
    /** Fetches ta.json and ta.png metadata and caches the frame rects. */
    private _loadAtlas;
    private _loadFonts;
    private _loadBitmapFont;
    /**
     * Renders a bitmapText node onto a <canvas> using the pre-parsed glyph
     * atlas.  Supports solid-colour and vertical-gradient fills, plus a
     * shadow-based stroke outline that matches PIXI's strokeThickness.
     */
    private _createBitmapTextCanvas;
    initScene(data: SceneData): void;
    /**
     * Builds the scene's div hierarchy and appends it to `hostElement`.
     * @param hostElement - The DOM node that will contain the stage (default: document.body).
     */
    loadStage(hostElement?: HTMLElement, loadChildren?: boolean): void;
    addToResizeMap(mc: ZContainer): void;
    removeFromResizeMap(mc: ZContainer): void;
    getInnerDimensions(): {
        width: number;
        height: number;
    };
    /**
     * Scales and centres the stage div to fill the viewport while preserving
     * the scene's internal aspect ratio. Mirrors ZScene.resize in PIXI.
     */
    resize(width: number, height: number): void;
    spawn(tempName: string): ZContainer | undefined;
    createAsset(mc: ZContainer, baseNode: TemplateData): void;
    private _createImageElement;
    private _createTextElement;
    getChildrenFrames(templateName: string): Record<string, AnimTrackData[]>;
    static getAssetType(value: string): (new () => ZContainer) | null;
    static isAssetType(value: string): value is AssetType;
    degreesToRadians(degrees: number): number;
    /**
     * Removes the scene's stage element from the DOM and clears the scene map.
     */
    destroy(): void;
}
//# sourceMappingURL=ZScene.d.ts.map