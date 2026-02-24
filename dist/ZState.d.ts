import { ZContainer } from './ZContainer';
/**
 * A stateful container: only one named child is visible at a time.
 * Mirrors the PIXI ZState interface exactly.
 */
export declare class ZState extends ZContainer {
    currentState: ZContainer | null;
    init(): void;
    getCurrentState(): ZContainer | null;
    hasState(str: string): boolean;
    setState(str: string): ZContainer | null;
    getAllStateNames(): (string | null)[];
    getType(): string;
}
//# sourceMappingURL=ZState.d.ts.map