"""Host tests for Python I/O adapters; device tests verify actual bundled runtimes."""
import importlib.util, pathlib, unittest
path=pathlib.Path(__file__).resolve().parents[1]/'flutter_native/android/app/src/main/python/runner.py'
spec=importlib.util.spec_from_file_location('codebridge_runner',path)
runner=importlib.util.module_from_spec(spec);spec.loader.exec_module(runner)
class OutputTests(unittest.TestCase):
 def test_output_keeps_kind_and_character_count(self):
  events=[];sink=runner.Sink(lambda text,kind:events.append((text,kind)),'stderr')
  self.assertEqual(sink.write('غلطی\n'),5)
  self.assertEqual(events,[('غلطی\n','stderr')])
 def test_empty_write_is_not_an_event(self):
  events=[];sink=runner.Sink(lambda *args:events.append(args),'stdout')
  self.assertEqual(sink.write(''),0);self.assertFalse(events)
if __name__=='__main__':unittest.main()
