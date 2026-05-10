import { ZContainer } from './ZContainer';
import { ZTimeline } from './ZTimeline';
/**
 * A stateful container: only one named child is visible at a time.
 * Mirrors the PIXI ZState interface exactly.
 */
export class ZState extends ZContainer {
    currentState = null;
    init() {
        this.setState('idle');
    }
    getCurrentState() {
        return this.currentState;
    }
    hasState(str) {
        return this.getChildByName(str) !== null;
    }
    setState(str) {
        let chosen = this.getChildByName(str);
        if (!chosen) {
            chosen = this.getChildByName('idle');
            if (!chosen && this.children.length > 0) {
                chosen = this.children[0];
            }
        }
        // hide all children; stop any timelines
        for (const child of this.children) {
            child.setVisible(false);
            this.stopAllTimelines(child);
        }
        if (chosen) {
            // Bring chosen to the top in the DOM
            chosen.setVisible(true);
            this.el.appendChild(chosen.el);
            this.currentState = chosen;
            this.playAllTimelines(chosen);
            return chosen;
        }
        return null;
    }
    getAllStateNames() {
        return this.children.map(c => c.name);
    }
    getType() {
        return 'ZState';
    }
    playAllTimelines(container) {
        if (container instanceof ZTimeline) {
            let t = container;
            if (t.playOnStart) {
                t.gotoAndPlay(0);
            }
        }
        else {
            for (let i = 0; i < container.children.length; i++) {
                let child = container.children[i];
                if (child instanceof ZContainer) {
                    this.playAllTimelines(child);
                }
            }
        }
    }
    stopAllTimelines(container) {
        if (container instanceof ZTimeline) {
            let t = container;
            t.stop();
        }
        else {
            for (let i = 0; i < container.children.length; i++) {
                let child = container.children[i];
                if (child instanceof ZContainer) {
                    this.stopAllTimelines(child);
                }
            }
        }
    }
}
//# sourceMappingURL=ZState.js.map