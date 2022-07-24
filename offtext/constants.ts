export const ALWAYS_EMPTY = {br:true,r:true};
export const AUTO_TILL_END={e:true}

export const OFFTAG_REGEX_G=/\^(\:?[a-z_]+[#@\/\.\:a-z_\-\d~]*)(<(?:\\.|.)*?>)?/g 
export const OFFTAG_REGEX=/\^(\:?[a-z_]+[#@\/\.\:a-z_\-\d~]*)(<(?:\\.|.)*?>)?/ 
export const OFFTAG_REGEX_SPLIT=/(\^\:?[a-z_]+[#@\/\.\:a-z_\-\d~]*)(<(?:\\.|.)*?>)?/ 

export const HTMLTAG_REGEX_G=/(<(?:\\.|.)*?>)/g 

//export const OFFTAG_REGEX_G=/\^([a-z_]+[#@\/\.\:~a-z_\-\d]*)(\[(?:\\.|.)*?\])?/g //標記樣式
//export const OFFTAG_REGEX=/\^([a-z_]+[#@\/\.\:~a-z_\-\d]*)(\[(?:\\.|.)*?\])?/ //標記樣式
///export const NAMED_OFFTAG="([#@\\/\\.\\:~a-z_\\-\\d]*)(\\[(?:\\\\.|.)*?\\])?" //已知名稱的標記
//export const OFFTAG_REGEX_SPLIT=/(\^[a-z_]+[#@\/\.\:~a-z_\-\d]*)(\[(?:\\.|.)*?\])?/ //標記樣式

export const QUOTEPREFIX='\u001a', QUOTEPAT=/\u001a(\d+)/g ;                // 抽取字串的前綴，之後是序號
export const OFFTAG_COMPACT_ATTR=/^([\da-z_:\-\.~]*)$/;   //可以不包夾在 [] 的 id/link ，數字開頭，小寫及-.
export const OFFTAG_NAME_ATTR=/([a-z_\:]+)(.*)/  //名稱可以含az_: ，但不可為數字
export const OFFTAG_ATTRS="(\\[(?:\\\\.|.)*?\\])?"
export const OFFTAG_COMPACT_ID=/^([a-z\d]+[_a-z\d\-~\.]*)/;  //縮式 id
export const QSTRING_REGEX_G= /"((?:\\.|.)*?)"/g                                  //字串標式
export const OFFTAG_LEADBYTE='^';

export const AT_HOST_BOUND = /^([a-z\.\d\-_]+\:)?(<\d+)?(>\d+)?$/;
export const AT_HOST_ELE_ID_BOUND = /^([a-z\.\d\-_]+\:)?([a-z]+)#?([a-z\d_-]+)(<\d+)?(>\d+)?$/;

