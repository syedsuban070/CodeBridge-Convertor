"""Generate original vector animation atlases and PCM effects; bundle licensed font."""
from pathlib import Path
import math,wave,struct,urllib.request,hashlib,shutil
ROOT=Path(__file__).resolve().parents[1];out=ROOT/'app/game/assets';out.mkdir(parents=True,exist_ok=True)
for skin,color,shade in [('bit-lime','#b9ff66','#6aab38'),('bit-ice','#9deaff','#3989ae'),('bit-sunset','#ffbd8b','#ce657d')]:
 frames=[]
 for direction in range(4):
  for state,count in [('idle',6),('thinking',8),('celebrate',10)]:
   for f in range(count):
    i=len(frames);x=(i%12)*96;y=(i//12)*96
    phase=f/count*math.tau;bob=math.sin(phase)*(2 if state=='idle' else 4 if state=='thinking' else 8)
    angle=math.sin(phase)*(3 if state=='idle' else 8);side=direction in (2,3);dx=-7 if direction==2 else 7 if direction==3 else 0
    eyes='' if direction==1 else f'<rect x="{25+dx}" y="34" width="46" height="24" rx="10" fill="#10131c"/><path d="M{34+dx} 43v{2 if f==2 and state=="idle" else 6}m{18 if not side else 10} -{2 if f==2 and state=="idle" else 6}v{2 if f==2 and state=="idle" else 6}" stroke="{color}" stroke-width="5" stroke-linecap="round"/>'
    if state=='celebrate' and direction!=1:eyes=f'<rect x="{25+dx}" y="34" width="46" height="24" rx="10" fill="#10131c"/><path d="M{31+dx} 46q5-9 10 0m8 0q5-9 10 0" stroke="{color}" stroke-width="3" fill="none"/>'
    frames.append(f'<g transform="translate({x},{y})"><ellipse cx="48" cy="84" rx="24" ry="4" fill="#000" opacity=".2"/><g transform="translate(0,{bob}) rotate({angle},48,48)"><path d="M48 24V14" stroke="{color}" stroke-width="3"/><circle cx="48" cy="12" r="4" fill="{color}"/><rect x="24" y="68" width="17" height="10" rx="4" fill="{shade}"/><rect x="55" y="68" width="17" height="10" rx="4" fill="{shade}"/><rect x="14" y="24" width="68" height="48" rx="20" fill="{shade}"/><path d="M34 24h28q20 0 20 20v13H14V44q0-20 20-20" fill="{color}"/>{eyes}</g></g>')
 (out/(skin+'.svg')).write_text('<svg xmlns="http://www.w3.org/2000/svg" width="1152" height="768" viewBox="0 0 1152 768">'+''.join(frames)+'</svg>')
for name,notes,duration in [('syntax-error',[330,220],.14),('build-success',[660,880],.23),('coins-claimed',[880,1100,1320],.30)]:
 with wave.open(str(out/(name+'.wav')),'wb') as w:
  w.setparams((1,2,22050,0,'NONE','not compressed'));samples=[]
  for i in range(int(22050*duration)):
   t=i/22050;part=min(len(notes)-1,int(t/duration*len(notes)));local=t%(duration/len(notes));env=min(1,local/.006)*max(0,1-local/(duration/len(notes)))**2
   samples.append(struct.pack('<h',int(32767*.18*env*math.sin(math.tau*notes[part]*t))))
  w.writeframes(b''.join(samples))
font=out/'JetBrainsMono-Regular.woff2'
if not font.exists():font.write_bytes(urllib.request.urlopen('https://raw.githubusercontent.com/JetBrains/JetBrainsMono/v2.304/fonts/webfonts/JetBrainsMono-Regular.woff2',timeout=60).read())
license=out/'JetBrainsMono-OFL.txt'
if not license.exists():license.write_bytes(urllib.request.urlopen('https://raw.githubusercontent.com/JetBrains/JetBrainsMono/v2.304/OFL.txt',timeout=60).read())
manifest=out/'font.sha256'
if manifest.exists():
 if manifest.read_text().strip()!=hashlib.sha256(font.read_bytes()).hexdigest():raise RuntimeError('Font integrity mismatch')
else:manifest.write_text(hashlib.sha256(font.read_bytes()).hexdigest()+'\n')
print('Prepared 3 original 96-frame atlases, 3 PCM cues and JetBrains Mono')
