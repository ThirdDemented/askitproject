"""One-shot, hash-checked transfer of alpha2 edits into normal tracked source.

Never fetch code from outside the repository. Refuse changed input files. The
workflow commits these ordinary source files on codex/chaos-phase1 before tests.
"""
from pathlib import Path
import hashlib, json
ROOT=Path(__file__).resolve().parents[1]
def blob(text):
    data=text.encode('utf-8')
    return hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()
def main():
    marker=ROOT/'scripts/story-depth.pending'
    if not marker.exists():
        print('Depth source already materialized.');return
    data=json.loads((ROOT/'scripts/story-depth-edits.json').read_text())
    allowed=set(data['allowed'])
    if len(allowed)!=len(data['files']) or allowed!={f['path'] for f in data['files']}:
        raise ValueError('Duplicate or unexpected file')
    changes=[]
    for f in data['files']:
        name=f['path']
        if name.startswith('/') or '..' in Path(name).parts or not name.startswith(('app/','qa/')):
            raise ValueError('Path outside application/test scope')
        path=ROOT/name;source=path.read_text(encoding='utf-8')
        if blob(source)!=f['base_blob']:raise ValueError('Changed input: '+name)
        result=source
        if 'ranges' in f:
            previous=len(source)
            for start,end,replacement in reversed(f['ranges']):
                if not 0<=start<=end<=previous:raise ValueError('Invalid edit')
                result=result[:start]+replacement+result[end:];previous=start
        for before,after,count in f.get('replace',[]):
            if result.count(before)!=count:raise ValueError('Unexpected source in '+name+': '+before[:60])
            result=result.replace(before,after)
        if f.get('java_methods'):
            if result.count('\n}')!=1:raise ValueError('Unexpected Java class boundary')
            result=result.replace('\n}', '\n'+(ROOT/'qa/StoryDepth.methods.txt').read_text()+'\n}')
        if f.get('target_blob') and blob(result)!=f['target_blob']:raise ValueError('Target mismatch: '+name)
        changes.append((path,result))
    for path,text in changes:path.write_text(text,encoding='utf-8',newline='\n')
    marker.unlink()
    print('Materialized',len(changes),'hash-checked files.')
if __name__=='__main__':main()
