import { AttachClickListener } from './ZButton';
import { ZContainer } from './ZContainer';
import { ZState } from './ZState';

/**
 * A two-state toggle that flips between `"onState"` and `"offState"`.
 * Mirrors the PIXI ZToggle interface.
 */
export class ZToggle extends ZState {
    public toggleCallback?: (state: boolean) => void;

    public override init(): void {
        this.cursor = 'pointer';
        this.el.style.pointerEvents = 'auto';

        AttachClickListener(this, () => {
            const next = this.currentState?.name === 'offState' ? 'onState' : 'offState';
            this.setState(next);
            this.toggleCallback?.(this.currentState?.name === 'onState');
        });

        this.setState('offState');
    }

    setCallback(func: (t: boolean) => void): void {
        this.toggleCallback = func;
    }

    removeCallback(): void {
        this.toggleCallback = undefined;
    }

    setIsClickable(val: boolean): void {
        this.interactive = val;
        this.el.style.pointerEvents = val ? 'auto' : 'none';
        this.cursor = val ? 'pointer' : 'default';
    }

    isOn(): boolean {
        return this.currentState?.name === 'onState';
    }

    toggle(state: boolean, sendCallback: boolean = true): void {
        this.setState(state ? 'onState' : 'offState');
        if (this.toggleCallback && sendCallback) {
            this.toggleCallback(state);
        }
    }

    enable(): void {
        this.interactive = true;
        this.el.style.pointerEvents = 'auto';
        this.cursor = 'pointer';
    }

    disable(): void {
        this.interactive = false;
        this.el.style.pointerEvents = 'none';
        this.cursor = 'default';
    }

    setLabelOnAllStates(label: string, str: string): void {
        this.getAll(label).forEach(c => (c as ZContainer).setText(str));
    }

    public override getType(): string {
        return 'ZToggle';
    }
}
