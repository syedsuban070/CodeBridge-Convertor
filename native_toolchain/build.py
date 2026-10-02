"""Cross-build LLVM/Clang/LLD 8.0.1 for Android; never substitutes WASM.

Build inputs are fetched only on the build host. Produced toolchain is intended
for bundling, not first-launch downloading. Android execution tests are separate.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import tarfile
import urllib.request

ROOT = Path(__file__).resolve().parent


def run(args):
    print('+', ' '.join(map(str, args)), flush=True)
    subprocess.run(list(map(str, args)), check=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--ndk', type=Path, required=True)
    parser.add_argument('--work', type=Path, required=True)
    parser.add_argument('--abi', choices=['arm64-v8a', 'x86_64'], required=True)
    parser.add_argument('--jobs', default=2, type=int)
    args = parser.parse_args()
    work = args.work.resolve()
    source = work / 'source'
    work.mkdir(parents=True, exist_ok=True)
    manifest = json.loads((ROOT / 'sources.json').read_text())
    destinations = {'llvm': source, 'cfe': source/'tools/clang', 'lld': source/'tools/lld'}
    for name, entry in manifest.items():
        archive = work / (name + '.tar.xz')
        if not archive.exists():
            urllib.request.urlretrieve(entry['url'], archive)
        if hashlib.sha256(archive.read_bytes()).hexdigest() != entry['sha256']:
            raise RuntimeError('Source checksum mismatch: ' + name)
        dest = destinations[name]
        if not (dest/'CMakeLists.txt').exists():
            dest.mkdir(parents=True, exist_ok=True)
            with tarfile.open(archive) as tar:
                for member in tar.getmembers():
                    parts = Path(member.name).parts[1:]
                    if not parts:
                        continue
                    member.name = str(Path(*parts))
                    tar.extract(member, dest, filter='data')
    # LLVM 8 predates modern GCC's removal of incidental header imports.
    flags = '-include cstdint -include string'
    common = ['-G', 'Ninja', '-DCMAKE_BUILD_TYPE=Release',
              '-DLLVM_INCLUDE_TESTS=OFF', '-DLLVM_INCLUDE_EXAMPLES=OFF',
              '-DLLVM_INCLUDE_BENCHMARKS=OFF', '-DLLVM_ENABLE_TERMINFO=OFF',
              '-DLLVM_ENABLE_ZLIB=OFF', '-DLLVM_ENABLE_LIBEDIT=OFF',
              '-DLLVM_ENABLE_ASSERTIONS=OFF', '-DLLVM_ENABLE_LIBXML2=OFF']
    host = work/'host'
    run(['cmake', '-S', source, '-B', host, *common,
         '-DLLVM_TARGETS_TO_BUILD=X86', '-DCMAKE_CXX_FLAGS='+flags])
    run(['cmake', '--build', host, '--target', 'llvm-tblgen', 'clang-tblgen', '-j', args.jobs])
    native = work/args.abi
    target = 'AArch64' if args.abi=='arm64-v8a' else 'X86'
    triple = 'aarch64-linux-android' if args.abi=='arm64-v8a' else 'x86_64-linux-android'
    run(['cmake', '-S', source, '-B', native, *common,
         '-DCMAKE_TOOLCHAIN_FILE='+str(args.ndk.resolve()/'build/cmake/android.toolchain.cmake'),
         '-DANDROID_ABI='+args.abi, '-DANDROID_PLATFORM=android-26',
         '-DANDROID_STL=c++_static', '-DLLVM_TARGETS_TO_BUILD='+target,
         '-DLLVM_HOST_TRIPLE='+triple, '-DLLVM_DEFAULT_TARGET_TRIPLE='+triple,
         '-DLLVM_TABLEGEN='+str(host/'bin/llvm-tblgen'),
         '-DCLANG_TABLEGEN='+str(host/'bin/clang-tblgen'),
         '-DCMAKE_CXX_FLAGS='+flags,
         '-DLLVM_BUILD_LLVM_DYLIB=OFF', '-DLLVM_LINK_LLVM_DYLIB=OFF'])
    run(['cmake', '--build', native, '--target', 'clang', 'lld', '-j', args.jobs])
    out = work/'output'/args.abi
    out.mkdir(parents=True, exist_ok=True)
    for executable, name in [('clang', 'libclang8.so'), ('lld', 'liblld8.so')]:
        shutil.copy2(native/'bin'/executable, out/name)
    shutil.copytree(source/'tools/clang/lib/Headers', out/'clang-headers', dirs_exist_ok=True)
    shutil.copy2(source/'LICENSE.TXT', out/'LLVM-LICENSE.txt')
    entries = {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in out.glob('*.so')}
    (out/'SHA256.json').write_text(json.dumps(entries, indent=2)+'\n')
    print('Built native toolchain; Android execution remains a required gate.', flush=True)


if __name__=='__main__':
    main()
