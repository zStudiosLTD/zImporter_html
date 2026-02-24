import { ZSceneStack } from './ZSceneStack';
import { ZContainer } from './ZContainer';

/**
 * Simple object pool.  Identical to the Phaser version — no engine-specific
 * code was needed.
 */
export class ZPool {
    private dict: { [key: string]: any } = {};
    private static instance: ZPool = new ZPool();

    private constructor() {
        if ((ZPool as any)._instance) {
            throw new Error('ZPool is a singleton — use ZPool.getInstance()');
        }
    }

    public static getInstance(): ZPool {
        return ZPool.instance;
    }

    public init(_numElements: number, symbolTemplate: string, type: string): void {
        this.dict[type] = {
            curIndex: 0,
            numElements: _numElements,
            CLS: symbolTemplate,
            pool: new Array(_numElements),
        };
        const pool = this.dict[type].pool;
        for (let i = 0; i < _numElements; i++) {
            pool[i] = ZSceneStack.spawn(symbolTemplate);
        }
    }

    public clear(type: string): void {
        if (!this.dict[type]) throw new Error(`ZPool: pool "${type}" does not exist`);
        this.dict[type].curIndex = 0;
    }

    public get(type: string): ZContainer {
        if (!this.dict[type]) throw new Error(`ZPool: pool "${type}" does not exist`);
        const obj = this.dict[type];
        const e = obj.pool[obj.curIndex];
        if (e == null) throw new Error(`ZPool: pool "${type}" limit exceeded (${obj.curIndex})`);
        if (obj.fnctn) obj.fnctn(e);
        obj.curIndex++;
        return e;
    }

    public putBack(e: ZContainer, type: string): void {
        if (!this.dict[type]) throw new Error(`ZPool: pool "${type}" does not exist`);
        const obj = this.dict[type];
        obj.curIndex--;
        obj.pool[obj.curIndex] = e;
    }
}
