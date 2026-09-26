/* A deliberately small offline teaching interpreter. It never executes native binaries. */
(function (root) {
  'use strict';
  const priority = {'||':1,'&&':2,'==':3,'!=':3,'<':4,'>':4,'<=':4,'>=':4,'+':5,'-':5,'*':6,'/':6,'%':6};
  const tokenPattern = /\s+|\/\/[^\n]*|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|(?:\d+\.\d+|\d+)|[A-Za-z_]\w*|(?:\+\+|--|\+=|-=|\*=|\/=|==|!=|<=|>=|&&|\|\||<<|::)|[{}();,=+*\/%!<>-]/y;
  function fail(message, token) { throw new Error(message + ' at line ' + (token ? token.line : '?')); }
  function tokenize(source) {
    source = source.replace(/^\s*#include[^\n]*/gm, m => m.replace(/[^\n]/g, ' '))
      .replace(/^\s*using\s+namespace\s+std\s*;/gm, m => ' '.repeat(m.length));
    const tokens = []; let index = 0, line = 1;
    while (index < source.length) {
      tokenPattern.lastIndex = index;
      const match = tokenPattern.exec(source);
      if (!match) fail('Unsupported character ' + JSON.stringify(source[index]), {line});
      const value = match[0], here = line;
      line += (value.match(/\n/g) || []).length;
      if (!/^\s|^\/\//.test(value) && !value.startsWith('/*')) tokens.push({value, line:here});
      index = tokenPattern.lastIndex;
    }
    tokens.push({value:'<eof>',line});
    return tokens;
  }
  class Parser {
    constructor(source) { this.t = tokenize(source); this.i = 0; }
    peek(v) { return this.t[this.i].value === v; }
    take(v) { if (!this.peek(v)) fail('Expected ' + v + ', found ' + this.t[this.i].value, this.t[this.i]); return this.t[this.i++]; }
    optional(v) { if (this.peek(v)) { this.i++; return true; } return false; }
    identifier() { const tok = this.t[this.i]; if (!/^[A-Za-z_]\w*$/.test(tok.value)) fail('Expected identifier', tok); this.i++; return tok.value; }
    program() {
      if (!(this.peek('int') || this.peek('void'))) fail('Expected main function', this.t[this.i]);
      this.i++; this.take('main'); this.take('('); this.optional('void'); this.take(')');
      const block = this.block(); this.take('<eof>'); return block;
    }
    block() { this.take('{'); const body=[]; while (!this.peek('}')) { if (this.peek('<eof>')) fail('Missing }',this.t[this.i]); body.push(this.statement()); } this.take('}'); return body; }
    statement() {
      const line=this.t[this.i].line;
      if (this.peek('{')) return {kind:'block',body:this.block(),line};
      if (['int','float','double','char'].includes(this.t[this.i].value)) { const node=this.declare(); this.take(';'); return node; }
      if (this.optional('if')) { this.take('('); const cond=this.expr(); this.take(')'); const yes=this.statement(); const no=this.optional('else') ? this.statement() : null; return {kind:'if',cond,yes,no,line}; }
      if (this.optional('while')) { this.take('('); const cond=this.expr(); this.take(')'); return {kind:'while',cond,body:this.statement(),line}; }
      if (this.optional('for')) {
        this.take('(');
        const init=this.peek(';') ? null : (['int','float','double','char'].includes(this.t[this.i].value) ? this.declare() : this.assign()); this.take(';');
        const cond=this.peek(';') ? {kind:'number',value:1} : this.expr(); this.take(';');
        const update=this.peek(')') ? null : this.assign(); this.take(')');
        return {kind:'for',init,cond,update,body:this.statement(),line};
      }
      if (this.optional('return')) { const value=this.peek(';') ? null : this.expr(); this.take(';'); return {kind:'return',value,line}; }
      if (this.peek('printf')) { this.take('printf'); this.take('('); const args=[]; if (!this.peek(')')) { args.push(this.expr()); while (this.optional(',')) args.push(this.expr()); } this.take(')'); this.take(';'); return {kind:'printf',args,line}; }
      if (this.peek('std') || this.peek('cout')) {
        if (this.optional('std')) this.take('::'); this.take('cout'); const args=[];
        do { this.take('<<'); if (this.peek('std') || this.peek('endl')) { if (this.optional('std')) this.take('::'); this.take('endl'); args.push({kind:'endl'}); } else args.push(this.expr()); } while (this.peek('<<'));
        this.take(';'); return {kind:'cout',args,line};
      }
      const node=this.assign(); this.take(';'); return {...node,line};
    }
    declare() { const line=this.t[this.i].line; const type=this.t[this.i++].value, name=this.identifier(); const value=this.optional('=') ? this.expr() : {kind:'number',value:0}; return {kind:'declare',type,name,value,line}; }
    assign() {
      const line=this.t[this.i].line, name=this.identifier();
      if (this.optional('++')) return {kind:'assign',name,op:'+=',value:{kind:'number',value:1},line};
      if (this.optional('--')) return {kind:'assign',name,op:'-=',value:{kind:'number',value:1},line};
      const op=this.t[this.i++].value;
      if (!['=','+=','-=','*=','/='].includes(op)) fail('Unsupported assignment ' + op, this.t[this.i-1]);
      return {kind:'assign',name,op,value:this.expr(),line};
    }
    expr(min=1) {
      let left; const tok=this.t[this.i++], value=tok.value;
      if (value==='(') { left=this.expr(); this.take(')'); }
      else if (['!','-','+'].includes(value)) left={kind:'unary',op:value,right:this.expr(7)};
      else if (/^\d/.test(value)) left={kind:'number',value:Number(value)};
      else if (value[0]==='"' || value[0]==="'") { try { left={kind:'string',value:JSON.parse(value)}; } catch (_) { fail('Invalid string literal',tok); } }
      else if (/^[A-Za-z_]\w*$/.test(value)) left={kind:'var',name:value};
      else fail('Expected expression, found ' + value,tok);
      while (priority[this.t[this.i].value] >= min) { const op=this.t[this.i++].value; left={kind:'binary',op,left,right:this.expr(priority[op]+1)}; }
      return left;
    }
  }
  function run(source) {
    const ast=new Parser(source).program(), vars=Object.create(null), trace=[];
    let output='', steps=0, returned=false;
    function tick(line) {
      if (++steps > 10000) throw new Error('Execution stopped after 10,000 steps (possible infinite loop)');
      trace.push({line,vars:{...vars},output});
      if (output.length > 100000) throw new Error('Output exceeded 100 KB limit');
    }
    function evalExpr(n) {
      if (n.kind==='number' || n.kind==='string') return n.value;
      if (n.kind==='var') { if (!(n.name in vars)) throw new Error('Undeclared variable ' + n.name); return vars[n.name]; }
      if (n.kind==='unary') { const x=evalExpr(n.right); return n.op==='!' ? Number(!x) : n.op==='-' ? -x : +x; }
      if (n.op==='&&') return Number(Boolean(evalExpr(n.left)) && Boolean(evalExpr(n.right)));
      if (n.op==='||') return Number(Boolean(evalExpr(n.left)) || Boolean(evalExpr(n.right)));
      const a=evalExpr(n.left), b=evalExpr(n.right);
      switch(n.op) {
        case '+': return a+b; case '-': return a-b; case '*': return a*b;
        case '/': if (b===0) throw new Error('Division by zero'); return Math.trunc(a/b);
        case '%': if (b===0) throw new Error('Division by zero'); return a%b;
        case '==': return Number(a===b); case '!=': return Number(a!==b);
        case '<': return Number(a<b); case '<=': return Number(a<=b);
        case '>': return Number(a>b); case '>=': return Number(a>=b);
        default: throw new Error('Unsupported expression operator ' + n.op);
      }
    }
    function execute(n) {
      if (returned) return;
      if (n.kind==='block') { n.body.forEach(execute); return; }
      if (n.kind==='declare') { vars[n.name]=evalExpr(n.value); tick(n.line); return; }
      if (n.kind==='assign') {
        if (!(n.name in vars)) throw new Error('Undeclared variable ' + n.name);
        const x=evalExpr(n.value); vars[n.name]=n.op==='=' ? x : n.op=='+=' ? vars[n.name]+x : n.op==='-=' ? vars[n.name]-x : n.op==='*=' ? vars[n.name]*x : Math.trunc(vars[n.name]/x);
        tick(n.line); return;
      }
      if (n.kind==='if') { tick(n.line); if (evalExpr(n.cond)) execute(n.yes); else if (n.no) execute(n.no); return; }
      if (n.kind==='while') { while (!returned) { tick(n.line); if (!evalExpr(n.cond)) break; execute(n.body); } return; }
      if (n.kind==='for') { if (n.init) execute(n.init); while (!returned) { tick(n.line); if (!evalExpr(n.cond)) break; execute(n.body); if (!returned && n.update) execute(n.update); } return; }
      if (n.kind==='return') { if (n.value) evalExpr(n.value); returned=true; tick(n.line); return; }
      if (n.kind==='printf') {
        if (!n.args.length) throw new Error('printf needs a format string');
        const format=evalExpr(n.args[0]); if (typeof format!=='string') throw new Error('printf format must be a string');
        let arg=1; output+=format.replace(/%%|%[disfc]/g, code => {
          if (code==='%%') return '%';
          if (arg>=n.args.length) throw new Error('printf argument missing');
          const val=evalExpr(n.args[arg++]);
          return code==='%f' ? Number(val).toFixed(6) : code==='%c' ? String(val)[0] : String(val);
        });
        if (/%(?![%disfc])/.test(format) || arg!==n.args.length) throw new Error('Unsupported printf format or argument count');
        tick(n.line); return;
      }
      if (n.kind==='cout') { for (const arg of n.args) output+=arg.kind==='endl' ? '\n' : String(evalExpr(arg)); tick(n.line); return; }
      throw new Error('Unsupported statement ' + n.kind);
    }
    ast.forEach(execute);
    return {output,trace};
  }
  root.CodeBridge={run};
  if (typeof module!=='undefined') module.exports=root.CodeBridge;
})(typeof globalThis!=='undefined' ? globalThis : this);
