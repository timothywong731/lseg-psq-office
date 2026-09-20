# Paternoster Square — an interior study

An interactive, photo-informed model of the Paternoster Square office, built in **Blender through Blender MCP** and rendered with **Three.js**.

**[Explore the website](https://timothywong731.github.io/lseg-psq-office/)**

## Explore

- Nine perspectives: atrium, entrance, balcony, **1F launch button**, **3F overlook**, reception, lift lobby, office desks and continuous drone flight.
- Click the physical launch button or the on-screen control to toggle **Market Open / Market Close**: confetti, clapping crowds, synthesized cheering, animated screens and ceremony lights.
- **Six lifts on every level**, G/F through 7F, directly behind the launch balcony.
- 98 detailed dual-monitor workstations and imported office chairs; 33 seated colleagues, 12 atrium walkers, 7 lift-lobby walkers and 39 ceremony spectators.
- Trapezium-shaped atrium and stair rising toward the launch balcony.
- Animated stock tickers, separate news ribbons and market video walls (illustrative graphics, not live prices), with pause control.
- Daylight adjustment, roof visibility, points of interest and a four-stop guided tour.
- Orbit, pan and zoom; PNG snapshot and GLB download; touch and keyboard controls.

Drag to orbit, right-drag to pan and scroll to zoom. Keys **1–8** select views; **D** toggles continuous drone flight; **R** resets the camera; **Escape** stops automatic camera movement. Reduced-motion preferences disable automatic people/ticker animation, confetti and smooth camera transitions. Drone flight starts only on explicit request. People and sound have independent controls.

## Run locally

Node 22.12+ or Node 24 is required by Vite. Development and deployment were verified with Node 24.

```sh
npm ci
npm run dev
```

```sh
npm test
npm run build
npm run test:e2e
```

Browser tests use installed Google Chrome. `npm run test:e2e` serves and tests the production `dist` directory, so build first.

## Model and provenance

- `assets/paternoster.blend` — editable Blender source, including packed screen textures.
- `public/models/paternoster.glb` — self-contained architectural asset, approximately 4 MB.
- `public/models/worker.glb`, `chair.glb` — assets imported, scaled and exported through Blender MCP; around 0.5 MB each.
- `public/models/seating.json` — workstation positions exported by Blender for runtime chair and occupant placement.
- `scripts/build_model.py` — deterministic geometry generator, seed 731.
- `scripts/create_textures.py` — deterministic market graphics (Pillow; uses Windows Arial fonts).
- `docs/design.md` — reference observations and architecture.
- `docs/algorithmic-philosophy.md` — procedural modelling approach, adapted from the algorithmic-art skill.

All 28 supplied images and three videos were inspected locally, including video contact sheets and detailed launch-control/lift/reception frames. Raw `media/` and inspection files are excluded from Git and the website. Model dimensions are estimated from images, not a measured survey. The implementation is an independent study and is not affiliated with or endorsed by LSEG.

### Asset credits

- [Man by Quaternius](https://poly.pizza/m/HMnuH5geEG), [CC0](https://creativecommons.org/publicdomain/zero/1.0/), sourced from Poly Pizza. Scaled in Blender, lower-leg materials changed to trousers, runtime clothing/skin palette variations. Original walk, idle, sitting and clapping clips are used.
- [Low Poly Office Chair by NoodleBaguette](https://sketchfab.com/3d-models/448bfab6a5bb4d94ba439a50ddc89a29), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), sourced from Sketchfab. Scaled to 1.1 m and texture images resized to 512 px in Blender. Also credited in the app's About dialog.

To regenerate the model, install Pillow for texture generation if needed, run `python scripts/create_textures.py`, then use Blender MCP's `execute_blender_code`:

```python
import runpy
runpy.run_path(r"/absolute/path/to/lseg-psq-office/scripts/build_model.py", run_name="__main__")
```

The generator creates/replaces only its dedicated `Paternoster Square | Spatial Study` scene and preserves other scenes. It saves the source `.blend` and exports the GLB. The server is not required by visitors to the published site.

## Deployment

GitHub Pages uses GitHub Actions. Pushes to `main` run asset validation and the production build, then deploy only `dist/` with the Pages workflow. Asset URLs are relative, so the site works at the repository subpath.

## Scope

This is a navigable architectural viewer, not a measured CAD tool or a collision-aware first-person walkthrough. Orbit controls allow inspecting the model from outside its walls. The main GLB contains architectural geometry; the website assembles animated worker/chair assets, screen textures, confetti and interactive lighting at runtime.
