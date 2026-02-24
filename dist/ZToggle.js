import { AttachClickListener } from './ZButton';
import { ZState } from './ZState';
/**
 * A two-state toggle that flips between `"onState"` and `"offState"`.
 * Mirrors the PIXI ZToggle interface.
 */
export class ZToggle extends ZState {
    toggleCallback;
    init() {
        this.cursor = 'pointer';
        this.el.style.pointerEvents = 'auto';
        AttachClickListener(this, () => {
            const next = this.currentState?.name === 'offState' ? 'onState' : 'offState';
            this.setState(next);
            this.toggleCallback?.(this.currentState?.name === 'onState');
        });
        this.setState('offState');
    }
    setCallback(func) {
        this.toggleCallback = func;
    }
    removeCallback() {
        this.toggleCallback = undefined;
    }
    setIsClickable(val) {
        this.interactive = val;
        this.el.style.pointerEvents = val ? 'auto' : 'none';
        this.cursor = val ? 'pointer' : 'default';
    }
    isOn() {
        return this.currentState?.name === 'onState';
    }
    toggle(state, sendCallback = true) {
        this.setState(state ? 'onState' : 'offState');
        if (this.toggleCallback && sendCallback) {
            this.toggleCallback(state);
        }
    }
    enable() {
        this.interactive = true;
        this.el.style.pointerEvents = 'auto';
        this.cursor = 'pointer';
    }
    disable() {
        this.interactive = false;
        this.el.style.pointerEvents = 'none';
        this.cursor = 'default';
    }
    setLabelOnAllStates(label, str) {
        this.getAll(label).forEach(c => c.setText(str));
    }
    getType() {
        return 'ZToggle';
    }
}
//# sourceMappingURL=ZToggle.js.map