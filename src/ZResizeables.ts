/** Static registry for objects that need to react to viewport resize. */
export class ZResizeables {
    static resizeables: Map<any, boolean> = new Map();

    static addResizeable(mc: any): void {
        ZResizeables.resizeables.set(mc, true);
    }

    static resize(): void {
        for (const [key] of ZResizeables.resizeables) {
            (key as any).resize();
        }
    }

    static removeResizeable(mc: any): void {
        ZResizeables.resizeables.delete(mc);
    }
}
