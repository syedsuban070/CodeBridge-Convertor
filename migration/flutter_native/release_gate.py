"""Fail closed until a native Flutter release is backed by real artifacts.

This is a packaging preflight, not proof of runtime correctness. Device tests
must independently pass before publication. No downloads or builds are started.
"""
import argparse
import hashlib
import json
from pathlib import Path


def check(root, manifest):
    errors = []
    if manifest.get('ui') != 'flutter':
        errors.append('Flutter application is not verified')
    for key, version in [('clang', '8.'), ('python', '3.12.')]:
        runtime = manifest.get('runtimes', {}).get(key, {})
        if not str(runtime.get('version', '')).startswith(version):
            errors.append(key + ': required version not verified')
        entries = runtime.get('artifacts', [])
        if not entries:
            errors.append(key + ': no bundled native artifacts')
        for entry in entries:
            asset = (root / entry['path']).resolve()
            if not asset.is_relative_to(root.resolve()) or not asset.is_file():
                errors.append(key + ': artifact missing or outside bundle')
                continue
            data = asset.read_bytes()
            if not data.startswith(b'\x7fELF'):
                errors.append(key + ': artifact is not native ELF')
            if hashlib.sha256(data).hexdigest() != entry.get('sha256'):
                errors.append(key + ': hash mismatch')
    for kind in ('rive', 'lottie', 'fonts', 'localization'):
        paths = manifest.get('assets', {}).get(kind, [])
        if not paths:
            errors.append(kind + ': bundled assets not verified')
        for name in paths:
            asset = (root / name).resolve()
            if not asset.is_relative_to(root.resolve()) or not asset.is_file():
                errors.append(kind + ': asset missing or outside bundle')
    return errors


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--root', type=Path, default=Path(__file__).parent)
    parser.add_argument('--manifest', type=Path, default=Path(__file__).with_name('native-status.json'))
    args = parser.parse_args()
    failures = check(args.root, json.loads(args.manifest.read_text()))
    print('\n'.join('BLOCKED: ' + item for item in failures) or 'Packaging preflight passed; device execution tests still required.')
    raise SystemExit(bool(failures))
