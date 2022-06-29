
const m=(typeof navigator!=='undefined') && navigator.userAgent.match(/Chrome\/(\d+)/);
const ready=m&&parseInt(m[1])>=86;

async function verifyPermission(fileHandle, readWrite) {
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
const openFileOption={
  id:'inputfile',
  multiple:true,
  types:[
    {
      description: 'OpenLit Zip Files',
      accept: {
          'text/json': ['.zip','.json']
      }
    } ,
   {
      description: 'Haodoo Files',
      accept: {
          'text/json': ['.updb','.json']
      }
    },

    {
      description: 'Text Files',
      accept: {
          'text/plain': ['.txt'],
          'text/json': ['.json']
      }
  },  

      {
        description: 'Html Files',
        accept: {
            'text/html': ['.html','.htm'],
            'text/json': ['.json']
        }
      }
      ,
      { 
        description: 'XML Files',
        accept: {
            'text/xml': ['.xml'],
            'text/json': ['.json']
        },
        
      },

  ]
}
const openOneZipFileOption={
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
const openPtkFileOption={
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
const saveZipOption={
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
const savePitakaOption={
  id:'ptkfile',
  types:[
      {
          description: 'Pitaka File',
          accept: {
              'application/octet-stream': ['.ptk'],
          }
      }
  ]
}
const saveTxtOption={
  id:'textfile',
  types:[
      {
          description: 'Text File',
          accept: {
              'text/plain': ['.txt','.off'],
          }
      }
  ]
}
export default {ready,verifyPermission,openFileOption,openOneZipFileOption,openPtkFileOption,
  saveZipOption,savePitakaOption,saveTxtOption};
