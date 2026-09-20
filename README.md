# Paternoster Square — an interior study

An interactive, photo-informed model of the Paternoster Square office, built in **Blender through Blender MCP** and rendered with **Three.js**.

**[Explore the website](https://timothywong731.github.io/lseg-psq-office/)**

## Explore

- Atrium, entrance and upper-balcony camera compositions.
- Dedicated **1F market-launch button** view, with the lift lobby behind it.
- Trapezium-shaped atrium and stair rising toward the launch balcony.
- Animated stock ticker ribbons (illustrative graphics, not live prices), with pause control.
- Daylight adjustment, roof visibility, points of interest and a four-stop guided tour.
- Orbit, pan and zoom; PNG snapshot and GLB download; touch and keyboard controls.

Drag to orbit, right-drag to pan and scroll to zoom. Keys **1–4** select views; **R** resets the current camera. Reduced-motion preferences disable automatic ticker animation and smooth camera transitions.

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
- `public/models/paternoster.glb` — self-contained browser/download asset, approximately 1.7 MB.
- `scripts/build_model.py` — deterministic geometry generator, seed 731.
- `scripts/create_textures.py` — deterministic market graphics (Pillow; uses Windows Arial fonts).
- `docs/design.md` — reference observations and architecture.
- `docs/algorithmic-philosophy.md` — procedural modelling approach, adapted from the algorithmic-art skill.

The supplied eleven photos and three videos were inspected locally, including extracted video frames. Raw `media/` and inspection files are excluded from Git and the website. Model dimensions and floor arrangement are estimated from images, not a measured survey. The implementation is an independent study and is not affiliated with or endorsed by LSEG.

To regenerate the model, install Pillow for texture generation if needed, run `python scripts/create_textures.py`, then use Blender MCP's `execute_blender_code`:

```python
import runpy
runpy.run_path(r"/absolute/path/to/lseg-psq-office/scripts/build_model.py", run_name="__main__")
```

The generator creates/replaces only its dedicated `Paternoster Square | Spatial Study` scene and preserves other scenes. It saves the source `.blend` and exports the GLB. The server is not required by visitors to the published site.

## Deployment

GitHub Pages uses GitHub Actions. Pushes to `main` run asset validation and the production build, then deploy only `dist/` with the Pages workflow. Asset URLs are relative, so the site works at the repository subpath.

## Scope

This is a navigable architectural viewer, not a measured CAD tool or a collision-aware first-person walkthrough. Orbit controls allow inspecting the model from outside its walls. The GLB is a static geometry export; ticker movement and interactive lighting run in the website.
