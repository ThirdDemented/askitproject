"""Fail closed: a build can produce QA artifacts without publishing a release."""
from pathlib import Path
import json,hashlib,sys,re
root=Path(__file__).resolve().parents[1]
required=['title','setup','prep','supplies','drive','gas','diner','rest','motel','mechanic','trade','underground','breakdown','failure','arrival','records','icon']+['car-'+x for x in ['comfort','executive','sport25','family','touring','fleet','compact','highway','commuter','sportgt']]
manifest=json.loads((root/'art-source/manifest.json').read_text(encoding='utf-8'))
assert set(required)<={x['id'] for x in manifest['assets']},'Missing scene or vehicle art'
for item in manifest['assets']:
    assert hashlib.sha256((root/'art-source'/item['source']).read_bytes()).hexdigest()==item['sha256'],item['id']
html=(root/'app/src/main/assets/www/index.html').read_text(encoding='utf-8')
js=(root/'app/src/main/assets/www/game.js').read_text(encoding='utf-8')
assert '<canvas' not in html and 'drawCar(' not in js and 'car-sil' not in js,'Placeholder art remains'
visible_source=html+'\n'+re.sub(r'const legacyCars=\[.*?\];','',js)
assert not re.search(r'\b(Buick|Lincoln|Nissan|Toyota|BMW|Chevrolet|Honda|Pontiac|Autotrader)\b|Auto Trader',visible_source,re.I),'Branded vehicle or classifieds text remains outside save migration'
config=(root/'app/build.gradle.kts').read_text(encoding='utf-8')
assert 'targetSdk = 36' in config and 'com.thirdemented.longwayhome.release2026' in config
assert 'beta.keystore' not in config,'Public test key must never sign a commercial release'
if '--source-only' in sys.argv:
    print('Source, art coverage and Android invariants passed');raise SystemExit()
gates=json.loads((root/'qa/release-gates.json').read_text(encoding='utf-8'))
required_gates=['visual_portrait','visual_landscape','animation','success_run','failure_run','rotation','persistence','routing','negotiation','trading','underground','audio','trip_computer','android_signed_api36','store_assets']
for gate in required_gates:assert gates['gates'].get(gate,{}).get('status')=='passed','Release blocked: '+gate
from source_digest import source_digest
assert gates['reviewed_source_digest']==source_digest(),'Reviewed game source changed after QA'
assert f'versionName = "{gates["version"]}"' in config,'Release/version mismatch'
print('All release gates passed for',gates['version'])
