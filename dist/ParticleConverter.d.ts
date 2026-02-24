/**
 * Converts PIXI v5 particle configuration to a simple HTML/CSS-compatible
 * particle description.  Identical to the Phaser version — no engine-specific
 * code was required.
 *
 * @remarks
 * The HTML version does not yet have a particle renderer; this class is
 * provided so that the same scene JSON that works in PIXI / Phaser also
 * compiles and loads cleanly in the HTML build.
 */
export declare class ParticleConverter {
    /**
     * Converts a PIXI particles v5 config object to a normalised description
     * that can be consumed by an HTML particle renderer.
     */
    static pixiToPhaserConfig(pixiConfig: any): any;
    private static processBehavior;
    private static processAlphaBehavior;
    private static processScaleBehavior;
    private static processColorBehavior;
    private static processMoveSpeedBehavior;
    private static processRotationStaticBehavior;
    private static processSpawnBurstBehavior;
    static hexToInt(hex: string): number;
}
//# sourceMappingURL=ParticleConverter.d.ts.map