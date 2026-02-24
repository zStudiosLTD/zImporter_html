import { ZContainer } from './ZContainer';
// ─────────────────────────────────────────────────────────────────────────────
// Standalone listener helpers (same API as the PIXI version)
// ─────────────────────────────────────────────────────────────────────────────
export const RemoveClickListener = (container) => {
    container.removeAllListeners('mouseup');
    container.removeAllListeners('touchend');
    container.removeAllListeners('touchendoutside');
    container.removeAllListeners('mouseupoutside');
    container.removeAllListeners('mousedown');
    container.removeAllListeners('touchstart');
};
export const AttachClickListener = (container, pressCallback, longPressCallback) => {
    container.interactive = true;
    container.el.style.pointerEvents = 'auto';
    if (pressCallback)
        container.pressCallback = pressCallback;
    if (longPressCallback)
        container.longPressCallback = longPressCallback;
    const LONG_PRESS_DURATION = 500;
    const MAX_DRAG_DISTANCE = 20;
    let longPressTimer = null;
    let longPressFired = false;
    let startPos = null;
    const getPos = (e) => {
        if (e.global)
            return e.global;
        if (e.clientX !== undefined)
            return { x: e.clientX, y: e.clientY };
        return { x: 0, y: 0 };
    };
    const onDown = (e) => {
        longPressFired = false;
        startPos = getPos(e);
        longPressTimer = setTimeout(() => {
            longPressFired = true;
            container.longPressCallback?.();
        }, LONG_PRESS_DURATION);
        container.on('mouseup', onUp);
        container.on('touchend', onUp);
        container.on('touchendoutside', onUp);
        container.on('mouseupoutside', onUp);
    };
    const onUp = (e) => {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
        const endPos = getPos(e);
        let isDrag = false;
        if (startPos) {
            const dx = endPos.x - startPos.x;
            const dy = endPos.y - startPos.y;
            if (Math.sqrt(dx * dx + dy * dy) > MAX_DRAG_DISTANCE)
                isDrag = true;
        }
        startPos = null;
        if (!longPressFired && !isDrag) {
            container.pressCallback?.();
        }
        container.off('mouseup', onUp);
        container.off('touchend', onUp);
        container.off('touchendoutside', onUp);
        container.off('mouseupoutside', onUp);
    };
    container.on('mousedown', onDown);
    container.on('touchstart', onDown);
};
export const AddHoverListener = (container, hoverCallback, outCallback) => {
    container.on('mouseover', hoverCallback);
    container.on('mouseout', outCallback);
};
export const RemoveHoverListener = (container) => {
    container.removeAllListeners('mouseover');
    container.removeAllListeners('mouseout');
};
export class ZButton extends ZContainer {
    topLabelContainer;
    topLabelContainer2;
    overState;
    overLabelContainer;
    overLabelContainer2;
    downState;
    downLabelContainer;
    downLabelContainer2;
    upState;
    upLabelContainer;
    upLabelContainer2;
    disabledState;
    disabledLabelContainer;
    disabledLabelContainer2;
    pressCallback;
    longPressCallback;
    labelState = 'none';
    getType() { return 'ZButton'; }
    init(_labelStr = '') {
        super.init();
        this.interactive = true;
        this.interactiveChildren = true;
        this.el.style.pointerEvents = 'auto';
        if (this.overState) {
            this.overLabelContainer = this.overState.getChildByName('labelContainer');
            this.overLabelContainer2 = this.overState.getChildByName('labelContainer2');
        }
        if (this.disabledState) {
            this.disabledLabelContainer = this.disabledState.getChildByName('labelContainer');
            this.disabledLabelContainer2 = this.disabledState.getChildByName('labelContainer2');
        }
        if (this.downState) {
            this.downLabelContainer = this.downState.getChildByName('labelContainer');
            this.downLabelContainer2 = this.downState.getChildByName('labelContainer2');
        }
        if (this.upState) {
            this.upLabelContainer = this.upState.getChildByName('labelContainer');
            this.upLabelContainer2 = this.upState.getChildByName('labelContainer2');
        }
        this.topLabelContainer = this.labelContainer;
        this.topLabelContainer2 = this.labelContainer2;
        if (this.topLabelContainer) {
            this.labelState = 'single';
            if (this.upState)
                this.el.appendChild(this.upState.el);
            this.el.appendChild(this.topLabelContainer.el);
        }
        else if (this.overState && this.disabledState && this.downState && this.upState) {
            if (this.overLabelContainer && this.disabledLabelContainer && this.downLabelContainer && this.upLabelContainer) {
                this.labelState = 'multi';
                this.el.appendChild(this.upState.el);
                if (this.upLabelContainer)
                    this.upState.addChild(this.upLabelContainer);
                if (this.upLabelContainer2)
                    this.upState.addChild(this.upLabelContainer2);
            }
        }
        this.enable();
    }
    setLabel(name) {
        if (this.labelState === 'single') {
            this.getAll('labelContainer').forEach(l => { l.visible = true; l.setText(name); });
        }
        else if (this.labelState === 'multi') {
            [
                ...(this.overState ? this.overState.getAll('labelContainer') : []),
                ...(this.disabledState ? this.disabledState.getAll('labelContainer') : []),
                ...(this.downState ? this.downState.getAll('labelContainer') : []),
                ...(this.upState ? this.upState.getAll('labelContainer') : []),
            ].forEach(l => { l.visible = true; l.setText(name); });
        }
    }
    setLabel2(name) {
        if (this.labelState === 'single') {
            this.getAll('labelContainer2').forEach(l => { l.visible = true; l.setText(name); });
        }
        else if (this.labelState === 'multi') {
            [
                ...(this.overState ? this.overState.getAll('labelContainer2') : []),
                ...(this.disabledState ? this.disabledState.getAll('labelContainer2') : []),
                ...(this.downState ? this.downState.getAll('labelContainer2') : []),
                ...(this.upState ? this.upState.getAll('labelContainer2') : []),
            ].forEach(l => { l.visible = true; l.setText(name); });
        }
    }
    setFixedTextSize(fixed) {
        this.getAll('labelContainer').forEach(c => c.setFixedBoxSize(fixed));
        this.getAll('labelContainer2').forEach(c => c.setFixedBoxSize(fixed));
    }
    makeSingleLine() {
        this.getAll('labelContainer2').forEach(l => l.visible = false);
        this.getAll('labelContainer').forEach(l => {
            const parent = l.parent;
            if (parent)
                l.y = 0; // centered; adjust if you know height
        });
    }
    getLabel() {
        if (this.labelState === 'single' && this.topLabelContainer) {
            return this.topLabelContainer.getTextField();
        }
        else if (this.labelState === 'multi' && this.upLabelContainer) {
            return this.upLabelContainer.getTextField();
        }
        return null;
    }
    // ── Visual states ─────────────────────────────────────────────────────────
    _showState(state) {
        [this.upState, this.downState, this.overState, this.disabledState].forEach(s => {
            if (s)
                s.setVisible(false);
        });
        if (state)
            state.setVisible(true);
    }
    enable() {
        this.el.style.pointerEvents = 'auto';
        this._showState(this.upState);
        if (!this._interactionsAttached) {
            this._attachInteractions();
            this._interactionsAttached = true;
        }
    }
    disable() {
        this.el.style.pointerEvents = 'none';
        this._showState(this.disabledState || this.upState);
    }
    _interactionsAttached = false;
    _attachInteractions() {
        this.el.style.cursor = 'pointer';
        // ── Hover ─────────────────────────────────────────────────────────────
        this.el.addEventListener('mouseenter', () => {
            if (this.overState)
                this._showState(this.overState);
        });
        this.el.addEventListener('mouseleave', () => {
            if (this.upState)
                this._showState(this.upState);
        });
        // ── Press with drag-guard — intentionally does NOT go through
        //   AttachClickListener, which would overwrite this.pressCallback. ────
        const LONG_PRESS_MS = 500;
        const MAX_DRAG_PX = 20;
        let startX = 0, startY = 0;
        let longTimer = null;
        let longFired = false;
        const onDown = (e) => {
            startX = e.clientX;
            startY = e.clientY;
            longFired = false;
            if (this.downState)
                this._showState(this.downState);
            longTimer = setTimeout(() => {
                longFired = true;
                this.longPressCallback?.();
            }, LONG_PRESS_MS);
            this.el.addEventListener('pointerup', onUp, { once: true });
            this.el.addEventListener('pointercancel', onCancel, { once: true });
        };
        const onUp = (e) => {
            if (longTimer) {
                clearTimeout(longTimer);
                longTimer = null;
            }
            this._showState(this.upState);
            const dx = e.clientX - startX, dy = e.clientY - startY;
            if (!longFired && Math.sqrt(dx * dx + dy * dy) <= MAX_DRAG_PX) {
                this.pressCallback?.();
            }
        };
        const onCancel = () => {
            if (longTimer) {
                clearTimeout(longTimer);
                longTimer = null;
            }
            this._showState(this.upState);
        };
        this.el.addEventListener('pointerdown', onDown);
    }
}
//# sourceMappingURL=ZButton.js.map