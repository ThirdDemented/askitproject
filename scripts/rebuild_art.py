"""Reconstruct runtime artwork deterministically from checked-in original PNGs.

Install the pinned requirements first. Generation is a one-time creative step;
every subsequent build uses the exact approved originals, never a new AI call.
"""
from pathlib import Path
from PIL import Image
import hashlib, json, sys
ROOT=Path(__file__).resolve().parents[1]
manifest=json.loads((ROOT/'art-source/manifest.json').read_text(encoding='utf-8'))
out=ROOT/'app/src/main/assets/www/art'
out.mkdir(parents=True,exist_ok=True)
for entry in manifest['assets']:
    source=ROOT/'art-source'/entry['source']
    if hashlib.sha256(source.read_bytes()).hexdigest()!=entry['sha256']:
        raise SystemExit('Artwork source hash mismatch: '+entry['id'])
    with Image.open(source) as im:
        target=out/(entry['id']+'.webp')
        temporary=target.with_suffix('.webp.tmp')
        im.convert('RGB').save(temporary,format='WEBP',lossless=True,method=6,exact=True)
        temporary.replace(target)
print(f'Reconstructed {len(manifest["assets"])} verified illustrations')
