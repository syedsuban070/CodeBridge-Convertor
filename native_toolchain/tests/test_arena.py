import pathlib,subprocess,tempfile,unittest
ROOT=pathlib.Path(__file__).resolve().parents[2]
HEADER=(ROOT/'flutter_native/assets/data/memory_harness.h').read_text()
ENTRY=(ROOT/'flutter_native/assets/data/memory_entry.c').read_text()
class ArenaTests(unittest.TestCase):
 def check(self,source,expected):
  with tempfile.TemporaryDirectory() as d:
   p=pathlib.Path(d);(p/'test.c').write_text(HEADER+'\n'+source+'\n'+ENTRY)
   subprocess.run(['cc','-std=c17',str(p/'test.c'),'-o',str(p/'test')],check=True,capture_output=True)
   r=subprocess.run([str(p/'test')],input='3\n',text=True,capture_output=True,timeout=2)
   self.assertEqual(r.returncode,expected,r.stderr)
 def test_clean(self):self.check('int solve(int n){cb_handle h=cb_alloc(n);cb_set(h,0,42);int x=cb_get(h,0);cb_free(h);return x;}',0)
 def test_leak(self):self.check('int solve(int n){cb_alloc(n);return 42;}',86)
 def test_invalid_access(self):self.check('int solve(int n){cb_handle h=cb_alloc(n);cb_set(h,n,42);cb_free(h);return 42;}',86)
 def test_use_after_release(self):self.check('int solve(int n){cb_handle h=cb_alloc(n);cb_free(h);return cb_get(h,0);}',86)
 def test_double_release(self):self.check('int solve(int n){cb_handle h=cb_alloc(n);cb_free(h);cb_free(h);return 42;}',86)
 def test_stale_handle(self):self.check('int solve(int n){cb_handle h=cb_alloc(n);cb_free(h);cb_handle other=cb_alloc(n);int x=cb_get(h,0);cb_free(other);return x;}',86)
if __name__=='__main__':unittest.main()
