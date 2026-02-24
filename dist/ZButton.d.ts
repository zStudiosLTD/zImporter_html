import { ZContainer } from './ZContainer';
export declare const RemoveClickListener: (container: ZContainer) => void;
export declare const AttachClickListener: (container: ZContainer, pressCallback?: () => void, longPressCallback?: () => void) => void;
export declare const AddHoverListener: (container: ZContainer, hoverCallback: (...args: any[]) => void, outCallback: (...args: any[]) => void) => void;
export declare const RemoveHoverListener: (container: ZContainer) => void;
export declare class ZButton extends ZContainer {
    topLabelContainer: ZContainer;
    topLabelContainer2: ZContainer;
    overState: ZContainer;
    overLabelContainer: ZContainer;
    overLabelContainer2: ZContainer;
    downState: ZContainer;
    downLabelContainer: ZContainer;
    downLabelContainer2: ZContainer;
    upState: ZContainer;
    upLabelContainer: ZContainer;
    upLabelContainer2: ZContainer;
    disabledState: ZContainer;
    disabledLabelContainer: ZContainer;
    disabledLabelContainer2: ZContainer;
    pressCallback?: () => void;
    longPressCallback?: () => void;
    private labelState;
    getType(): string;
    init(_labelStr?: string): void;
    setLabel(name: string): void;
    setLabel2(name: string): void;
    setFixedTextSize(fixed: boolean): void;
    makeSingleLine(): void;
    getLabel(): HTMLElement | null;
    private _showState;
    enable(): void;
    disable(): void;
    private _interactionsAttached;
    private _attachInteractions;
}
//# sourceMappingURL=ZButton.d.ts.map