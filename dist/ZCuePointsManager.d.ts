/** Static event bus for named cue-point callbacks fired by ZTimeline. */
export declare class ZCuePointsManager {
    private static cuePoints;
    static addCuePointListener(cuePoint: string, callback: Function): void;
    static removeCuePointListener(cuePoint: string, callback: Function): void;
    static triggerCuePoint(cuePoint: string, ...args: any[]): void;
}
//# sourceMappingURL=ZCuePointsManager.d.ts.map