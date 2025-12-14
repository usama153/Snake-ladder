Snakes & Ladders Visual Guide

What I changed
- Replaced large stretched bitmap overlays with an SVG overlay that draws ladder rails and snake paths.
- Added small `ladder-icon.svg` at ladder midpoints instead of stretching a ladder image across the whole path (keeps aspect ratio). Short rails + rungs are drawn for visual clarity.
- Added small `snake-head.svg` at the start/upper cell of a snake and a small tail marker at the destination. The snake curve is drawn with a smooth bezier curve and a small arrowhead marker at the end to clarify direction.
- Added low-opacity labels at the start and end of each snake/ladder with white stroke for readability and small icons to indicate presence.
- Added button to toggle the overlay so the board remains clean while playing.
- Adjusted stroke widths and grid cell outlines to improve contrast and prevent clutter.

How to change the images
- Swap the icon files in `assets/ladder-icon.svg` and `assets/snake-head.svg` — keep them as single-color or simplified shapes for best results.
- If you want the ladder image to be vertical instead of mid-rotated, replace the small icon with a vertical ladder (and rotate=0 in the render code).

Improving visuals further
- Use properly designed snake body textures if you want the whole body to be visible: you can implement an SVG pattern and stroke with that pattern, or draw repeated small segments along the curve.
- If you need 3D-looking ladders, supply multiple ladder images for each orientation and pick the closest one based on `angle`.
- Tweak `ladder-rung` count or `ladder-line` stroke width in `script.js` or `style.css` to make rails and rungs longer or thicker.

Notes
- The overlay is drawn using bounding boxes of the cells (so changes in CSS layout like cell sizes affect overlay positions). The overlay re-renders on window resize.
- For minimal ECG-like visuals, toggle the overlay off using the button on the right panel.
