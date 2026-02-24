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
export class ParticleConverter {
    /**
     * Converts a PIXI particles v5 config object to a normalised description
     * that can be consumed by an HTML particle renderer.
     */
    static pixiToPhaserConfig(pixiConfig) {
        const cfg = {};
        // Lifetime (PIXI: seconds, output: milliseconds)
        if (pixiConfig.lifetime) {
            cfg.lifespan = {
                min: (pixiConfig.lifetime.min ?? 1) * 1000,
                max: (pixiConfig.lifetime.max ?? 1) * 1000,
            };
        }
        else {
            cfg.lifespan = { min: 1000, max: 1000 };
        }
        // Emission frequency (PIXI: seconds → ms)
        if (pixiConfig.frequency !== undefined) {
            const freqMs = pixiConfig.frequency * 1000;
            cfg.frequency = freqMs;
            if (pixiConfig.maxParticles) {
                const lifespanMs = cfg.lifespan.max;
                const maxSimultaneous = Math.ceil(lifespanMs / freqMs) + 1;
                cfg.maxParticles = Math.max(pixiConfig.maxParticles, maxSimultaneous);
            }
        }
        else {
            cfg.frequency = 100;
        }
        // Max particles
        if (pixiConfig.maxParticles) {
            cfg.maxParticles = pixiConfig.maxParticles;
        }
        else {
            cfg.maxParticles = 100;
        }
        // Emitter lifetime
        if (pixiConfig.emitterLifetime === -1) {
            cfg.duration = -1; // infinite
        }
        else if (pixiConfig.emitterLifetime > 0) {
            cfg.duration = pixiConfig.emitterLifetime * 1000;
        }
        cfg.quantity = 1;
        // Process behaviours
        if (Array.isArray(pixiConfig.behaviors)) {
            for (const behavior of pixiConfig.behaviors) {
                ParticleConverter.processBehavior(behavior, cfg);
            }
        }
        return cfg;
    }
    static processBehavior(behavior, cfg) {
        switch (behavior.type) {
            case 'alpha':
                ParticleConverter.processAlphaBehavior(behavior.config, cfg);
                break;
            case 'scale':
                ParticleConverter.processScaleBehavior(behavior.config, cfg);
                break;
            case 'color':
                ParticleConverter.processColorBehavior(behavior.config, cfg);
                break;
            case 'moveSpeed':
                ParticleConverter.processMoveSpeedBehavior(behavior.config, cfg);
                break;
            case 'rotationStatic':
                ParticleConverter.processRotationStaticBehavior(behavior.config, cfg);
                break;
            case 'spawnBurst':
                ParticleConverter.processSpawnBurstBehavior(behavior.config, cfg);
                break;
            default: break;
        }
    }
    static processAlphaBehavior(config, cfg) {
        if (config?.alpha?.list?.length >= 2) {
            cfg.alpha = { start: config.alpha.list[0].value, end: config.alpha.list[config.alpha.list.length - 1].value };
        }
    }
    static processScaleBehavior(config, cfg) {
        if (config?.scale?.list?.length >= 2) {
            cfg.scale = { start: config.scale.list[0].value, end: config.scale.list[config.scale.list.length - 1].value };
        }
    }
    static processColorBehavior(config, cfg) {
        if (config?.color?.list?.length >= 2) {
            cfg.tint = {
                start: ParticleConverter.hexToInt(config.color.list[0].value),
                end: ParticleConverter.hexToInt(config.color.list[config.color.list.length - 1].value),
            };
        }
    }
    static processMoveSpeedBehavior(config, cfg) {
        if (config?.speed?.list?.length >= 2) {
            cfg.speed = { start: config.speed.list[0].value, end: config.speed.list[config.speed.list.length - 1].value };
        }
        if (config?.minMult !== undefined)
            cfg.speedMult = { min: config.minMult, max: 1 };
        if (config?.acceleration)
            cfg.gravityY = config.acceleration.y ?? 0;
    }
    static processRotationStaticBehavior(config, cfg) {
        if (config?.min !== undefined && config?.max !== undefined) {
            cfg.rotate = { min: config.min, max: config.max };
        }
    }
    static processSpawnBurstBehavior(config, cfg) {
        if (config?.particlesPerWave)
            cfg.quantity = config.particlesPerWave;
        if (config?.angle)
            cfg.angle = { min: config.angle.min ?? 0, max: config.angle.max ?? 360 };
    }
    static hexToInt(hex) {
        return parseInt(hex.replace('#', ''), 16);
    }
}
//# sourceMappingURL=ParticleConverter.js.map