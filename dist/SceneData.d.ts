export interface BoxStroke {
    color?: number;
    width?: number;
    alpha?: number;
}
export interface InputBoxStyle {
    fill: number;
    rounded?: number;
    stroke?: BoxStroke;
}
export interface InputParams {
    fontFamily: string;
    fontSize: string;
    padding: string;
    width: string;
    color: string | number;
    fontWeight?: string;
    textAlign: string;
    textIndent?: string;
    lineHeight?: string;
}
export interface TextInputObj {
    input: InputParams;
    box: {
        default: InputBoxStyle;
        focused: InputBoxStyle;
        disabled: InputBoxStyle;
    };
}
export interface TextInputData extends BaseAssetData {
    x: number;
    y: number;
    text: string;
    props: TextInputObj;
}
export interface SpineData extends BaseAssetData {
    name: string;
    spineJson: string;
    spineAtlas: string;
    pngFiles: string[];
    animations: string[];
    skin?: string;
    playOnStart?: {
        value: boolean;
        animation: string;
    };
}
export interface ParticleData extends BaseAssetData {
    jsonPath: string;
    pngPaths: string[];
    name: string;
    emitterConfig: any;
}
export declare enum AnchorConsts {
    NONE = "none",
    TOP_LEFT = "topLeft",
    TOP_RIGHT = "topRight",
    BOTTOM_LEFT = "btmLeft",
    BOTTOM_RIGHT = "btmRight",
    LEFT = "left",
    RIGHT = "right",
    TOP = "top",
    BOTTOM = "btm",
    CENTER = "center"
}
export interface ResolutionData {
    x: number;
    y: number;
}
export interface OrientationData {
    x: number;
    y: number;
    rotation: number;
    scaleX: number;
    scaleY: number;
    alpha: number;
    pivotX: number;
    pivotY: number;
    visible: boolean;
    isAnchored: boolean;
    anchorType?: AnchorConsts;
    anchorPercentage?: {
        x: number;
        y: number;
    };
    width: number;
    height: number;
    skewX?: number;
    skewY?: number;
}
export interface BaseAssetData {
    type: string;
    name: string;
    filters: any;
}
export interface InstanceAttributes {
    fitToScreen?: boolean;
}
export interface InstanceData extends BaseAssetData {
    template: boolean;
    instanceName: string;
    guide: boolean;
    portrait: OrientationData;
    landscape: OrientationData;
    attrs?: InstanceAttributes;
    playOnStart?: boolean;
    looping?: boolean;
    mask?: string;
}
export interface SpriteData extends BaseAssetData {
    name: string;
    type: string;
    width: number;
    height: number;
    filePath: string;
    x: number;
    y: number;
    pivotX: number;
    pivotY: number;
}
export interface NineSliceData extends SpriteData {
    top: number;
    bottom: number;
    left: number;
    right: number;
    origWidth: number;
    origHeight: number;
    portrait: OrientationData;
    landscape: OrientationData;
}
export interface GradientData {
    colors: number[];
    percentages: number[];
    fillGradientType: number;
}
export interface TextData extends BaseAssetData {
    x: number;
    y: number;
    rotation: number;
    width: number;
    height: number;
    alpha: number;
    size: number | string;
    color?: string | number;
    align: string;
    text: string;
    fontName: string | string[];
    lineHeight?: number;
    stroke?: string | number;
    strokeThickness?: number;
    wordWrap?: boolean;
    wordWrapWidth?: number;
    letterSpacing?: number;
    fontWeight?: string;
    textAnchorX: number;
    textAnchorY: number;
    pivotX: number;
    pivotY: number;
    /** Key used to look up the .fnt / .png bitmap font files. */
    uniqueFontName?: string;
    /** 'gradient' | 'solid' */
    fillType?: string;
    gradientData?: GradientData;
}
export interface AnimTrackData {
    x?: number;
    y?: number;
    scaleX?: number;
    scaleY?: number;
    rotation?: number;
    alpha?: number;
    pivotX?: number;
    pivotY?: number;
    skewX?: number;
    skewY?: number;
}
export interface TemplateData {
    type: string;
    name: string;
    children: BaseAssetData[];
}
export interface StageData {
    children: InstanceData[];
    type: string;
    name: string;
}
export interface SceneData {
    resolution: ResolutionData;
    animTracks?: Record<string, AnimTrackData[]>;
    cuePoints?: Record<string, Record<number, string>>;
    stage: StageData;
    templates: Record<string, TemplateData>;
    fonts: string[];
    atlas?: boolean;
}
//# sourceMappingURL=SceneData.d.ts.map