"""Hash reviewed game content consistently across Windows/Linux and PNG/WebP encoders."""
from pathlib import Path
import hashlib, json, re
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
def source_digest():
    digest=hashlib.sha256()
    files=list((ROOT/'app/src/main').rglob('*'))
    files += [ROOT/p for p in ['art-source/manifest.json','scripts/rebuild_art.py','scripts/launcher.py','requirements-art.txt','app/build.gradle.kts']]
    for p in sorted((p for p in files if p.is_file()),key=lambda p:p.relative_to(ROOT).as_posix()):
        name=p.relative_to(ROOT).as_posix()
        digest.update(name.encode()+b'\0')
        if p.suffix in ('.webp','.png'):
            with Image.open(p) as im:
                im=im.convert('RGBA')
                data=f'{im.width}x{im.height}\0'.encode()+im.tobytes()
        else:
            text=p.read_text(encoding='utf-8').replace('\r\n','\n')
            if name=='app/build.gradle.kts':
                # Version metadata is intentionally bumped after the reviewed game passes.
                text=re.sub(r'version(?:Code|Name) = [^\n]+','version = RELEASE_METADATA',text)
            data=text.encode('utf-8')
        digest.update(hashlib.sha256(data).digest())
    return digest.hexdigest()

if __name__=='__main__': print(source_digest())
