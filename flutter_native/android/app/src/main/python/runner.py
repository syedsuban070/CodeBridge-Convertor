"""Offline runtime. Native user executables run in child processes, never the UI."""
import ctypes, io, json, os, pathlib, signal, subprocess, sys, threading, time, traceback, zipfile
_active = None
_cancel = threading.Event()

def stop():
    _cancel.set()
    if _active is not None:
        try: os.killpg(_active.pid, signal.SIGKILL)
        except ProcessLookupError: pass

class Sink(io.TextIOBase):
    def __init__(self, emit, kind): self.emit, self.kind = emit, kind
    def writable(self): return True
    def write(self, value):
        if value: self.emit(value, self.kind)
        return len(value)
    def flush(self): pass


def execute(source, language, stdin, native_dir, work_dir, abi, mode, callback):
    global _active
    _cancel.clear()
    count = 0
    def emit(value, kind):
        nonlocal count
        # Bound Binder/UI output even for runaway programs.
        value = str(value)
        left=max(0,100000-count)
        if left:
            chunk=value[:left]; count+=len(chunk)
            for i in range(0,len(chunk),4096): callback.output(chunk[i:i+4096],kind)
    start=time.monotonic()
    try:
        if language=='python':
            if sys.version_info[:2] != (3,12): raise RuntimeError('Bundled Python is not 3.12')
            if mode=='build': compile(source,'main.py','exec'); return 0
            old=(sys.stdin,sys.stdout,sys.stderr,sys.gettrace())
            def trace(frame,event,arg):
                if _cancel.is_set(): raise KeyboardInterrupt('Execution stopped')
                if time.monotonic()-start>15: raise TimeoutError('15 second execution limit')
                return trace
            try:
                sys.stdin=io.StringIO(stdin)
                sys.stdout=Sink(emit,'stdout');sys.stderr=Sink(emit,'stderr');sys.settrace(trace)
                exec(compile(source,'main.py','exec'),{'__name__':'__main__','__file__':'main.py'})
                return 0
            except SystemExit as e:
                if e.code is None:return 0
                if isinstance(e.code,int):return e.code
                emit(str(e.code)+'\n','stderr');return 1
            except BaseException:
                emit(traceback.format_exc(),'stderr');return 1
            finally:
                sys.stdin,sys.stdout,sys.stderr=old[:3];sys.settrace(old[3])
        root=pathlib.Path(work_dir)/('toolchain-'+abi)
        run=pathlib.Path(work_dir)/'run';run.mkdir(exist_ok=True)
        triple='aarch64-linux-android' if abi=='arm64-v8a' else 'x86_64-linux-android'
        ext='cpp' if language=='cpp' else 'c'
        src=run/('main.'+ext);src.write_text(source)
        obj=run/'main.o';program=run/'program.so'
        native=pathlib.Path(native_dir)
        def process(args, input_text=''):
            global _active
            _active=subprocess.Popen(list(map(str,args)),stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,start_new_session=True,env={**os.environ,"LD_LIBRARY_PATH":str(native)})
            callback.child(_active.pid)
            def reader(pipe,kind):
                import codecs
                decoder=codecs.getincrementaldecoder('utf-8')('replace')
                while True:
                    data=os.read(pipe.fileno(),4096)
                    if not data:break
                    emit(decoder.decode(data),kind)
                emit(decoder.decode(b'',final=True),kind)
            threads=[threading.Thread(target=reader,args=(pipe,kind)) for pipe,kind in [(_active.stdout,'stdout'),(_active.stderr,'stderr')]]
            for t in threads:t.start()
            try:
                try:_active.stdin.write(input_text.encode());_active.stdin.close()
                except BrokenPipeError:pass
                rc=_active.wait(timeout=20)
            except subprocess.TimeoutExpired:
                stop();_active.wait();emit('Execution timed out.\n','stderr');rc=124
            finally:
                for t in threads:t.join(timeout=2)
                _active=None
                callback.child(0)
            return rc
        command=[native/'libclang8.so','-target',triple+'26','--sysroot='+str(root/'sysroot'),'-resource-dir',root/'resource','-fPIC','-fno-color-diagnostics','-Wall','-Wextra','-std=c++17' if ext=='cpp' else '-std=c17']
        if ext=='cpp':command+=['-nostdinc++','-isystem',root/'include/c++/v1']
        if mode=='debug':command+=['-g','-O0','-fno-omit-frame-pointer']
        command+=['-c',src,'-o',obj]
        rc=process(command)
        if rc:return rc
        lib=root/'sysroot/usr/lib'/triple/'26'
        command=[native/'liblld8.so','-flavor','gnu','-shared','--no-undefined','-o',program,lib/'crtbegin_so.o',obj,'-L'+str(lib)]
        if ext=='cpp':command+=[native/'libc++_shared.so']
        command+=['-L'+str(root),'--exclude-libs=libgcc.a,libgcc_real.a','--start-group',root/'builtins.a',root/'libgcc.a','-lc','-lm','-ldl','--end-group',lib/'crtend_so.o']
        rc=process(command)
        if rc or mode=='build':return rc
        program.chmod(0o400)
        rc=process([native/'libcb_runner.so',program],stdin)
        program.chmod(0o600)
        return rc
    except BaseException:
        emit(traceback.format_exc(),'stderr');return 1
