from pathlib import Path
p=['<Rive version="1" kind="fragment"><Artboard name="Bit" id="0:1" width="320" height="320" defaultStateMachineId="0:100"><Node name="Mentor" id="0:10" x="160" y="172">']
shapes=[(-28,-36,23,8,'9DFF52'),(28,-36,23,8,'9DFF52'),(0,-5,28,5,'7D8797'),(0,-30,105,63,'0B1016'),(0,-30,139,96,'69788C'),(4,-22,144,98,'1B2533'),(0,52,26,8,'9DFF52'),(0,54,84,57,'3B4758'),(-63,49,23,45,'69788C'),(63,49,23,45,'69788C'),(-27,98,34,20,'2A3544'),(27,98,34,20,'2A3544'),(0,-99,13,13,'9DFF52'),(0,-83,5,24,'69788C')]
for i,(x,y,w,h,c) in enumerate(shapes,11):p.append(f'<Shape name="Part {i}" id="0:{i}" x="{x}" y="{y}"><Rectangle width="{w}" height="{h}" cornerRadiusTL="{min(14,h/3)}"/><Fill><SolidColor colorValue="FF{c}"/></Fill></Shape>')
p.append('</Node><StateMachine name="BitMentor" id="0:100">')
for i,t in enumerate(['pythonSyntax','compileFailed','success','memoryWarning','bossPass','bossFail'],110):p.append(f'<StateMachineTrigger name="{t}" id="0:{i}"/>')
p.append('<StateMachineLayer name="Reactions"><AnyState x="0" y="-180">')
for i in range(6):p.append(f'<StateTransition stateToId="0:{201+i}" duration="80"><TransitionTriggerCondition inputId="0:{110+i}"/></StateTransition>')
p.append('</AnyState><ExitState x="900" y="-180"/><EntryState x="-200" y="0"><StateTransition stateToId="0:200"/></EntryState>')
for i in range(7):
 p.append(f'<AnimationState id="0:{200+i}" animationId="0:{300+i}" x="{i*180}" y="{(i%2)*180}" reset="true">')
 if i:p.append('<StateTransition stateToId="0:200" duration="120" enableExitTime="true" exitTimeIsPercetange="true" exitTime="100"/>')
 p.append('</AnimationState>')
p.append('</StateMachineLayer></StateMachine>')
for i,name in enumerate(['IdleOnPath','PythonSyntaxError','CppCompileFailed','Success','MemoryLabWarning','BossPass','BossFailRoast']):
 n=[108,60,66,60,78,90,78][i]
 p.append(f'<LinearAnimation id="0:{300+i}" name="{name}" duration="{n}" fps="60" loopValue="'+('loop' if i==0 else 'oneShot')+'">')
 def track(obj,key,values):
  p.append(f'<KeyedObject objectId="0:{obj}"><KeyedProperty propertyKey="{key}">')
  for f,v in values:p.append(f'<KeyFrameDouble frame="{f}" value="{v}" interpolationType="linear"/>')
  p.append('</KeyedProperty></KeyedObject>')
 track(10,14,[(0,172),(n//3,154 if i==5 else 175),(2*n//3,163 if i==5 else 170),(n,172)])
 track(10,15,[(0,0),(n//3,.07 if i in [1,6] else -.03),(2*n//3,-.07 if i==6 else .03),(n,0)])
 track(10,16,[(0,1),(n//3,1.14 if i==1 else 1.02),(2*n//3,.93 if i==1 else 1),(n,1)])
 track(10,17,[(0,1),(n//3,.86 if i==1 else .98),(2*n//3,1.08 if i==1 else 1),(n,1)])
 track(19,14,[(0,49),(n//3,-32 if i==1 else 40),(2*n//3,-25 if i==1 else 49),(n,49)])
 track(21,14,[(0,98),(n//2,94),(n,98)])
 p.append('</LinearAnimation>')
p.append('</Artboard></Rive>')
Path(__file__).with_name('scene.rml').write_text('\n'.join(p))
