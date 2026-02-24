/** Static event bus for named cue-point callbacks fired by ZTimeline. */
export class ZCuePointsManager {
    static cuePoints = new Map();
    static addCuePointListener(cuePoint, callback) {
        if (!this.cuePoints.has(cuePoint)) {
            this.cuePoints.set(cuePoint, []);
        }
        this.cuePoints.get(cuePoint).push(callback);
    }
    static removeCuePointListener(cuePoint, callback) {
        const callbacks = this.cuePoints.get(cuePoint);
        if (callbacks) {
            const idx = callbacks.indexOf(callback);
            if (idx !== -1)
                callbacks.splice(idx, 1);
        }
    }
    static triggerCuePoint(cuePoint, ...args) {
        const callbacks = this.cuePoints.get(cuePoint);
        if (callbacks) {
            for (const cb of callbacks)
                cb(...args);
        }
    }
}
//# sourceMappingURL=ZCuePointsManager.js.map