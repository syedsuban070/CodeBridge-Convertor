/* Worker-side blocking input. Only the worker waits; the UI stays responsive.
   Header: state (0 waiting, 1 data, 2 EOF), byte length. One line per handshake. */
self.createTerminalInput = function(buffer, initial='') {
  const header=buffer?new Int32Array(buffer,0,2):null;
  const shared=buffer?new Uint8Array(buffer,8):null;
  let pending=new TextEncoder().encode(initial), offset=0, ended=false;
  return function(max=4096) {
    if(offset>=pending.length) {
      if(ended||!header)return new Uint8Array(0);
      Atomics.store(header,0,0);
      postMessage({event:'input-request'});
      while(Atomics.load(header,0)===0)Atomics.wait(header,0,0);
      if(Atomics.load(header,0)===2){ended=true;postMessage({event:'input-resumed'});return new Uint8Array(0);}
      pending=shared.slice(0,Atomics.load(header,1));offset=0;
      postMessage({event:'input-resumed'});
    }
    const chunk=pending.slice(offset,offset+max);offset+=chunk.length;return chunk;
  };
};
