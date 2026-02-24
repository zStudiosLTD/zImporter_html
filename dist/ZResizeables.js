/** Static registry for objects that need to react to viewport resize. */
export class ZResizeables {
    static resizeables = new Map();
    static addResizeable(mc) {
        ZResizeables.resizeables.set(mc, true);
    }
    static resize() {
        for (const [key] of ZResizeables.resizeables) {
            key.resize();
        }
    }
    static removeResizeable(mc) {
        ZResizeables.resizeables.delete(mc);
    }
}
//# sourceMappingURL=ZResizeables.js.map