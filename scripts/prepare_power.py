"""Pinned, integrity-checked offline libraries. No AI model."""
import pathlib, urllib.request, hashlib, shutil, subprocess, json, os
ROOT=pathlib.Path(__file__).resolve().parents[1]
V=ROOT/'app/vendor'
def download(url,dest,sha=None):
    dest.parent.mkdir(parents=True,exist_ok=True)
    def digest(p):
        h=hashlib.sha256()
        with p.open('rb') as f:
            for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
        return h.hexdigest()
    if not dest.exists() or (sha and digest(dest)!=sha):
        temp=dest.with_suffix(dest.suffix+'.download')
        with urllib.request.urlopen(url,timeout=240) as response,temp.open('wb') as out:shutil.copyfileobj(response,out,1024*1024)
        if sha and digest(temp)!=sha:raise RuntimeError('Integrity check failed: '+str(dest))
        temp.replace(dest)
    print('Ready',dest.name,flush=True)
    return digest(dest)
if __name__=='__main__':
    lock=json.loads((V/'pyodide/pyodide-lock.json').read_text())
    for name in ['numpy','sympy','mpmath']:
        package=lock['packages'][name]
        download('https://cdn.jsdelivr.net/pyodide/v0.27.7/full/'+package['file_name'],V/'pyodide'/package['file_name'],package['sha256'])
    manifest=json.loads((ROOT/'scripts/power-manifest.json').read_text())
    for name in ['cJSON.h','cJSON.c','LICENSE']:
        download('https://raw.githubusercontent.com/DaveGamble/cJSON/v1.7.18/'+name,V/'cpp/cjson'/name,manifest[name])
    for folder in ['pyodide','cpp','licenses']:
        if (V/folder).exists():shutil.copytree(V/folder,ROOT/'android/app/src/main/assets/vendor'/folder,dirs_exist_ok=True)
