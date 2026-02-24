import { ZContainer } from './ZContainer';
import { TextInputData } from './SceneData';
/**
 * HTML div–based text input.
 *
 * Since the HTML version already lives in the DOM, this is simpler than the
 * Phaser equivalent — we just create an `<input>` element and append it
 * inside the ZContainer's el.  The same TextInputObj config used by PIXI /
 * Phaser is supported so scene JSON is reusable across engines.
 */
export declare class ZTextInput extends ZContainer {
    private inputEl;
    private props;
    private _text;
    constructor(data?: TextInputData);
    private _createInput;
    getText(): string;
    setValue(text: string): void;
    focus(): void;
    blur(): void;
    setDisabled(disabled: boolean): void;
    getType(): string;
}
//# sourceMappingURL=ZTextInput.d.ts.map