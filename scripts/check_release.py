"""Fail closed: a build can produce QA artifacts without publishing a release."""
from pathlib import Path
import json,hashlib,sys,re
root=Path(__file__).resolve().parents[1]
required=['title','setup','prep','supplies','drive','gas','diner','rest','motel','mechanic','trade','underground','breakdown','failure','arrival','records','icon']+['car-'+x for x in ['buick','lincoln','altima','camry','bmw','crownvic','focus','impala','accord','pontiac']]
manifest=json.loads((root/'art-source/manifest.json').read_text())
assert set(required)<={x['id'] for x in manifest['assets']},'Missing scene or vehicle art'
for item in manifest['assets']:
    assert hashlib.sha256((root/'art-source'/item['source']).read_bytes()).hexdigest()==item['sha256'],item['id']
html=(root/'app/src/main/assets/www/index.html').read_text()
js=(root/'app/src/main/assets/www/game.js').read_text()
assert '<canvas' not in html and 'drawCar(' not in js and 'car-sil' not in js,'Placeholder art remains'
config=(root/'app/build.gradle.kts').read_text()
assert 'targetSdk = 36' in config and 'com.thirdemented.longwayhome.release2026' in config
assert 'beta.keystore' not in config,'Public test key must never sign a commercial release'
if '--source-only' in sys.argv:
    print('Source, art coverage and Android invariants passed');raise SystemExit()
gates=json.loads((root/'qa/release-gates.json').read_text())
required_gates=['visual_portrait','visual_landscape','animation','success_run','failure_run','rotation','persistence','routing','negotiation','trading','underground','audio','trip_computer','android_signed_api36','store_assets']
for gate in required_gates:assert gates['gates'].get(gate,{}).get('status')=='passed','Release blocked: '+gate
digest=hashlib.sha256()
for p in sorted((root/'app/src/main').rglob('*')):
    if p.is_file():digest.update(p.relative_to(root).as_posix().encode());digest.update(p.read_bytes())
assert gates['reviewed_source_digest']==digest.hexdigest(),'Reviewed game source changed after QA'
assert f'versionName = "{gates["version"]}"' in config,'Release/version mismatch'
print('All release gates passed for',gates['version'])
