const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('Desktop',{platform:process.platform,
 openFiles:()=>ipcRenderer.invoke('open-files'),openFolder:()=>ipcRenderer.invoke('open-folder'),
 saveFile:(name,content)=>ipcRenderer.invoke('save-file',{name,content}),
 saveProject:files=>ipcRenderer.invoke('save-project',files),
 debugStart:config=>ipcRenderer.invoke('debug-start',config),
 debugCommand:command=>ipcRenderer.invoke('debug-command',command),
 debugStop:()=>ipcRenderer.invoke('debug-stop'),
 onDebug:callback=>ipcRenderer.on('debug-event',(_,message)=>callback(message))
});
