"""Prepare pinned, hash-verified offline assets. No downloads occur in the installed app."""
import concurrent.futures, hashlib, json, pathlib, shutil, subprocess, sys, urllib.request
ROOT = pathlib.Path(__file__).resolve().parents[1]
VENDOR = ROOT / 'app/vendor'
VENDOR.mkdir(parents=True, exist_ok=True)
commit = '648c4a89997a351eef75cdaec3ef5b89d4937dec'
manifest = json.loads((ROOT / 'scripts/clang-manifest.json').read_text())
def download(item):
    name, expected = item
    dest = VENDOR / 'clang' / name
    dest.parent.mkdir(parents=True, exist_ok=True)
    if not dest.exists() or hashlib.sha256(dest.read_bytes()).hexdigest() != expected['sha256']:
        data = urllib.request.urlopen(f'https://raw.githubusercontent.com/binji/wasm-clang/{commit}/{name}', timeout=180).read()
        if len(data) != expected['bytes'] or hashlib.sha256(data).hexdigest() != expected['sha256']:
            raise RuntimeError('Integrity check failed: ' + name)
        dest.write_bytes(data)
    return name
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    for name in pool.map(download, manifest.items()): print('Verified', name)
# Adapt the upstream API to avoid injecting an extra newline into user output.
shared = (VENDOR / 'clang/shared.js').read_text()
shared = shared.replace("    this.hostWrite('\\n');\n    if (this.showTiming)", "    if (this.showTiming)")
(VENDOR / 'clang/shared-adapted.js').write_text(shared)
for package in ('codemirror', 'pyodide'):
    source = ROOT / 'node_modules' / package
    if not source.exists(): raise RuntimeError('Run npm ci before prepare:assets')
    target = VENDOR / package
    shutil.copytree(source, target, dirs_exist_ok=True, ignore=shutil.ignore_patterns('node_modules', 'test', 'tests', 'doc', 'demo', 'src', '*.map'))
# Pure-Python parser wheel; installs into Pyodide's virtual filesystem without pip/network.
wheel_dir = VENDOR / 'python'
wheel_dir.mkdir(exist_ok=True)
if not (wheel_dir / 'pycparser-2.22-py3-none-any.whl').exists():
    subprocess.run([sys.executable, '-m', 'pip', 'download', '--no-deps', '--only-binary=:all:', 'pycparser==2.22', '-d', str(wheel_dir)], check=True)
shutil.copyfile(ROOT / 'converter/transpile.py', wheel_dir / 'transpile.py')
# The generated assets are shared by the desktop and Android shells.
android_assets = ROOT / 'android/app/src/main/assets'
if android_assets.exists(): shutil.rmtree(android_assets)
shutil.copytree(ROOT / 'app', android_assets)
print('Offline assets prepared for desktop and Android')
