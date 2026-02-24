import { ZState } from './ZState';
/**
 * A two-state toggle that flips between `"onState"` and `"offState"`.
 * Mirrors the PIXI ZToggle interface.
 */
export declare class ZToggle extends ZState {
    toggleCallback?: (state: boolean) => void;
    init(): void;
    setCallback(func: (t: boolean) => void): void;
    removeCallback(): void;
    setIsClickable(val: boolean): void;
    isOn(): boolean;
    toggle(state: boolean, sendCallback?: boolean): void;
    enable(): void;
    disable(): void;
    setLabelOnAllStates(label: string, str: string): void;
    getType(): string;
}
//# sourceMappingURL=ZToggle.d.ts.map