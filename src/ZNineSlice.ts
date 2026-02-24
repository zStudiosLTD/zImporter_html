import { ZContainer } from './ZContainer';
import { NineSliceData } from './SceneData';

/**
 * HTML div–based nine-slice container.
 *
 * Wraps a CSS `border-image` div that stretches the edges/corners while
 * keeping the slice cuts intact — equivalent to Phaser.NineSlice and
 * PIXI.NineSlicePlane.
 *
 * ZNineSlice extends ZContainer so it participates directly in the
 * resize map and scene graph. The inner div owns the CSS border-image;
 * the outer ZContainer el carries the CSS transform (position/scale).
 */
export class ZNineSlice extends ZContainer {
    private innerDiv: HTMLDivElement;
    private nsData: NineSliceData;

    constructor(
        data: NineSliceData,
        orientation: 'portrait' | 'landscape',
        assetBasePath: string,
    ) {
        super();

        this.nsData = data;
        this.portrait = data.portrait;
        this.landscape = data.landscape;
        this.currentTransform = orientation === 'portrait' ? this.portrait : this.landscape;

        // ── Inner div: carries the CSS border-image rendering ─────────────────
        this.innerDiv = document.createElement('div');
        this.innerDiv.style.position = 'absolute';
        this.innerDiv.style.left = '0';
        this.innerDiv.style.top = '0';
        this.innerDiv.dataset.name = data.name;

        const src = assetBasePath + (data.filePath ?? '');
        const { top: t, right: r, bottom: b, left: l } = data;

        if (src && t != null) {
            // `fill` keyword keeps the centre of the source image visible.
            this.innerDiv.style.borderImage =
                `url(${src}) ${t} ${r} ${b} ${l} fill / ${t}px ${r}px ${b}px ${l}px`;
        } else if (src) {
            this.innerDiv.style.backgroundImage = `url(${src})`;
            this.innerDiv.style.backgroundSize = '100% 100%';
        }

        this.el.appendChild(this.innerDiv);

        // Apply initial size from current orientation.
        this._applySize();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Overrides
    // ─────────────────────────────────────────────────────────────────────────

    public override applyTransform(): void {
        super.applyTransform();
        this._applySize();
    }

    public override resize(
        _width: number,
        _height: number,
        orientation: 'portrait' | 'landscape',
    ): void {
        this.currentTransform = orientation === 'portrait' ? this.portrait : this.landscape;
        this.applyTransform();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────────────────

    private _applySize(): void {
        const lW = this.nsData.landscape?.width ?? this.nsData.width;
        const lH = this.nsData.landscape?.height ?? this.nsData.height;
        const pW = this.nsData.portrait?.width ?? lW;
        const pH = this.nsData.portrait?.height ?? lH;

        const isPortrait = this.currentTransform === this.portrait;
        const w = isPortrait ? pW : lW;
        const h = isPortrait ? pH : lH;

        this.el.style.width = w + 'px';
        this.el.style.height = h + 'px';
        this.innerDiv.style.width = w + 'px';
        this.innerDiv.style.height = h + 'px';
    }

    public getType(): string { return 'ZNineSlice'; }
}
