"""Package only QA evidence; never include private signing files or environment data."""
from pathlib import Path
import json, zipfile
from source_digest import source_digest
root=Path(__file__).resolve().parents[1]
result=root/'qa/results';result.mkdir(exist_ok=True,parents=True)
(result/'reviewed-source.json').write_text(json.dumps({'source_digest':source_digest(),'algorithm':'SHA256 of canonical text and decoded image pixels; excludes version-only metadata'},indent=2))
files=[]
for folder in ['qa/captures','qa/results']:
    files += [p for p in (root/folder).rglob('*') if p.is_file()]
for pattern in ['*-portrait.png','*-landscape.png','*-smoke.log','*-verification.txt']:
    files += list(root.glob(pattern))
files += [root/'qa/release-gates.json',root/'ART_DIRECTION.md',root/'signing-certificate.sha256']
if (root/'qa/REVIEW.md').exists():files.append(root/'qa/REVIEW.md')
with zipfile.ZipFile(root/'The-Long-Way-Home-QA-Evidence.zip','w',zipfile.ZIP_DEFLATED) as z:
    for p in sorted(set(files)):z.write(p,p.relative_to(root).as_posix())
print('Packaged',len(set(files)),'review evidence files')
