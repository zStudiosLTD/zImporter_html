import { ZContainer } from './ZContainer';
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
    innerDiv;
    nsData;
    constructor(data, orientation, assetBasePath) {
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
        }
        else if (src) {
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
    applyTransform() {
        super.applyTransform();
        this._applySize();
    }
    resize(_width, _height, orientation) {
        this.currentTransform = orientation === 'portrait' ? this.portrait : this.landscape;
        this.applyTransform();
    }
    // ─────────────────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────────────────
    _applySize() {
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
    getType() { return 'ZNineSlice'; }
}
//# sourceMappingURL=ZNineSlice.js.map