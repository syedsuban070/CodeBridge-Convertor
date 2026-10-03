import json,subprocess
from pathlib import Path
root=Path(__file__).resolve().parents[1]
courses=json.loads(subprocess.check_output(['node','-e',"console.log(JSON.stringify(require('./app/learning/courses.js')))"],cwd=root))
for course in courses:
 if course['id']=='py':continue
 lessons=[];original=course['lessons']
 for i,lesson in enumerate(original):
  lessons.append(lesson)
  if i+1==len(original) or original[i+1]['stage']!=lesson['stage']:
   stage=len([x for x in lessons if x.get('kind')=='memory_boss'])+1
   lessons.append({'id':f"{course['id']}-memory-{stage}",'kind':'memory_boss','title':'Memory Lab '+str(stage),'stage':lesson['stage'],'xp':200,'explanation':'Bit: Every allocation needs an exit plan. Use cb_alloc(n), cb_set(handle,index,value), cb_get(handle,index), cb_free(handle). Fill n slots with 1..n and return their sum. Release the allocation before returning. Checks cover this arena API only; arbitrary malloc/new and raw-pointer accesses are outside this grader.','task':'Fill, sum, release. Pass every case with no arena errors.','question':'Ready for the final checked-arena challenge?','options':['Enter Memory Lab'],'answer':0,'cases':[{'input':str(n)+'\n','output':str(n*(n+1)//2)} for n in [1,3,8,16]],'starter':'int solve(int n) {\n    cb_handle h = cb_alloc(n);\n    int sum = 0;\n    for (int i = 0; i < n; ++i) {\n        cb_set(h, i, i + 1);\n        sum += cb_get(h, i);\n    }\n    // Release the allocation before returning.\n    return sum;\n}\n'})
 course['lessons']=lessons
(root/'flutter_native/assets/data/courses.json').write_text(json.dumps(courses,ensure_ascii=False,indent=2))
