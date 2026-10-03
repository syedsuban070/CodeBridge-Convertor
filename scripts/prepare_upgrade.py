"""Bundle licensed local UI fonts; network is used on the build machine only."""
import hashlib,json,urllib.request
from pathlib import Path
root=Path(__file__).resolve().parents[1]
fonts=root/'app/upgrade/fonts'
for name,item in json.loads((fonts/'sources.json').read_text()).items():
 p=fonts/(name+'.ttf')
 if not p.exists():p.write_bytes(urllib.request.urlopen(item['source'],timeout=120).read())
 if hashlib.sha256(p.read_bytes()).hexdigest()!=item['sha256']:raise RuntimeError('Font checksum mismatch: '+name)
locales={p.stem:json.loads(p.read_text()) for p in (root/'app/upgrade/i18n').glob('*.json')}
assert all(set(d['strings'])==set(locales['en']['strings']) for d in locales.values())
(root/'app/upgrade/locales.js').write_text('/* Generated from bundled i18n JSON. No runtime downloads. */\nwindow.CBLocales='+json.dumps(locales,ensure_ascii=False)+';\n')
