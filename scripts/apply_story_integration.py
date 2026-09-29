"""Materialize a hash-checked source update once, retaining an auditable recipe.

CI commits the resulting ordinary source files on the expansion branch before
building. No external downloads, main-branch changes, or release publication.
"""
from pathlib import Path
import hashlib
import json
ROOT = Path(__file__).resolve().parents[1]
ALLOWED = {'app/build.gradle.kts', 'app/src/main/assets/www/game.js',
    'app/src/main/assets/www/index.html', 'app/src/main/assets/www/story-scenes.js',
    'app/src/androidTest/java/com/thelongwayhome/game/GameReleaseTest.java',
    'qa/android_qa.sh', 'qa/game-qa.cjs', 'qa/release-gates.json'}
def digest(text):
    return hashlib.sha256(text.encode('utf-8')).hexdigest()
def main():
    marker = ROOT / 'scripts/story-integration.pending'
    if not marker.exists():
        print('Integration already materialized; ordinary source is authoritative.')
        return
    recipe = json.loads((ROOT / 'scripts/story-integration-edit.json').read_text(encoding='utf-8'))
    if recipe.get('format') != 1 or {item['path'] for item in recipe['files']} != ALLOWED:
        raise ValueError('Unexpected integration recipe')
    changes = []
    for item in recipe['files']:
        path = ROOT / item['path']
        source = path.read_text(encoding='utf-8')
        if digest(source) == item['target']:
            continue
        if digest(source) != item['base']:
            raise ValueError('Source changed; refusing to overwrite: ' + item['path'])
        result = source
        previous = len(source)
        for start, end, replacement in reversed(item['edits']):
            if not (0 <= start <= end <= previous) or not isinstance(replacement, str):
                raise ValueError('Invalid or overlapping edit')
            result = result[:start] + replacement + result[end:]
            previous = start
        if digest(result) != item['target']:
            raise ValueError('Target hash mismatch: ' + item['path'])
        changes.append((path, result))
    # Validate every file before writing any; an interrupted application can retry.
    for path, result in changes:
        path.write_text(result, encoding='utf-8', newline='\n')
    marker.unlink()
    print('Verified integration source; materialized', len(changes), 'files.')
if __name__ == '__main__':
    main()
