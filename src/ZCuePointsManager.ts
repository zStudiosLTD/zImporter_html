/** Static event bus for named cue-point callbacks fired by ZTimeline. */
export class ZCuePointsManager {
    private static cuePoints: Map<string, Function[]> = new Map();

    static addCuePointListener(cuePoint: string, callback: Function): void {
        if (!this.cuePoints.has(cuePoint)) {
            this.cuePoints.set(cuePoint, []);
        }
        this.cuePoints.get(cuePoint)!.push(callback);
    }

    static removeCuePointListener(cuePoint: string, callback: Function): void {
        const callbacks = this.cuePoints.get(cuePoint);
        if (callbacks) {
            const idx = callbacks.indexOf(callback);
            if (idx !== -1) callbacks.splice(idx, 1);
        }
    }

    static triggerCuePoint(cuePoint: string, ...args: any[]): void {
        const callbacks = this.cuePoints.get(cuePoint);
        if (callbacks) {
            for (const cb of callbacks) cb(...args);
        }
    }
}
