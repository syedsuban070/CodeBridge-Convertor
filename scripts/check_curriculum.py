"""Execute every reference solution against every curriculum input using host compilers.
The browser and Android tests independently exercise the actual bundled runtimes.
"""
import json, subprocess, tempfile, pathlib, sys
courses=json.loads(subprocess.check_output(['node','-e',"process.stdout.write(JSON.stringify(require('./app/learning/courses.js')))"],text=True))
checks=0
with tempfile.TemporaryDirectory() as tmp:
    root=pathlib.Path(tmp)
    for course in courses:
        lang=course['id']
        for lesson in course['lessons']:
            source=root/('main.'+lang);source.write_text(lesson['solution'])
            if lang=='py': command=[sys.executable,str(source)]
            else:
                binary=root/'lesson'
                subprocess.run(['gcc' if lang=='c' else 'g++','-std=c11' if lang=='c' else '-std=c++17',str(source),'-o',str(binary)],check=True,capture_output=True)
                command=[str(binary)]
            for case in lesson['cases']:
                result=subprocess.run(command,input=case['input']+'\n',text=True,capture_output=True,timeout=5,check=True)
                assert result.stdout.split()==case['output'].split(),(lesson['id'],case,result.stdout)
                checks+=1
print(f'PASS {checks} curriculum cases across 33 reference programs')
