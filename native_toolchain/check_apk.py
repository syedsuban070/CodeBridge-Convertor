import hashlib,json,subprocess,sys,zipfile
from pathlib import Path
p=Path(sys.argv[1])
with zipfile.ZipFile(p) as z:
 names=z.namelist()
 for abi in ['arm64-v8a','x86_64']:
  for lib in ['libclang8.so','liblld8.so','libcb_runner.so','libpython3.12.so']:
   assert f'lib/{abi}/{lib}' in names,(abi,lib)
  assert f'assets/toolchain-{abi}.zip' in names
 for asset in ['animations/bit.riv','fonts/NotoNastaliqUrdu.ttf','fonts/NotoSansSC.ttf','i18n/en.json','i18n/ur.json','i18n/zh-Hans.json']:
  assert 'assets/flutter_assets/assets/'+asset in names,asset
 # Binary Android manifest string-pool still contains permission name as ASCII or UTF-16.
 manifest=z.read('AndroidManifest.xml')
 for permission in ['android.permission.INTERNET','android.permission.ACCESS_NETWORK_STATE']:
  assert permission.encode() not in manifest and permission.encode('utf-16le') not in manifest,permission
print(json.dumps({'file':p.name,'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bundledArtifacts':'present','internetPermission':False,'deviceExecution':'NOT VERIFIED'},indent=2))
