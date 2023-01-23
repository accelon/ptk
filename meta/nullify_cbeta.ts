//將note 可能包含的 tag 換成等效的null tag,
//以抽出notetext
import {parseXMLAttribute} from '../xml/utils.js'
const escapeQuote=t=>{
    return t.replace(/"/g,'＂');
}
const nullify_note=content=>{
    //夾注    
    content=content.replace(/<note([^>]*?)>([^<]+)<\/note>/g,(m,_attrs,t)=>{
        const {place,type,n,resp}=parseXMLAttribute(_attrs);
        let note='';
        if (place=='inline') note= '〔'+t+'〕';
        else if (place=='foot text' && type=='orig') {
            note='<origfoot n="'+n+'" t="'+escapeQuote(t)+'"/>'
        } else if (type) {
            if (type.startsWith('cf')) {
                note='['+type+'_'+t+']';
            } else {
                note='<'+type+'_note'+
                (n?' n="'+n+'"':'')+
                (resp?' resp="'+resp +'"':'')
                +' t="'+escapeQuote(t)+'"/>'
            }
        }
        return note;
    })
    return content;
}
const nullify_rdg=content=>{
    content=content.replace(/<rdg([^>]*?)>([^<]*?)<\/rdg>/g,(m,_attrs,t)=>{
        const {resp,wit}=parseXMLAttribute(_attrs);
        if (resp=='Taisho' || typeof resp=='undefined') {
             //有時漏了resp，視為 "Taisho", 如 T22n1428_001 : 0575b2901
            return '<t_rdg t="'+t+'" wit="'+wit+'"/>';
        } else {
            return '<_rdg t="'+t+'" resp="'+resp+'" wit="'+wit+'"/>';
        }
        
    });
    return content;
}
const nullify_cbtt=content=>{
    content=content.replace(/<cb:t ([^>]+)>([^<]+)<\/cb:t>/g,(m,_attrs,t)=>{
        const attrs=parseXMLAttribute(_attrs);
        const lang=attrs['xml:lang'];
        if (lang==='zh-Hant') {
            return t;
        } else { //remove all other language
            return '';
        }
    })
    return content;
}
export const nullify_cbeta=content=>{
    content=content.replace(/<g ref="#([\-A-Za-z\d]+)"\/>/g,'[mc_$1]')

    content=content.replace(/<figure><graphic url="([^>]+)"><\/graphic><\/figure>/g,'[fg_$1]')

    content=content.replace(/<space([^>]*?)\/>/g,(m,attrs)=>{
        const {quantity}=parseXMLAttribute(attrs)
        return ' '.repeat(parseInt(quantity))
    })
    content=content.replace(/<unclear><\/unclear>/g,'[??]');

    content=nullify_cbtt(content);

    content=nullify_note(content);
    content=nullify_note(content); //recursive , T14n0443_004.xml 0337016
    content=nullify_rdg(content);
    content=nullify_note(content);

    return content;
}