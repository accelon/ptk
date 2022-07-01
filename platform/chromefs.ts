const m=(typeof navigator!=='undefined') && navigator.userAgent.match(/Chrome\/(\d+)/);
export const supprtedBrowser=m&&parseInt(m[1])>=86;

export async function verifyPermission(fileHandle, readWrite) {
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
          'text/plain': ['.off']
      }
  }
  ]
}
export const openOneZipFileOption={
  id:'zipinputfile',
  types:[
      {
          description: 'zip Files',
          accept: {
              'application/zip': ['.zip'],
          }
      }
  ]
}
export const openPtkFileOption={
  id:'ptkinputfile',
  multiple:true,
  types:[
      {
          description: 'Ptk Files',
          accept: {
              'application/zip': ['.zip'],
          }
      }
  ]
}
export const saveZipOption={
  id:'zipfile',
  multiple:true,
  types:[
      {
          description: 'Zip File',
          accept: {
              'application/zip': ['.zip'],
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
              'text/plain': ['.off'],
          }
      }
  ]
}