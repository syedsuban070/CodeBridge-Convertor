"""Conservative C / C++ subset to Python translator. Unsupported syntax fails closed."""
import argparse
import ast
import re
import sys
from pathlib import Path
from pycparser import c_ast, c_parser, plyparser

class Unsupported(ValueError):
    pass

class Emitter:
    def __init__(self):
        self.lines = []
        self.indent = 0
        self.types = {}
        self.need_division = False
        self.need_modulo = False

    def line(self, value):
        self.lines.append('    ' * self.indent + value)

    def expr(self, node):
        if isinstance(node, c_ast.ID):
            return node.name
        if isinstance(node, c_ast.Constant):
            if node.type not in ('int', 'float', 'double', 'char', 'string'):
                raise Unsupported(f'constant type {node.type} is not supported')
            if node.type == 'char':
                return repr(ast.literal_eval(node.value))
            return node.value
        if isinstance(node, c_ast.BinaryOp):
            op = {'&&': 'and', '||': 'or'}.get(node.op, node.op)
            if op not in ('+', '-', '*', '/', '%', '<', '<=', '>', '>=', '==', '!=', 'and', 'or'):
                raise Unsupported(f'operator {op} is not supported')
            if op == '/':
                self.need_division = True
                return f'c_div({self.expr(node.left)}, {self.expr(node.right)})'
            if op == '%':
                self.need_division = True
                self.need_modulo = True
                return f'c_mod({self.expr(node.left)}, {self.expr(node.right)})'
            return f'({self.expr(node.left)} {op} {self.expr(node.right)})'
        if isinstance(node, c_ast.UnaryOp):
            if node.op == '!':
                return f'int(not {self.expr(node.expr)})'
            if node.op in ('-', '+'):
                return '(' + node.op + self.expr(node.expr) + ')'
            raise Unsupported(f'unary operator {node.op} is not supported here')
        if isinstance(node, c_ast.FuncCall) and isinstance(node.name, c_ast.ID):
            name = node.name.name
            args = node.args.exprs if node.args else []
            if name == 'bridge_out':
                return 'print(' + ', '.join(self.expr(a) for a in args) + ', sep="", end="")'
            if name == 'bridge_endl':
                return 'print()'
            if name == 'printf' and args and isinstance(args[0], c_ast.Constant) and args[0].type == 'string':
                fmt = ast.literal_eval(args[0].value)
                tokens = re.findall(r'%(?:%|[dfsci])', fmt)
                if re.search(r'%(?![%dfsci])', fmt) or len([t for t in tokens if t != '%%']) != len(args) - 1:
                    raise Unsupported('printf format is outside the supported %d/%f/%s/%c/%i subset')
                values = [self.expr(a) for a in args[1:]]
                if not values:
                    return f'print({repr(fmt.replace("%%", "%"))}, end="")'
                # Python's percent formatting closely matches this restricted printf subset.
                return f'print({repr(fmt)} % ({", ".join(values)},), end="")'
            raise Unsupported(f'function call {name} is not supported')
        raise Unsupported(f'expression {type(node).__name__} is not supported')

    def block(self, node):
        items = node.block_items if isinstance(node, c_ast.Compound) else [node]
        if not items:
            self.line('pass')
        for item in items or []:
            self.stmt(item)

    def nested(self, node):
        self.indent += 1
        self.block(node)
        self.indent -= 1

    def stmt(self, node):
        if isinstance(node, c_ast.Decl):
            if not isinstance(node.type, c_ast.TypeDecl) or not isinstance(node.type.type, c_ast.IdentifierType):
                raise Unsupported('pointers, arrays, and complex declarations are not supported')
            kind = ' '.join(node.type.type.names)
            if kind not in ('int', 'float', 'double', 'char', 'bool'):
                raise Unsupported(f'type {kind} is not supported')
            self.types[node.name] = kind
            self.line(f'{node.name} = {self.expr(node.init) if node.init else ("0.0" if kind in ("float", "double") else "0")}')
        elif isinstance(node, c_ast.Assignment):
            if not isinstance(node.lvalue, c_ast.ID) or node.op not in ('=', '+=', '-=', '*=', '/='):
                raise Unsupported('assignment form is not supported')
            name = node.lvalue.name
            value = self.expr(node.rvalue)
            if node.op == '/=':
                self.need_division = True
                self.line(f'{name} = c_div({name}, {value})')
            else:
                self.line(f'{name} {node.op} {value}')
        elif isinstance(node, c_ast.UnaryOp) and node.op in ('p++', 'p--', '++', '--') and isinstance(node.expr, c_ast.ID):
            self.line(f'{node.expr.name} {"+" if "+" in node.op else "-"}= 1')
        elif isinstance(node, c_ast.FuncCall):
            self.line(self.expr(node))
        elif isinstance(node, c_ast.If):
            self.line(f'if {self.expr(node.cond)}:')
            self.nested(node.iftrue)
            if node.iffalse:
                self.line('else:')
                self.nested(node.iffalse)
        elif isinstance(node, c_ast.While):
            self.line(f'while {self.expr(node.cond)}:')
            self.nested(node.stmt)
        elif isinstance(node, c_ast.For):
            if node.init:
                for item in (node.init.decls if isinstance(node.init, c_ast.DeclList) else [node.init]):
                    self.stmt(item)
            self.line(f'while {self.expr(node.cond) if node.cond else "True"}:')
            self.indent += 1
            self.block(node.stmt)
            if node.next:
                self.stmt(node.next)
            self.indent -= 1
        elif isinstance(node, c_ast.Return):
            self.line(f'return {self.expr(node.expr)}' if node.expr else 'return')
        elif isinstance(node, c_ast.Compound):
            self.block(node)
        else:
            raise Unsupported(f'statement {type(node).__name__} is not supported')

    def render(self, tree):
        for item in tree.ext:
            if not isinstance(item, c_ast.FuncDef):
                raise Unsupported('global declarations are not supported')
            params = item.decl.type.args
            if item.decl.name != 'main' or (params and not (len(params.params) == 1 and isinstance(params.params[0], c_ast.Typename) and isinstance(params.params[0].type.type, c_ast.IdentifierType) and params.params[0].type.type.names == ['void'])):
                raise Unsupported('the first release supports only int main() or int main(void)')
            self.line('def main():')
            self.indent = 1
            self.block(item.body)
            self.indent = 0
            self.line('')
            self.line('if __name__ == "__main__":')
            self.indent = 1
            self.line('main()')
            self.indent = 0
        if len(tree.ext) != 1:
            raise Unsupported('exactly one main function is required')
        header = ['# Generated by CodeBridge. Review behavior before relying on the result.']
        if self.need_division:
            header += ['def c_div(a, b):', '    if isinstance(a, int) and isinstance(b, int):', '        q = abs(a) // abs(b)', '        return -q if (a < 0) != (b < 0) else q', '    return a / b', '']
        if self.need_modulo:
            header += ['def c_mod(a, b):', '    return a - c_div(a, b) * b', '']
        return '\n'.join(header + self.lines) + '\n'

def normalize(source):
    source = re.sub(r'"(?:\\.|[^"\\])*"|\'(?:\\.|[^\'\\])*\'|/\*.*?\*/|//[^\n]*',
                    lambda m: '' if m.group().startswith(('/*', '//')) else m.group(),
                    source, flags=re.S)
    includes = re.findall(r'^\s*#include\s*[<"]([^>"]+)[>"]\s*$', source, re.M)
    if any(i not in ('stdio.h', 'iostream') for i in includes):
        raise Unsupported('only stdio.h and iostream headers are supported')
    source = re.sub(r'^\s*#include[^\n]*$', '', source, flags=re.M)
    source = re.sub(r'^\s*using namespace std\s*;', '', source, flags=re.M)
    if 'cin' in source:
        raise Unsupported('C++ input streams are not yet supported')
    def stream(match):
        body = match.group(1)
        pieces, part, quote, escaped = [], '', None, False
        i = 0
        while i < len(body):
            char = body[i]
            if escaped:
                escaped = False
            elif char == '\\' and quote:
                escaped = True
            elif char == quote:
                quote = None
            elif char in ('"', "'") and not quote:
                quote = char
            elif not quote and body[i:i+2] == '<<':
                pieces.append(part.strip())
                part = ''
                i += 2
                continue
            part += char
            i += 1
        pieces.append(part.strip())
        end = pieces and pieces[-1] in ('std::endl', 'endl')
        if end:
            pieces.pop()
        if not pieces or any(not p for p in pieces):
            raise Unsupported('empty C++ output expression')
        return 'bridge_out(' + ', '.join(pieces) + ');' + ('bridge_endl();' if end else '')
    source = re.sub(r'\b(?:std::)?cout\s*<<\s*([^;]+);', stream, source)
    if 'std::' in source or re.search(r'\bcout\b', source):
        raise Unsupported('this C++ construct is not supported')
    if re.search(r'^\s*#', source, re.M):
        raise Unsupported('macros and other preprocessor directives are not supported')
    return source

def convert(source):
    try:
        tree = c_parser.CParser().parse(normalize(source))
        result = Emitter().render(tree)
        ast.parse(result)
        return result
    except plyparser.ParseError as exc:
        raise Unsupported(f'parse error: {exc}') from exc

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('-o', '--output', type=Path)
    args = parser.parse_args()
    target = args.output or args.source.with_suffix('.py')
    try:
        result = convert(args.source.read_text(encoding='utf-8'))
        target.write_text(result, encoding='utf-8')
        print(target)
    except (Unsupported, OSError, SyntaxError) as exc:
        print(f'CodeBridge: {exc}', file=sys.stderr)
        return 1
    return 0

if __name__ == '__main__':
    sys.exit(main())
