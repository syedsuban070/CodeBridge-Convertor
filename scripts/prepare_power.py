"""Pinned, integrity-checked native model and additional offline libraries."""
import pathlib, urllib.request, hashlib, shutil, subprocess, json, os
ROOT=pathlib.Path(__file__).resolve().parents[1]
V=ROOT/'app/vendor'
MODEL_REV='ebb2015119c907b064c512bf053e945850b5875f'
LLAMA_REV='74d4f5b041ad837153b0e90fc864b8290e01d8d5'
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
    if os.environ.get('CODEBRIDGE_SKIP_MODEL')!='1':
        download(f'https://huggingface.co/Qwen/Qwen2.5-Coder-0.5B-Instruct-GGUF/resolve/{MODEL_REV}/qwen2.5-coder-0.5b-instruct-q4_k_m.gguf?download=true',ROOT/'android/app/src/main/assets/models/bit.gguf','1d9614638d18024d0fbb36575a15f1302a3adf044df10345688ec4f6e1c4ff32')
        download(f'https://huggingface.co/Qwen/Qwen2.5-Coder-0.5B-Instruct-GGUF/resolve/{MODEL_REV}/LICENSE',V/'licenses/Qwen-Apache-2.0.txt')
        native=ROOT/'android/app/src/main/cpp/llama'
        if not (native/'include/llama.h').exists():
            subprocess.run(['git','clone','--depth','1','--branch','b5046','https://github.com/ggml-org/llama.cpp.git',str(native)],check=True)
        revision=subprocess.check_output(['git','-C',str(native),'rev-parse','HEAD'],text=True).strip()
        if revision!=LLAMA_REV:raise RuntimeError('Unexpected llama.cpp source revision')
        shutil.copyfile(native/'LICENSE',V/'licenses/llama-MIT.txt')
    for folder in ['pyodide','cpp','licenses']:
        if (V/folder).exists():shutil.copytree(V/folder,ROOT/'android/app/src/main/assets/vendor'/folder,dirs_exist_ok=True)
