# Illustrated world and interface

The approved direction is high-detail 16/32-bit automotive pixel art: original fictional used cars, rich American roadside scenes, varied natural lighting, deep blue/black shadows, sage greens, and crisp cream/amber interfaces. The final user direction is “Keep the detail, make the pixels more visibly retro”: use chunky, visible pixel clusters, stepped silhouettes and deliberate dithering, while retaining the detailed compositions. Text and controls are native HTML/CSS, never baked into illustrations.

The original PNG for every scene and car is retained in `art-source`, with the exact built-in image-generation prompt and SHA-256 in its manifest. `scripts/rebuild_art.py` verifies sources before converting them to lossless runtime WebP. Build reconstruction never depends on generating a new image or on a temporary download URL. The launcher and store assets derive from retained original artwork. A source hash change requires another visual review.

Every scene has separate portrait and landscape captures. Inspect both for crop, legibility, control access, missing imagery, clipped text and tonal consistency. A passing automated screenshot check alone is not visual approval. Scene effects must be visible without obscuring choices and must stop for reduced motion or a backgrounded app.

Lighting follows each location: neutral midday and soft overcast light for everyday scenes, cool night and neon for overnight stops, warm practical lamps indoors, and a sunset reserved for the title. Do not apply golden-hour light to every scene.

Vehicles use original unbranded designs and descriptive fictional model names. Distinct headlamp, grille, body, window and rear-quarter shapes are required; removing a badge from an otherwise recognizable branded car is insufficient. No real manufacturer logos or branded classifieds/supply products appear in player-facing content. Historical names remain only in the save migration table.
