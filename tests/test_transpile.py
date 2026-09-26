import importlib.util
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('transpile', ROOT / 'converter' / 'transpile.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class ConversionTests(unittest.TestCase):
    def test_examples_match_compiled_programs(self):
        for source in [ROOT / 'examples' / 'hello.c', ROOT / 'examples' / 'division.cpp']:
            with self.subTest(source=source.name), tempfile.TemporaryDirectory() as folder:
                binary = Path(folder) / 'program'
                pyfile = Path(folder) / 'program.py'
                compiler = 'gcc' if source.suffix == '.c' else 'g++'
                subprocess.run([compiler, str(source), '-o', str(binary)], check=True)
                pyfile.write_text(module.convert(source.read_text()))
                native = subprocess.check_output([str(binary)], text=True)
                translated = subprocess.check_output([sys.executable, str(pyfile)], text=True)
                self.assertEqual(native, translated)

    def test_unsupported_construct_has_no_partial_output(self):
        source = 'int main() { int *p; return 0; }'
        with self.assertRaises(module.Unsupported):
            module.convert(source)

    def test_integer_division_truncates_toward_zero(self):
        with tempfile.TemporaryDirectory() as folder:
            output = Path(folder) / 'division.py'
            output.write_text(module.convert('int main() { printf("%d\\n", -7 / 2); return 0; }'))
            self.assertEqual(subprocess.check_output([sys.executable, str(output)], text=True), '-3\n')

    def test_modulo_and_large_integer_avoid_float_rounding(self):
        with tempfile.TemporaryDirectory() as folder:
            source = Path(folder) / 'arithmetic.c'
            source.write_text('#include <stdio.h>\nint main() { printf("%d %d\\n", -7 % 2, 2147483647 / 3); return 0; }')
            binary = Path(folder) / 'native'
            translated = Path(folder) / 'translated.py'
            subprocess.run(['gcc', str(source), '-o', str(binary)], check=True)
            translated.write_text(module.convert(source.read_text()))
            self.assertEqual(subprocess.check_output([str(binary)]),
                             subprocess.check_output([sys.executable, str(translated)]))

    def test_comment_markers_and_shift_in_output_string(self):
        source = '#include <iostream>\nint main() { std::cout << "http://x << y" << std::endl; return 0; }'
        with tempfile.TemporaryDirectory() as folder:
            translated = Path(folder) / 'translated.py'
            translated.write_text(module.convert(source))
            self.assertEqual(subprocess.check_output([sys.executable, str(translated)], text=True),
                             'http://x << y\n')

if __name__ == '__main__':
    unittest.main()
