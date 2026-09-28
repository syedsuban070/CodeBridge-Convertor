/* Worker-side blocking input. Only the worker waits; the UI stays responsive.
   Header: state (0 waiting, 1 data, 2 EOF), byte length. One line per handshake. */
self.createTerminalInput = function(buffer, initial='', nativeToken=null) {
  const header=buffer?new Int32Array(buffer,0,2):null;
  const shared=buffer?new Uint8Array(buffer,8):null;
  let pending=new TextEncoder().encode(initial), offset=0, ended=false;
  return function(max=4096) {
    if(offset>=pending.length) {
      if(ended||(!header&&!nativeToken))return new Uint8Array(0);
      if(nativeToken){
        postMessage({event:'input-request'});
        const request=new XMLHttpRequest();
        request.open('GET','/__terminal/read?token='+encodeURIComponent(nativeToken),false);
        request.send();
        if(request.status!==200)throw new Error('Android terminal connection failed. Stop and run again.');
        const result=JSON.parse(request.responseText);
        postMessage({event:'input-resumed'});
        if(result.eof){ended=true;return new Uint8Array(0);}
        pending=new TextEncoder().encode(result.text);offset=0;
        const chunk=pending.slice(0,max);offset=chunk.length;return chunk;
      }
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
