---
name: zimporter-setup
description: Set up zimporter-html, load a zStudio scene and find elements by name (HTML). Load before writing any code that uses a zStudio scene.
---
# zImporter setup (HTML)

zImporter loads scenes exported from zStudio. Install with `npm i zimporter-html`. The exported folder holds `placements.json` and images; serve it from somewhere like `public/assets/mainMenu/`.

```ts
import { ZScene, ZSceneStack, ZUpdatables } from 'zimporter-html';

ZUpdatables.init(24);   // timeline frame rate. Starts its own loop: do not call update().

window.addEventListener('resize', () => ZSceneStack.resize(innerWidth, innerHeight));

const scene = new ZScene('mainMenu');
scene.load('./assets/mainMenu/', () => {
  ZSceneStack.push(scene);
  scene.loadStage(document.getElementById('app')!);   // give this element a size in CSS
  // wire up the scene here
});
```
This importer renders `<div>` elements: no canvas, no engine. Spine and particles are not supported. `load()` has no progress callback.

A failed load of `placements.json` can stay silent. If nothing appears, check the Network tab and the trailing slash.

## Finding elements

Always call these after `loadStage()`.

```ts
const stage = scene.sceneStage;
const btn = stage.get('playBtn') as ZButton;     // searches all levels, first match or null
const close = popup.get('closeBtn') as ZButton;  // search inside one container
stage.getAll('coin');                     // all elements with this name
stage.getAllOfType('ZButton');                   // all elements of a type
stage.playBtn;                                   // direct children are also properties
```

Names are the instance names set in zStudio. The class comes from the container type: Button = `ZButton`, Toggle = `ZToggle`, Slider = `ZSlider`, Scroll Bar = `ZScroll`, State = `ZState`. Check timelines with `instanceof ZTimeline`.

## Switching scenes

```ts
ZSceneStack.pop();          // or clear() to remove every scene
await oldScene.destroy();
const next = new ZScene('mainMenu');
next.load(path, () => { ZSceneStack.push(next); next.loadStage(document.getElementById('app')!); });
```

 To layer a scene over another, push and load it without destroying the first. Also available: `ZSceneStack.peek()`, `getStackSize()`, `ZScene.getSceneById(id)`.
