const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const engine=require('../app/src/main/assets/engine.js');
for(const [source, expected] of [
 ['examples/hello.c','Total: 10\n'],
 ['examples/division.cpp','Result: 3\n']
]) {
 const input=fs.readFileSync(path.join(__dirname,'../..',source),'utf8');
 assert.equal(engine.run(input).output,expected);
}
assert.equal(engine.run('int main() { int i=0; while(i<3) { i++; } printf("%d", i); return 0; }').output,'3');
assert.throws(()=>engine.run('int main() { int *p; return 0; }'),/Expected identifier|Unsupported/);
assert.throws(()=>engine.run('int main() { while(1) { } }'),/10,000 steps/);
assert.ok(engine.run('int main(){ int x=2; x++; return x; }').trace.length>=3);
console.log('Mobile engine tests passed');
