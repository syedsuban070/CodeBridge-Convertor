"""Bundle already-built Clang and the matching NDK sysroot; build-host only."""
import argparse, hashlib, json, shutil, subprocess, zipfile
from pathlib import Path
p=argparse.ArgumentParser()
p.add_argument('--ndk',type=Path,required=True)
p.add_argument('--artifacts',type=Path,required=True)
p.add_argument('--app',type=Path,required=True)
a=p.parse_args()
tool=a.ndk/'toolchains/llvm/prebuilt/linux-x86_64'
for abi,triple,arch in [('arm64-v8a','aarch64-linux-android','aarch64'),('x86_64','x86_64-linux-android','x86_64')]:
    src=a.artifacts/('clang8-'+abi)
    libs=a.app/'src/main/jniLibs'/abi
    libs.mkdir(parents=True,exist_ok=True)
    for name,digest in json.loads((src/'SHA256.json').read_text()).items():
        if hashlib.sha256((src/name).read_bytes()).hexdigest()!=digest: raise RuntimeError(name+' checksum mismatch')
        shutil.copy2(src/name,libs/name)
    cpp=a.ndk/'sources/cxx-stl/llvm-libc++/libs'/abi/'libc++_shared.so'
    shutil.copy2(cpp,libs/cpp.name)
    subprocess.run([str(tool/'bin'/f'{triple}26-clang'),'-fPIE','-pie','-O2',str(Path(__file__).with_name('runner.c')),'-ldl','-o',str(libs/'libcb_runner.so')],check=True)
    assets=a.app/'src/main/assets'
    assets.mkdir(parents=True,exist_ok=True)
    with zipfile.ZipFile(assets/f'toolchain-{abi}.zip','w',zipfile.ZIP_DEFLATED) as z:
        def tree(root,prefix):
            for f in root.rglob('*'):
                if f.is_file(): z.write(f,str(Path(prefix)/f.relative_to(root)))
        tree(tool/'sysroot/usr/include','sysroot/usr/include')
        tree(tool/'sysroot/usr/lib'/triple/'26',f'sysroot/usr/lib/{triple}/26')
        tree(a.ndk/'sources/cxx-stl/llvm-libc++/include','include/c++/v1')
        tree(src/'clang-headers','resource/include')
        builtins=list((tool/'lib64/clang').glob(f'*/lib/linux/libclang_rt.builtins-{arch}-android.a'))
        if len(builtins)!=1: raise RuntimeError('Expected one builtins library: '+str(builtins))
        z.write(builtins[0],'builtins.a')
        z.write(src/'LLVM-LICENSE.txt','LLVM-LICENSE.txt')
        for name in ['NOTICE','NOTICE.toolchain']:
            if (a.ndk/name).exists(): z.write(a.ndk/name,name)
