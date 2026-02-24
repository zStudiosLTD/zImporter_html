import { ZContainer } from './ZContainer';
import { ZScene } from './ZScene';
/**
 * Static stack of ZScene instances.
 * Mirrors the PIXI/Phaser ZSceneStack interface exactly.
 */
export declare class ZSceneStack {
    private static stack;
    private static stackSize;
    private static top;
    static push(resource: ZScene): void;
    static pop(): ZScene | null;
    static peek(): ZScene | null;
    static getStackSize(): number;
    static clear(): void;
    static spawn(templateName: string): ZContainer | undefined;
    static resize(width: number, height: number): void;
}
//# sourceMappingURL=ZSceneStack.d.ts.map