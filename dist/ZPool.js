import { ZSceneStack } from './ZSceneStack';
/**
 * Simple object pool.  Identical to the Phaser version — no engine-specific
 * code was needed.
 */
export class ZPool {
    dict = {};
    static instance = new ZPool();
    constructor() {
        if (ZPool._instance) {
            throw new Error('ZPool is a singleton — use ZPool.getInstance()');
        }
    }
    static getInstance() {
        return ZPool.instance;
    }
    init(_numElements, symbolTemplate, type) {
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
    clear(type) {
        if (!this.dict[type])
            throw new Error(`ZPool: pool "${type}" does not exist`);
        this.dict[type].curIndex = 0;
    }
    get(type) {
        if (!this.dict[type])
            throw new Error(`ZPool: pool "${type}" does not exist`);
        const obj = this.dict[type];
        const e = obj.pool[obj.curIndex];
        if (e == null)
            throw new Error(`ZPool: pool "${type}" limit exceeded (${obj.curIndex})`);
        if (obj.fnctn)
            obj.fnctn(e);
        obj.curIndex++;
        return e;
    }
    putBack(e, type) {
        if (!this.dict[type])
            throw new Error(`ZPool: pool "${type}" does not exist`);
        const obj = this.dict[type];
        obj.curIndex--;
        obj.pool[obj.curIndex] = e;
    }
}
//# sourceMappingURL=ZPool.js.map