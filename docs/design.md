# Paternoster Square / spatial study

An interactive interior reconstruction of the LSEG Paternoster Square office, based on eleven photos and three videos supplied in `media/`. Geometry is inferred from photographs, not surveyed. Floor count and proportions are a visual approximation. This is an independent study, not an official LSEG product.

## Visual evidence

- The balcony photograph `PXL_20260915_121337582.jpg` and first video establish the long tapered void, glazed office fronts, pale stone floors, metal fascia, suspended lighting and stair along one side. The user's correction confirms a trapezium rather than a rectangle.
- Ground-level photos `122526375` through `122533014` and the third video establish the tilted market cube on a perforated steel pedestal, entrance gates, cylindrical columns and glazed roof.
- Photos `132638529` through `132645584` establish upper-floor glass, mullion spacing, timber cafe tables and the view across the atrium.
- The second video establishes ticker bands, large market screens, mezzanine access and reception finishes.
- The second video at 4 seconds and the balcony still establish stair orientation: left when looking from the launch balcony toward the far market screen, descending away from that balcony. The first attempt had the rise reversed; this is corrected in the model.
- The second video around 10–14 seconds clearly shows the launch console: a square engraved metallic control on an angled pedestal integrated into a wide concave steel parapet. Around 22–25 seconds, the lift corridor is visible behind the balcony. Both are modelled, with a dedicated fourth viewpoint.
- The third video's ground-level view confirms the stair appears on the right when looking back toward the launch/lift-lobby end.

## Architecture

Blender MCP runs a reproducible seeded Python modelling script in a new scene; the user's original scene is preserved. Architectural geometry and screen textures export to a glTF binary. Three.js loads that actual Blender asset. The website is static, built with Vite, and deployed through GitHub Actions to GitHub Pages. Original media remain local and are not published.

The interface uses a warm paper sidebar and an expansive interactive viewport. Three primary camera presets focus on the atrium, entrance and balcony, with a fourth close-up for the 1F market-launch button. A guided tour transitions between all four. Daylight, roof visibility and annotations can be adjusted. Stock tickers use animated UV offsets; animation can be paused and defaults off for reduced motion. Users can reset the camera, enter fullscreen, save a PNG and download the GLB. A tapered plan diagram and view-specific notes orient the visitor. Keyboard and touch controls, reduced motion, loading progress and retryable failure states are included.

## Verification

Inspect the Blender viewport and model metadata. Validate the exported GLB structure and required geometry groups. Build the site, test the actual WebGL viewer and interactions at desktop/mobile sizes, review screenshots, and check the deployed URL and model response.
