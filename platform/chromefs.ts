const m=(typeof navigator!=='undefined') && navigator.userAgent.match(/Chrome\/(\d+)/);
export const supprtedBrowser=m&&parseInt(m[1])>=86;

export const createBrowserDownload=(filename,buf)=>{
  let file = new Blob([buf], {type: "application/octet-binary"});
  let a = document.createElement("a"), url = URL.createObjectURL(file);
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
}

export async function verifyPermission(fileHandle, readWrite=false) {
    const options = {};
    if (readWrite) {
      options.mode = 'readwrite';
    }
    // Check if permission was already granted. If so, return true.
    if ((await fileHandle.queryPermission(options)) === 'granted') {
      return true;
    }
    // Request permission. If the user grants permission, return true.
    if ((await fileHandle.requestPermission(options)) === 'granted') {
      return true;
    }
    // The user didn't grant permission, so return false.
    return false;
}
export const openSourceOption={
  id:'inputfile',
  startIn:'desktop',
  multiple:true,
  types:[
  {
      description: 'Source Files',
      accept: {
          'text/plain': ['.off','.txt','.tsv','.css','.xml']
      }
  }
  ]
}
export const savePtkOption={
  id:'ptkfile',
  startIn:'desktop',
  types:[
      {
          description: 'Ptk File',
          accept: {
              'application/zip': ['.ptk'],
          }
      }
  ]
}
export const openPtkOption={
  id:'ptkfile',
  startIn:'desktop',
  types:[
      {
          description: 'Ptk File',
          accept: {
              'application/zip': ['.ptk'],
          }
      }
  ]
}
export const openComOption={
  id:'comfile',
  startIn:'desktop',
  types:[
      {
          description: 'Com File',
          accept: {
              'application/zip': ['.com'],
          }
      }
  ]
}
export const saveComOption={
  id:'comfile',
  startIn:'desktop',
  types:[
      {
          description: 'Com File',
          accept: {
              'application/zip': ['.com'],
          }
      }
  ]
}

export const saveSourceOption={
  id:'savesource',
  startIn:'desktop',
  types:[
      {
          description: 'Source Files',
          accept: {
              'text/plain': ['.off','.txt']
          }
      }
  ]
}
