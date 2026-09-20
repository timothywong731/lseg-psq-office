# Paternoster Square implementation plan

**Goal:** Publish an interactive Blender-derived reconstruction of the office interior on GitHub Pages.

**Architecture:** A reproducible Python script executed through Blender MCP creates a separate scene and exports `public/models/paternoster.glb`. A Three.js viewer and lightweight HTML/CSS interface provide three interior views and exploration controls.

**Tech stack:** Blender 5.1.1, Three.js 0.186.0, Vite 8.3.0, Playwright 1.63.0, GitHub Pages.

**Spec:** `docs/design.md`.

## Constraints

Preserve the existing Blender scene. Keep source media local. Use relative asset URLs so repository Pages hosting works. Model proportions are estimated. Market displays are illustrative. No backend or API keys.

## Tasks

- [ ] Model: `scripts/build_model.py` owns geometry and GLB export; `scripts/create_textures.py` owns deterministic display textures. Inspect the exported scene and validate named architecture groups, bounds and mesh counts.
- [ ] Viewer: `src/viewer.js` owns rendering and camera transitions; `src/views.js` owns view definitions. Load GLB through `GLTFLoader`, fit viewport with ResizeObserver, clamp pixel ratio and use material batching. Provide load errors and WebGL fallback.
- [ ] Interface: `index.html`, `src/style.css`, `src/main.js` own responsive layout and controls. Bind views, tour, roof, annotations, lighting, camera reset, image export and fullscreen. Ensure all buttons have accessible names and focus styles.
- [ ] Verify: `tests/model.test.mjs` checks real GLB contents; `tests/viewer.spec.js` checks actual browser loading, camera presets, tour cancellation, toggles, screenshot download, mobile layout and keyboard interaction. Inspect desktop/mobile screenshots.
- [ ] Deploy: `.github/workflows/pages.yml` builds and publishes the static artifact. Push the implementation, enable Pages, wait for successful deployment and verify public HTML/GLB responses.
