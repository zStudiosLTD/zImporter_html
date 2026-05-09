import { ZContainer } from './ZContainer';
import { ZTimeline } from './ZTimeline';

/**
 * A stateful container: only one named child is visible at a time.
 * Mirrors the PIXI ZState interface exactly.
 */
export class ZState extends ZContainer {
    public currentState: ZContainer | null = null;

    public override init(): void {
        this.setState('idle');
    }

    public getCurrentState(): ZContainer | null {
        return this.currentState;
    }

    public hasState(str: string): boolean {
        return this.getChildByName(str) !== null;
    }

    public setState(str: string): ZContainer | null {
        let chosen = this.getChildByName(str) as ZContainer | null;
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

    public getAllStateNames(): (string | null)[] {
        return this.children.map(c => c.name);
    }

    public override getType(): string {
        return 'ZState';
    }

    private playAllTimelines(container: ZContainer): void {
        if (container instanceof ZTimeline) {
            let t = container as ZTimeline;
            t.gotoAndPlay(0);
        }
        else{
            for(let i = 0; i < container.children.length; i++){
                let child = container.children[i];
                if(child instanceof ZContainer){
                    this.playAllTimelines(child);
                }
            }
        }
        
    }

    private stopAllTimelines(container: ZContainer): void {
        if (container instanceof ZTimeline) {
            let t = container as ZTimeline;
            t.stop();
        }
        else{
            for(let i = 0; i < container.children.length; i++){
                let child = container.children[i];
                if(child instanceof ZContainer){
                    this.stopAllTimelines(child);
                }
            }
        }
        
    }
}
