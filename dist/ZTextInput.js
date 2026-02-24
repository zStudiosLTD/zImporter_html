import { ZContainer } from './ZContainer';
/**
 * HTML div–based text input.
 *
 * Since the HTML version already lives in the DOM, this is simpler than the
 * Phaser equivalent — we just create an `<input>` element and append it
 * inside the ZContainer's el.  The same TextInputObj config used by PIXI /
 * Phaser is supported so scene JSON is reusable across engines.
 */
export class ZTextInput extends ZContainer {
    inputEl = null;
    props;
    _text = '';
    constructor(data) {
        super();
        if (data) {
            this.props = data.props;
            this._text = data.text ?? '';
            this._createInput(data);
        }
    }
    // ─────────────────────────────────────────────────────────────────────────
    // Private – DOM construction
    // ─────────────────────────────────────────────────────────────────────────
    _createInput(data) {
        const input = document.createElement('input');
        input.type = 'text';
        input.value = this._text;
        input.style.position = 'absolute';
        input.style.boxSizing = 'border-box';
        input.style.outline = 'none';
        const inp = this.props?.input;
        if (inp) {
            if (inp.fontFamily)
                input.style.fontFamily = inp.fontFamily;
            if (inp.fontSize)
                input.style.fontSize = inp.fontSize;
            if (inp.padding)
                input.style.padding = inp.padding;
            if (inp.width)
                input.style.width = inp.width;
            if (inp.color)
                input.style.color = typeof inp.color === 'number'
                    ? '#' + inp.color.toString(16).padStart(6, '0')
                    : inp.color;
            if (inp.fontWeight)
                input.style.fontWeight = inp.fontWeight;
            if (inp.textAlign)
                input.style.textAlign = inp.textAlign;
            if (inp.textIndent)
                input.style.textIndent = inp.textIndent;
            if (inp.lineHeight)
                input.style.lineHeight = inp.lineHeight;
        }
        const box = this.props?.box?.default;
        if (box) {
            if (box.fill !== undefined)
                input.style.backgroundColor = '#' + box.fill.toString(16).padStart(6, '0');
            if (box.rounded !== undefined)
                input.style.borderRadius = box.rounded + 'px';
            if (box.stroke) {
                const s = box.stroke;
                const col = s.color !== undefined ? '#' + s.color.toString(16).padStart(6, '0') : '#000';
                input.style.border = `${s.width ?? 1}px solid ${col}`;
            }
        }
        input.addEventListener('focus', () => {
            const f = this.props?.box?.focused;
            if (f?.fill !== undefined)
                input.style.backgroundColor = '#' + f.fill.toString(16).padStart(6, '0');
        });
        input.addEventListener('blur', () => {
            const d = this.props?.box?.default;
            if (d?.fill !== undefined)
                input.style.backgroundColor = '#' + d.fill.toString(16).padStart(6, '0');
        });
        input.addEventListener('input', () => { this._text = input.value; });
        this.inputEl = input;
        this.el.appendChild(input);
        // Position using data x/y if provided.
        if (data.x)
            input.style.left = data.x + 'px';
        if (data.y)
            input.style.top = data.y + 'px';
    }
    // ─────────────────────────────────────────────────────────────────────────
    // Public API (mirrors Phaser ZTextInput)
    // ─────────────────────────────────────────────────────────────────────────
    getText() {
        return this.inputEl?.value ?? this._text;
    }
    setValue(text) {
        this._text = text;
        if (this.inputEl)
            this.inputEl.value = text;
    }
    focus() { this.inputEl?.focus(); }
    blur() { this.inputEl?.blur(); }
    setDisabled(disabled) {
        if (!this.inputEl)
            return;
        this.inputEl.disabled = disabled;
        const style = disabled ? this.props?.box?.disabled : this.props?.box?.default;
        if (style?.fill !== undefined)
            this.inputEl.style.backgroundColor = '#' + style.fill.toString(16).padStart(6, '0');
    }
    getType() { return 'ZTextInput'; }
}
//# sourceMappingURL=ZTextInput.js.map