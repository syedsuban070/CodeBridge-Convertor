"""Build-time only. Verify font bytes before embedding them into the APK."""
import hashlib,json,urllib.request
from pathlib import Path
root=Path(__file__).resolve().parents[1]/'flutter_native/assets/fonts'
for name,entry in json.loads((root/'sources.json').read_text()).items():
 path=root/(name+'.ttf')
 if not path.exists():urllib.request.urlretrieve(entry['source'],path)
 if hashlib.sha256(path.read_bytes()).hexdigest()!=entry['sha256']:raise RuntimeError('Font checksum mismatch: '+name)
