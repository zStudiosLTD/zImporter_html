
export enum AnchorConsts {
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
    anchorPercentage?: { x: number; y: number };
    width: number;
    height: number;
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
    fillGradientType: number;  // 0 = vertical, 1 = horizontal
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
