# Paternoster Square / spatial study

An interactive interior reconstruction of the LSEG Paternoster Square office, based on all 28 images and three videos supplied in `media/`. Geometry is inferred from photographs, not surveyed. Proportions are a visual approximation. This is an independent study, not an official LSEG product.

## Visual evidence

- The balcony photograph `PXL_20260915_121337582.jpg` and first video establish the long tapered void, glazed office fronts, pale stone floors, metal fascia, suspended lighting and stair along one side. The user's correction confirms a trapezium rather than a rectangle.
- Ground-level photos `122526375` through `122533014` and the third video establish the tilted market cube on a perforated steel pedestal, entrance gates, cylindrical columns and glazed roof.
- Photos `132638529` through `132645584` establish upper-floor glass, mullion spacing, timber cafe tables and the view across the atrium.
- The second video establishes ticker bands, large market screens, mezzanine access and reception finishes.
- The second video at 4 seconds and the balcony still establish stair orientation: left when looking from the launch balcony toward the far market screen, descending away from that balcony. The first attempt had the rise reversed; this is corrected in the model.
- The second video around 10–14 seconds clearly shows the launch console: a square engraved metallic control on an angled pedestal integrated into a wide concave steel parapet. Around 22–25 seconds, the lift corridor is visible behind the balcony. Both are modelled, with a dedicated fourth viewpoint.
- The third video's ground-level view confirms the stair appears on the right when looking back toward the launch/lift-lobby end.

## Architecture

### Expanded reference review and second revision

- Reviewed every supplied image in four contact sheets, all three video contact sheets, the second video's two-second sampling, and enlarged launch-control, lift-lobby and ground-reception frames.
- `skynews-london-stock-exchange_6433018.jpg`, `-1x-1.webp` and the second video show the long stone stair's open glass edge, adjacent glass separator and solid office-side wall. The glass handrail is now only on the atrium side.
- `1200x675_cmsv2...avif`, `gettyimages-2211937245-640x640.jpg` and `London-Stock-Exchange-1.webp` show the far board spanning the narrow end between the two ribbon displays. The main screen now fills that width; the near board is a larger wall-mounted panel to the left of the lift opening, repeated below at G/F. Graphics animate as red/green market trails and numerical rows. The upper ribbon carries news; the lower ribbon carries prices.
- The third video at about 8–10 seconds establishes one elongated navy reception counter, a pale top and multiple bright video panels on a navy wall, with cylindrical columns in front. The mirrored reception desks were removed. Lounge seats remain opposite the stair near the launch end; the reception occupies the entrance half of the other side.
- `capital-raising.jpg`, `London-Stock-Exchange-007.avif` and `4to9-LSEG_SUC_MC...jpg` inform the ceremony: spectators on galleries, blue/green light, falling confetti and a broad launch-balcony banner.
- The user's confirmation establishes six lifts per floor. Each of the eight modeled levels (G/F + 1F–7F) now has an open axial corridor with three lift doors per side. No upper-floor end wall blocks the lift corridor.
- `PXL_20260915_121337582.jpg` informs the 3F downward overlook; the café-table photos inform the side-gallery detail. The 90-second drone loop stays within the void and is interrupted by manual camera movement.
- Quaternius's CC0 animated person and NoodleBaguette's CC BY 4.0 office chair were found with both asset search tools and downloaded through Blender MCP. Asset-provider toggles must be enabled on the separate asset scene. Characters were scaled and adapted to trousers in Blender; chairs were scaled and their textures resized. Credits are in README and the About dialog.
- Architectural GLB, character GLB, chair GLB and seating layout are separate assets. Runtime skeleton mixers drive idle, walking, sitting and clapping clips. A seeded crowd route avoids the cube/stair; observers gather on every launch-side gallery. The ceremony state persists after its eight-second visual effect expires and toggles in both directions.
- Screen graphics and synthesized applause/cheering are generated locally; no market or audio service is required. Reduced motion disables automatic people, screens and confetti. Drone flight is explicit; sound can be muted immediately.

Blender MCP runs a reproducible seeded Python modelling script in a new scene; the user's original scene is preserved. Architectural geometry and screen textures export to a glTF binary. Three.js loads that actual Blender asset. The website is static, built with Vite, and deployed through GitHub Actions to GitHub Pages. Original media remain local and are not published.

The interface uses a warm paper sidebar and an expansive interactive viewport. Three primary camera presets focus on the atrium, entrance and balcony, with a close-up for the 1F market-launch button, four additional inspection views and a continuous drone view. The guided tour retains four principal stops. Daylight, roof visibility and annotations can be adjusted. Stock tickers use animated UV offsets; animation can be paused and defaults off for reduced motion. Users can reset the camera, enter fullscreen, save a PNG and download the GLB. A tapered plan diagram and view-specific notes orient the visitor. Keyboard and touch controls, reduced motion, loading progress and retryable failure states are included.

## Verification

Inspect the Blender viewport and model metadata. Validate the exported GLB structure and required geometry groups. Build the site, test the actual WebGL viewer and interactions at desktop/mobile sizes, review screenshots, and check the deployed URL and model response.
