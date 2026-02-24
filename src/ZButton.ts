import { ZContainer } from './ZContainer';

// ─────────────────────────────────────────────────────────────────────────────
// Standalone listener helpers (same API as the PIXI version)
// ─────────────────────────────────────────────────────────────────────────────

export const RemoveClickListener = (container: ZContainer): void => {
    container.removeAllListeners('mouseup');
    container.removeAllListeners('touchend');
    container.removeAllListeners('touchendoutside');
    container.removeAllListeners('mouseupoutside');
    container.removeAllListeners('mousedown');
    container.removeAllListeners('touchstart');
};

export const AttachClickListener = (
    container: ZContainer,
    pressCallback?: () => void,
    longPressCallback?: () => void
): void => {
    container.interactive = true;
    container.el.style.pointerEvents = 'auto';

    if (pressCallback) (container as any).pressCallback = pressCallback;
    if (longPressCallback) (container as any).longPressCallback = longPressCallback;

    const LONG_PRESS_DURATION = 500;
    const MAX_DRAG_DISTANCE = 20;
    let longPressTimer: ReturnType<typeof setTimeout> | null = null;
    let longPressFired = false;
    let startPos: { x: number; y: number } | null = null;

    const getPos = (e: any): { x: number; y: number } => {
        if (e.global) return e.global;
        if (e.clientX !== undefined) return { x: e.clientX, y: e.clientY };
        return { x: 0, y: 0 };
    };

    const onDown = (e: any) => {
        longPressFired = false;
        startPos = getPos(e);
        longPressTimer = setTimeout(() => {
            longPressFired = true;
            (container as any).longPressCallback?.();
        }, LONG_PRESS_DURATION);

        container.on('mouseup', onUp);
        container.on('touchend', onUp);
        container.on('touchendoutside', onUp);
        container.on('mouseupoutside', onUp);
    };

    const onUp = (e: any) => {
        if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
        const endPos = getPos(e);
        let isDrag = false;
        if (startPos) {
            const dx = endPos.x - startPos.x;
            const dy = endPos.y - startPos.y;
            if (Math.sqrt(dx * dx + dy * dy) > MAX_DRAG_DISTANCE) isDrag = true;
        }
        startPos = null;

        if (!longPressFired && !isDrag) {
            (container as any).pressCallback?.();
        }

        container.off('mouseup', onUp);
        container.off('touchend', onUp);
        container.off('touchendoutside', onUp);
        container.off('mouseupoutside', onUp);
    };

    container.on('mousedown', onDown);
    container.on('touchstart', onDown);
};

export const AddHoverListener = (
    container: ZContainer,
    hoverCallback: (...args: any[]) => void,
    outCallback: (...args: any[]) => void
): void => {
    container.on('mouseover', hoverCallback);
    container.on('mouseout', outCallback);
};

export const RemoveHoverListener = (container: ZContainer): void => {
    container.removeAllListeners('mouseover');
    container.removeAllListeners('mouseout');
};

// ─────────────────────────────────────────────────────────────────────────────
// ZButton
// ─────────────────────────────────────────────────────────────────────────────

type LabelState = 'single' | 'multi' | 'none';

export class ZButton extends ZContainer {
    topLabelContainer!: ZContainer;
    topLabelContainer2!: ZContainer;

    overState!: ZContainer;
    overLabelContainer!: ZContainer;
    overLabelContainer2!: ZContainer;

    downState!: ZContainer;
    downLabelContainer!: ZContainer;
    downLabelContainer2!: ZContainer;

    upState!: ZContainer;
    upLabelContainer!: ZContainer;
    upLabelContainer2!: ZContainer;

    disabledState!: ZContainer;
    disabledLabelContainer!: ZContainer;
    disabledLabelContainer2!: ZContainer;

    pressCallback?: () => void;
    longPressCallback?: () => void;

    private labelState: LabelState = 'none';

    public override getType(): string { return 'ZButton'; }

    public override init(_labelStr: string = ''): void {
        super.init();

        this.interactive = true;
        this.interactiveChildren = true;
        this.el.style.pointerEvents = 'auto';

        if (this.overState) {
            this.overLabelContainer = this.overState.getChildByName('labelContainer') as ZContainer;
            this.overLabelContainer2 = this.overState.getChildByName('labelContainer2') as ZContainer;
        }
        if (this.disabledState) {
            this.disabledLabelContainer = this.disabledState.getChildByName('labelContainer') as ZContainer;
            this.disabledLabelContainer2 = this.disabledState.getChildByName('labelContainer2') as ZContainer;
        }
        if (this.downState) {
            this.downLabelContainer = this.downState.getChildByName('labelContainer') as ZContainer;
            this.downLabelContainer2 = this.downState.getChildByName('labelContainer2') as ZContainer;
        }
        if (this.upState) {
            this.upLabelContainer = this.upState.getChildByName('labelContainer') as ZContainer;
            this.upLabelContainer2 = this.upState.getChildByName('labelContainer2') as ZContainer;
        }

        this.topLabelContainer = (this as any).labelContainer;
        this.topLabelContainer2 = (this as any).labelContainer2;

        if (this.topLabelContainer) {
            this.labelState = 'single';
            if (this.upState) this.el.appendChild(this.upState.el);
            this.el.appendChild(this.topLabelContainer.el);
        } else if (this.overState && this.disabledState && this.downState && this.upState) {
            if (this.overLabelContainer && this.disabledLabelContainer && this.downLabelContainer && this.upLabelContainer) {
                this.labelState = 'multi';
                this.el.appendChild(this.upState.el);
                if (this.upLabelContainer) this.upState.addChild(this.upLabelContainer);
                if (this.upLabelContainer2) this.upState.addChild(this.upLabelContainer2);
            }
        }

        this.enable();
    }

    setLabel(name: string): void {
        if (this.labelState === 'single') {
            this.getAll('labelContainer').forEach(l => { l.visible = true; l.setText(name); });
        } else if (this.labelState === 'multi') {
            [
                ...(this.overState ? this.overState.getAll('labelContainer') : []),
                ...(this.disabledState ? this.disabledState.getAll('labelContainer') : []),
                ...(this.downState ? this.downState.getAll('labelContainer') : []),
                ...(this.upState ? this.upState.getAll('labelContainer') : []),
            ].forEach(l => { l.visible = true; l.setText(name); });
        }
    }

    setLabel2(name: string): void {
        if (this.labelState === 'single') {
            this.getAll('labelContainer2').forEach(l => { l.visible = true; l.setText(name); });
        } else if (this.labelState === 'multi') {
            [
                ...(this.overState ? this.overState.getAll('labelContainer2') : []),
                ...(this.disabledState ? this.disabledState.getAll('labelContainer2') : []),
                ...(this.downState ? this.downState.getAll('labelContainer2') : []),
                ...(this.upState ? this.upState.getAll('labelContainer2') : []),
            ].forEach(l => { l.visible = true; l.setText(name); });
        }
    }

    setFixedTextSize(fixed: boolean): void {
        this.getAll('labelContainer').forEach(c => c.setFixedBoxSize(fixed));
        this.getAll('labelContainer2').forEach(c => c.setFixedBoxSize(fixed));
    }

    makeSingleLine(): void {
        this.getAll('labelContainer2').forEach(l => l.visible = false);
        this.getAll('labelContainer').forEach(l => {
            const parent = l.parent;
            if (parent) l.y = 0; // centered; adjust if you know height
        });
    }

    public getLabel(): HTMLElement | null {
        if (this.labelState === 'single' && this.topLabelContainer) {
            return this.topLabelContainer.getTextField();
        } else if (this.labelState === 'multi' && this.upLabelContainer) {
            return this.upLabelContainer.getTextField();
        }
        return null;
    }

    // ── Visual states ─────────────────────────────────────────────────────────

    private _showState(state: ZContainer | undefined): void {
        [this.upState, this.downState, this.overState, this.disabledState].forEach(s => {
            if (s) s.setVisible(false);
        });
        if (state) state.setVisible(true);
    }

    enable(): void {
        this.el.style.pointerEvents = 'auto';
        this._showState(this.upState);
        if (!this._interactionsAttached) {
            this._attachInteractions();
            this._interactionsAttached = true;
        }
    }

    disable(): void {
        this.el.style.pointerEvents = 'none';
        this._showState(this.disabledState || this.upState);
    }

    private _interactionsAttached = false;

    private _attachInteractions(): void {
        this.el.style.cursor = 'pointer';

        // ── Hover ─────────────────────────────────────────────────────────────
        this.el.addEventListener('mouseenter', () => {
            if (this.overState) this._showState(this.overState);
        });
        this.el.addEventListener('mouseleave', () => {
            if (this.upState) this._showState(this.upState);
        });

        // ── Press with drag-guard — intentionally does NOT go through
        //   AttachClickListener, which would overwrite this.pressCallback. ────
        const LONG_PRESS_MS = 500;
        const MAX_DRAG_PX = 20;
        let startX = 0, startY = 0;
        let longTimer: ReturnType<typeof setTimeout> | null = null;
        let longFired = false;

        const onDown = (e: PointerEvent) => {
            startX = e.clientX; startY = e.clientY;
            longFired = false;
            if (this.downState) this._showState(this.downState);

            longTimer = setTimeout(() => {
                longFired = true;
                this.longPressCallback?.();
            }, LONG_PRESS_MS);

            this.el.addEventListener('pointerup', onUp, { once: true });
            this.el.addEventListener('pointercancel', onCancel, { once: true });
        };

        const onUp = (e: PointerEvent) => {
            if (longTimer) { clearTimeout(longTimer); longTimer = null; }
            this._showState(this.upState);
            const dx = e.clientX - startX, dy = e.clientY - startY;
            if (!longFired && Math.sqrt(dx * dx + dy * dy) <= MAX_DRAG_PX) {
                this.pressCallback?.();
            }
        };

        const onCancel = () => {
            if (longTimer) { clearTimeout(longTimer); longTimer = null; }
            this._showState(this.upState);
        };

        this.el.addEventListener('pointerdown', onDown);
    }
}
