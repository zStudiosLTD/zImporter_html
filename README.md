# zImporter HTML

An HTML/CSS div-based renderer for zStudio scenes. Part of the `zImporter` family alongside the [PIXI](https://github.com/yonnyzohar/zImporter_PIXI) and [Phaser](https://github.com/yonnyzohar/zImporter_Phaser) versions.

## What it does

Loads the same `placements.json` format produced by zStudio and constructs the scene as a tree of `<div>` elements using CSS transforms — no canvas, no game engine dependency.

### Supported asset types

| Type | Status |
|------|--------|
| Container (asset) | ✅ |
| Button (btn) | ✅ |
| State machine (state) | ✅ |
| Toggle | ✅ |
| Timeline / animation | ✅ |
| Image (img) | ✅ |
| Nine-slice (9slice) | ✅ via `border-image` |
| Text / TextField | ✅ via `<span>` |
| Spine | ❌ not supported |
| Particles | ❌ not supported |

## Installation

```bash
npm install
npm run build      # emit JS + .d.ts to dist/
npm run package    # also bundles with webpack → dist/zimporter-html.min.js
```

## Usage

```typescript
import { ZScene, ZButton, ZToggle, ZTimeline, ZContainer, ZUpdatables } from 'zimporter-html';

// 1. Boot the animation ticker (drives ZTimeline)
ZUpdatables.init(24); // fps

// 2. Create and load a scene
const scene = new ZScene('myScene');
scene.load('./assets/myScene/', () => {

  // 3. Build the DOM and attach it to a host element
  scene.loadStage(document.getElementById('app')!);

  // 4. Access named containers exactly as in the PIXI / Phaser versions
  const btn = scene.sceneStage.get('myButton') as ZButton;
  btn.pressCallback = () => console.log('Button pressed!');

  // 5. React to resize
  window.addEventListener('resize', () =>
    scene.resize(window.innerWidth, window.innerHeight));
});
```

## Transform model

CSS transforms replicate PIXI's hierarchical transform 1-to-1:

```
T(x, y) · R(rotation) · S(scaleX, scaleY) · T(–pivotX, –pivotY)
```

Each `ZContainer` is a `position:absolute; width:0; height:0; overflow:visible` div so children are placed in local coordinate space and the parent's transform is applied hierarchically, identical to PIXI containers.

The stage div is given explicit `width × height` (scene resolution) and then scaled + centred via CSS transform to fit the viewport.

## API surface

The public API is identical to `zImporter-PIXI`:

- `ZContainer` — base display object (div)
- `ZButton` — interactive button with up/down/over/disabled states
- `ZState` — shows one named child state at a time
- `ZToggle` — flips between `onState` / `offState`
- `ZTimeline` — frame-based animation driven by `ZUpdatables`
- `ZScene` — loads `placements.json` and builds the scene graph
- `ZSceneStack` — stacks multiple ZScene instances
- `ZUpdatables` — RAF-based animation ticker
- `ZResizeables` — resize listener registry
- `ZCuePointsManager` — named cue-point event bus
