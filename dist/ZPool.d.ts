import { ZContainer } from './ZContainer';
/**
 * Simple object pool.  Identical to the Phaser version — no engine-specific
 * code was needed.
 */
export declare class ZPool {
    private dict;
    private static instance;
    private constructor();
    static getInstance(): ZPool;
    init(_numElements: number, symbolTemplate: string, type: string): void;
    clear(type: string): void;
    get(type: string): ZContainer;
    putBack(e: ZContainer, type: string): void;
}
//# sourceMappingURL=ZPool.d.ts.map