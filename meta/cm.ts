import {addTemplate} from '../compiler/template.ts'
import { alphabetically,unique,fromObj } from '../utils/sortedarray.ts'
import {bsearchNumber} from '../utils/bsearch.ts'
/*
  病 Disease
  證: Sick = 病位Location + 病因Cause
  候: Sign = 病層Level    + 病機Mechanism (ck)
             norm通稱, chinese中醫名, western 西醫, combo 組合 
  症：Ill  =  病象 symtoms, 舌 tounge , 脈 pulse (three manifestation)

  方:formula = 藥清單 ingredients + 出處 origin , 別稱 alias

https://www.ijopmed.org/cm-wm-terms.html
https://www.sohu.com/a/288411596_100020962
*/
export const tounge=[
    { prefix:'l',caption:"⚓",factors:["尖,邊","中","根"]}, //location
    { prefix:'b',caption:"🔅",factors:["淡","暗,黯"]},  //brightness*/
    { prefix:'c',caption:"🌈",factors:["白","黃","紅,赤","紫,絳","青","黑,灰"]}, //color
    { prefix:'t',caption:"🍞",factors:["薄,少","厚,胖,嫩"]},//thickness
    { prefix:'o',caption:"🐆",factors:["紋,裂","斑,痕,印","刺","瘀"]},
    { prefix:'p',caption:"☘️",factors:["清,無","垢","膩,黏","剝,光"]}, //pattern
    { prefix:'h',caption:"🤑",factors:["乾,燥,糙,焦,少津,無津", "潤,滑,多津,有津,涎"]} // humidity
]

export const pulse=[
    {prefix:'l',caption:"⚓",factors:["寸","關","尺"]}, //location
    {prefix:'t',caption:"👶",factors:["細"]},//thickness
    {prefix:'g',caption:"💪",factors:["軟","弱,微,無力","洪,有力,大","實,堅","虛"]},//strength
    {prefix:'q',caption:"🐢",factors:["急,疾,促","數,頻","緩","遲"]}, //frequency
    {prefix:'p',caption:"🐘",factors:["浮","沉,伏","按"]}, //pressure
    {prefix:'s',caption:"🎿",factors:["滑","澀,澁"]},//smoothness
    {prefix:'w',caption:"🌊",factors:["弦","緊","結,結代","濡"]},//waveform
]

export const symtom=[
    {prefix:'a',caption:'🧍',factors:["肩","頸,項","癢","麻"]},
    {prefix:'b',caption:'🧑',factors:["頭痛","頭暈","頭重","頭脹"]},
    {prefix:'c',caption:'😐',factors:["白","黃"],include:"面,臉"},
    {prefix:'d',caption:'🦵',factors:["冷","抽搐","顫,抖"],inluce:"手,足,肢"},
    {prefix:'g',caption:'🤰',factors:["腹痛,腹疼","腹脹","胸悶"]},
    {prefix:'h',caption:'🐪',factors:["腰酸,腰痠","腰痛","背痛"]},
    {prefix:'e',caption:'❄️',factors:["寒,畏寒,惡寒","惡風"]},
    {prefix:'f',caption:'♨️',factors:["發熱,壯熱","少熱","寒熱"]},
    {prefix:'i',caption:'💦',factors:["自汗","盜汗","無汗"]},
    {prefix:'j',caption:'👀',factors:["畏光,羞明","腫","赤,紅","淚","不清,糊"] , include:"眼,目,視" },
    {prefix:'k',caption:'👂',factors:["耳鳴","聾"]  },
    {prefix:'l',caption:'👃',factors:["鼻塞","喘,哮","涕","鼻血,衂"]},
    {prefix:'m',caption:'👄',factors:["渴,乾","嘔,呃","口臭","口淡","口苦","咳血"]  },
    {prefix:'n',caption:'💬',factors:["咳嗽","痰","咽痛","譫,語"]  },
    {prefix:'o',caption:'🦷',factors:["齦,牙宣","牙痛","蛀"]  },
    {prefix:'p',caption:'💔',factors:["悸,痵,怔,忡","絞痛"]},
    {prefix:'q',caption:'😞',factors:["煩,躁,亢","怒,狂","鬰,不樂","疲,倦,怠,懶,惰"]},
    {prefix:'r',caption:'🛌',factors:["失眠,不寐","易醒,淺眠","多夢"]},
    {prefix:'s',caption:'💩',factors:["便秘,秘結,便結","便溏,溏,拉稀","便血,下血","肛","痔"]},
    {prefix:'t',caption:'🚽',factors:["不通,不利","濁","清長","多尿,頻數","失禁,夜尿","血尿,尿血"]},
]
const expandFactor=arr=>{
    for (let i=0;i<arr.length;i++) {
        if (~arr[i].indexOf(',')) {
            arr[i]=arr[i].split(',')
        }
    }
}
const splitFactors=(allFactors)=>{
    for (let i=0;i<allFactors.length;i++){
        expandFactor(allFactors[i].factors);
        if (typeof allFactors[i].include=='string') {
            allFactors[i].include=allFactors[i].include.split(',')
        }
    }
}
splitFactors(tounge);
splitFactors(pulse);
splitFactors(symtom);
export const SickFactors={  tounge, pulse, symtom }

export const SickCauses={ //病因
    l01:"風寒",l02:"風熱",l03:"風燥",l04:"虛風",l05:"陰寒",
    l06:"寒熱",l07:"虛寒",l08:"風暑",l09:"暑濕",l10:"風濕",
    l11:"寒濕",l12:"濕熱",l13:"燥火",l14:"溫燥",l15:"燥熱",l16:"燥濕",
    l17:"虛燥",l18:"風火",l19:"寒火",l20:"濕火",l21:"燥火",
    l22:"鬰火",l23:"虛火",l24:"氣鬰",l25:"氣瘀",l26:"氣痰",l27:"氣火",
    l28:"寒瘀",l29:"瘀熱",l30:"痰瘀",l31:"痰濕",l32:"熱痰",l33:"痰火",
    l34:"風痰",l35:"虛痰",l36:"水飲",l37:"寒飲",l38:"飲熱",l39:"食滯",
    l40:"積熱",l41:"蟲積",l42:"氣虛",l43:"血虛",l44:"陰虛",l45:"陽虛",
    }
export const SickLocations={ //病位
    z01:"肺衛",z02:"肺脾",z03:"心肺",z04:"肝肺",z05:"肺腎",
    z06:"心營",z07:"心胃",z08:"心脾",z09:"心膽",z10:"心肝",
    z11:"心腎",z12:"肺胃",z13:"脾胃",z14:"胃腸",z15:"膽胃",
    z16:"肝胃",z17:"腎胃",z18:"肝脾",z19:"脾腎",z20:"肝膽",
    z21:"肝腎"
}
export const SickSigns={ //病候
    h001:"衛氣失宣",h002:"衛氣鬰蒸",h003:"衛氣不振",h004:"衛氣虛鬰",h005:"衛陽失宣",
    h006:"衛陽怫鬰",h007:"衛陽鬰閉",h008:"衛陽鬰蒸",h009:"衛陽不振",h010:"衛陽虛鬰",
    h011:"衛陽不固",
    
    h012:"營衛鬰滯",h013:"營衛鬰蒸",h014:"營衛鬰熾",h015:"營衛虛弱",h016:"營衛虛鬰",
    h017:"營衛失調",h018:"營衛不行",h019:"營氣失宣",h020:"營氣鬰蒸",

    h021:"氣營蘊蒸",h022:"氣營蒸灼",h023:"氣營蘊閉",h024:"營血失宣",h025:"營血鬰蒸",
    h026:"營血鬰閉",h027:"營血蒸灼",h028:"營血蘊閉",h029:"營血失養",h030:"營液蒸灼",
    h031:"營陰消灼",h032:"營陰失養",
    
    h033:"清氣失宣",h034:"清氣鬰遏",h035:"清氣鬰蒸",h036:"清氣鬰熾",h037:"清氣鬰閉",
    h038:"清氣鬰陷",h039:"清氣怫鬰",h040:"清氣蘊蒸",h041:"清氣蘊熾",h042:"清氣失寧",
    h043:"清氣鬰滯",h044:"清氣不化",h045:"清氣鬰逆",h046:"清氣逆亂",h047:"清氣鬰結",
    h048:"清氣閉厥",h049:"清氣虛鬰",h050:"清氣虛滯",h051:"清氣厥膚",h052:"清氣虛蒸",
    h053:"清氣虛陷",h054:"清氣不升",h055:"清氣下陷",
    
    h056:"清陽失宣",h057:"清陽鬰遏",h058:"清陽鬰滯",h059:"清陽怫鬰",h060:"清陽鬰蒸",
    h061:"清陽鬰熾",h062:"清陽鬰閉",h063:"清陽鬰結",h064:"清陽鬰逆",h065:"清陽逆亂",
    h066:"清陽鬰陷",h067:"清陽鬰痹",h068:"清陽不行",h069:"清陽不化",h070:"清陽失位",
    h071:"清陽蒙閉",h072:"清陽閉厥",h073:"清陽虛鬰",h074:"清陽虛陷",h075:"清陽虛閉",
    h076:"清陽失調",h077:"清陽虛滯",h078:"清陽虛結",h079:"清陽虛熾",h080:"清陽不升",
    h081:"清陽下陷",
    
    h082:"樞機鬰遏",h083:"樞機鬰滯",h084:"樞機鬰蒸",h085:"樞機鬰熾",h086:"樞機鬰結",
    h087:"樞機虛蒸",h088:"樞機虛鬰",
    
    h089:"津氣不化",h090:"津氣鬰滯",h091:"津氣鬰結",h092:"氣虛不化",h093:"津氣鬰蒸",
    h094:"津氣鬰熾",h095:"津氣蘊蒸",h096:"津氣蒸灼",h097:"津氣蒸閉",h098:"津氣蘊閉",
    h099:"津氣蒸熾",h100:"津氣燥結",h101:"津氣煎迫",h102:"津氣熾逆",h103:"津氣陷閉",
    h104:"津氣熾閉",h105:"津氣閉厥",h106:"津氣虛灼",h107:"津氣虛閉",h108:"津氣閉脫",
    h109:"津氣不布",h110:"津氣不固",

    h111:"氣液消灼",h112:"氣液消涸",h113:"氣液脫絕",h114:"液竭陽脫",h115:"氣液鬰蒸",
    h116:"液竭陽鬰",h117:"氣液鬰滯",h118:"氣液煎迫",h119:"氣液閉厥",h120:"氣液虛鬰",
    h121:"氣液虛逆",h122:"氣液虛滯",h123:"氣液不化",h124:"氣液虛燥",h125:"氣液虛閉",
    h126:"氣液不固",
    
    h127:"氣血鬰滯",h128:"氣血鬰遏",h129:"氣血怫鬰",h130:"氣血鬰逆",h131:"氣血鬰結",
    h132:"氣血鬰蒸",h133:"氣血鬰熾",h134:"氣血蘊蒸",h135:"氣血蘊熾",h136:"氣血兩燔",
    h137:"氣血蒸熾",h138:"氣血燥結",h139:"氣血煎迫",h140:"氣血熾閉",h141:"氣血閉脫",
    h142:"氣血失養",h143:"氣血失調",h144:"氣血虛結",h145:"氣血虛鬰",h146:"氣血虛蒸",
    h147:"氣血虛熾",h148:"氣虛失攝",h149:"血虛陽浮",h150:"氣血厥脫",h151:"氣血脫絕",
    
    h152:"氣陰鬰蒸",h153:"氣陰蘊蒸",h154:"氣陰消灼",h155:"氣陰兩虛",h156:"氣陰虛鬰",
    h157:"氣陰虛滯",h158:"氣陰不化",h159:"氣陰虛燥",h160:"氣陰虛蒸",h161:"氣陰不攝",
    h162:"氣陰不固",h163:"氣陰閉脫",h164:"氣陰竭絕",
    
    h165:"陽氣亢逆",h166:"陽氣厥逆",h167:"陽鬰不化",h168:"陽滯不化",h169:"陽虛不化",
    h170:"陽氣虛滯",h171:"陽氣虛結",h172:"陽氣虛鬰",h173:"陽氣虛熾",h174:"陽氣虛逆",

    h175:"陽虛失納",h176:"陽虛失固",h177:"陽虛失攝",h178:"陽氣虛損",h179:"陽損及陰",
    h180:"陽氣閉脫",h181:"陽氣厥脫",h182:"虛陽浮越",h183:"陽氣虛脫",
    
    h184:"血液鬰結",h185:"血液蘊蒸",h186:"血液鬰蒸",h187:"血液燔灼",h188:"血液閉厥",
    h189:"血液閉脫",h190:"血液鬰滯",h191:"血液虛燥",h192:"血液消灼",h193:"血液消涸",
    
    h194:"陰血蘊熾",h195:"陰血煎迫",h196:"陰血閉厥",h197:"陰血閉脫",h198:"陰血失養",
    h199:"陰血虛鬰",h200:"陰血虛滯",h201:"陰血虛蒸",h202:"陰血消灼",h203:"陰血虛燥",
    h204:"陰血虛損",
    h205:"陰枯火熾",h206:"陰液煎迫",h207:"陰液虛燥",h208:"陰液閉厥",h209:"陰液厥脫",
    h210:"陰液消灼",h211:"陰液枯涸",
    
    h212:"陰虛陽浮",h213:"陰竭陽厥",h214:"陰竭陽越",h215:"陰竭陽脫",
    
    h216:"陰虛失養",h217:"陰虛陽弱",h218:"陰虛陽鬰",h219:"陰虛不化",h220:"陰虛失納",
    h221:"陰虛失攝",h222:"陰虛不固",
    
    h223:"陰精不固",h224:"真陰虛損",h225:"陰損及陽",

    h226:"肺氣失宣",h227:"肺失宣降",h228:"肺氣鬰閉",h229:"肺氣鬰痹",h230:"肺氣失充",
    h231:"肺陽失宣",h232:"肺陽不布",h233:"肺絡失宣",h234:"肺失清肅",h235:"肺陰失養",

    h236:"心神失寧",h237:"心氣不振",h238:"心陽亢盛",h239:"心陽失宣",h240:"心陽閉塞",
    h241:"心陽不振",h242:"心絡失宣",h243:"心血失養",h244:"心陰失養",h245:"心陰虛滯",

    h246:"胃氣不醒",h247:"胃氣失和",h248:"胃失和降",h249:"胃氣鬰結",h250:"胃氣不振",
    h251:"胃陽失和",h252:"胃陽虛逆",h253:"胃陽不振",h254:"胃絡失和",h255:"胃陰消涸",

    h256:"脾氣失運",h257:"脾胃鬰滯",h258:"中氣鬰結",h259:"中氣窒閉",h260:"脾氣不健",
    h261:"脾氣虛滯",h262:"脾氣虛結",h263:"脾胃不和",h264:"脾陽失運",h265:"脾陽鬰閉",
    h266:"脾陽鬰結",h267:"中陽鬰滯",h268:"中陽閉塞",h269:"中陽不和",h270:"脾陽虛滯",
    h271:"脾陽不振",h272:"脾陰消涸",
    
    h273:"膽氣鬰滯",h274:"膽氣鬰結",h275:"膽氣不振",

    h276:"木火鬰遏",h277:"木火鬰滯",h278:"木火鬰閉",h279:"木火鬰逆",h280:"木火鬰蒸",
    h281:"木火鬰熾",h282:"木火蘊熾",h283:"木火升逆",h284:"木火熾逆",h285:"木火蘊閉",
    h286:"木火閉厥",h287:"木火虛蒸",h288:"木火虛熾",h289:"木火虛逆",
    
    h290:"肝氣失疏",h291:"肝氣鬰結",h292:"肝氣橫逆",h293:"肝氣不振",h294:"肝氣失調",
    h295:"肝陽亢盛",h296:"肝陽失宣",h297:"肝陽閉塞",h298:"肝陽失和",h299:"肝陽不振",
    h300:"肝絡失宣",h301:"肝絡失和",h302:"肝血失養",h303:"肝陰虛滯",h304:"肝陰失養",
    
    h305:"腎氣失宣",h306:"腎氣鬰結",h307:"腎氣不充",h308:"腎陽失宣",h309:"腎陽閉塞",
    h310:"腎陽不振",h311:"腎陽不化",h312:"腎陽虛結",h313:"腎陽虛逆",h314:"腎絡失宣",
    h315:"腎陰消灼",h316:"腎陰虛熾",h317:"腎陰虛滯",h318:"腎陰失養",
    h319:"君相失寧",h320:"心腎不交",h321:"龍雷不藏",h322:"火不歸元"
}

const hasOneOf=(text,include)=>{
    for (let i=0;i<include.length;i++) {
        if (!text.indexOf(include[i])) return true;
    }
}
//將一個詞編碼
export const encodeFactor=( text,keyfactors)=>{
    const traits=[];
    for (let type in keyfactors) {
        const key=keyfactors[type].prefix;
        const factors=keyfactors[type].factors;
        const include=keyfactors[type].include;
        for (let j=0;j<factors.length;j++) {
            const factor=factors[j];
            if (typeof factor=='string') {
                if (~text.indexOf(factor)) {
                    if (include?.length && !hasOneOf(text,include)) continue;
                    if (!~traits.indexOf(key+j)) {
                        traits.push(key+j);
                    }
                }
            } else {
                for (let k=0;k<factors[j].length;k++) {
                    const factor=factors[j][k];
                    if (~text.indexOf(factor)) {
                        if (!~traits.indexOf(key+j)) traits.push(key+j);
                    } 
                }
            }
        }
    }
    return traits.sort(alphabetically);
}
//將多個詞編碼，去重排序
export const encodeFactors=(words,fieldname)=>{
    let out='';
    const factors=SickFactors[fieldname];
    for (let i=0;i<words.length;i++) {
        const w=words[i];
        const traits=encodeFactor(w,factors);
        if (traits.length) out+= traits.join('');
    }
    const arr=unique(out.split(/([a-z]\d+)/).sort(alphabetically).filter(it=>!!it))
    return arr;
}
    
    
export const onLineText=(t,line)=>{
    if (~t.indexOf('^ck')) {
        return t.replace(/\^ck(\d+)z(\d+)h(\d+)/,(m,l,z,h)=>{
            const caption=onChunkCaption(l+'z'+z+'h'+h);
            const [sick,sign]=caption.split('|');
            return m+' ^sick【'+ sick+'】^sign'+h+'【'+sign+'】';
        })        
    }
    return t;
}
const parseChunkId=chunkid=>{
    const l=chunkid.slice(0,2);
    const z=chunkid.slice(3,5);
    const h=chunkid.slice(6);
    return {l,z,h};
}
export const onChunkCaption=(chunkid,part)=>{
    const {l,z,h}=parseChunkId(chunkid);
    const part1=SickCauses['l'+l]+SickLocations['z'+z]+'證';
    const part2=SickSigns['h'+h]+'候';
    if (part==1) return part1;
    if (part==2) return part2;
    return part1+'|'+part2;
}
//this is slow
const findPrefix=(Factors,prefix)=>{
    for (let i=0;i<Factors.length;i++) {
        if (Factors[i].prefix==prefix) return Factors[i].factors;
    }
    return [];
}
export const decodeFactor=(field,code)=>{
    const [m0,prefix,n]=code.split(/([a-z])(\d+)/);
    const factors=findPrefix(SickFactors[field], prefix);
    let caption=factors[n];
    if (typeof caption!=='string') caption=caption[0];
    return caption;
}
const makeButtonStates=(Factors)=>{
    const out=[];
    for (let i=0;i<Factors.length;i++) {
        const states=[];
        const {caption,factors,prefix}=Factors[i];
        for (let j=0;j<factors.length;j++) {
            if (typeof factors[j]!=='string') {
                states[factors[j][0]]= prefix+j;
            } else states[factors[j]]=prefix+j;
        }
        out.push({caption, states, prefix});
    }
    return out;
}
const icons={ symtom:'⚠️', tounge:'👅', pulse:'✋🏻'}

export const getMultiStateFilters=()=>{
    return [
        {name:'symtom',caption:icons.symtom , states: makeButtonStates(symtom) ,newline:true},
        {name:'tounge',caption:icons.tounge, states: makeButtonStates(tounge) },
        {name:'pulse',caption: icons.pulse, states: makeButtonStates(pulse) },
    ]
}


export const stringifyChoice=(choices,groupby=0,groupfilter='')=>{
    let symtom='',tounge='',pulse='';
    for (let key in choices) {
        if (key=='symtom') symtom=choices[key].join('');
        if (key=='tounge') tounge=choices[key].join('');
        if (key=='pulse') pulse=choices[key].join('');
    }
    return symtom+'_'+tounge+'_'+pulse+'_'+groupby+'_'+groupfilter;
}
export const humanChoice=(choices)=>{
    if (typeof choices=='string') [choices]=parseChoice(choices);
    let out='';
    for (let field in choices){
        if (choices[field].length) {
            out+=icons[field];
            for (let i=0;i<choices[field].length;i++) {
                out+= ' '+decodeFactor(field,choices[field][i]);
            }
        }
    }
    return out;
}
export const parseChoice=(str:string)=>{
    const  [_symtom,_tounge,_pulse,_groupby,_groupfilter]=str.split('_');
    const symtom=(_symtom||'').split(/([a-z]\d+)/).filter(it=>!!it)||[];
    const tounge=(_tounge||'').split(/([a-z]\d+)/).filter(it=>!!it)||[];
    const pulse=(_pulse||'').split(/([a-z]\d+)/).filter(it=>!!it)||[];
    const groupby=parseInt(_groupby)||0;
    const groupfilter=_groupfilter;
    return [ {symtom,tounge,pulse } , groupby, groupfilter];
}
const factorString=(code,groupby)=>{
    if (groupby==1) {
        return SickLocations['z'+code];
    } else if (groupby==2) {
        return SickCauses['l'+code]
    } else if (groupby==3) {
        const [m0,z,l]=code.match(/(\d+)z(\d+)/);
        return SickLocations['z'+z]+SickCauses['l'+l];
    } else if (groupby==4) {
        return SickSigns['h'+code];
    }
    return ''
}
//1"病位",2"病因",2"證",3"候"];
const groupBy=(items,chunks,groupby=1,groupfilter='')=>{
    const obj={};
    for (let i=0;i<items.length;i++) {
        const ck= chunks[i]  ;
        const {l,z,h} = parseChunkId(ck.id);
        let gkey='';
        if (groupby==1) gkey=z;
        else if (groupby==2) gkey=l;
        else if (groupby==3) gkey=l+'z'+z;
        else if (groupby==4) gkey=h;
        if (!obj[gkey]) obj[gkey]=0;
        obj[gkey]++;
    }
    return fromObj(obj,(code,count)=>[factorString(code,groupby),count, code])
    .sort((a,b)=>b[1]-a[1]);
}
const matchGroup=(ck,groupby,groupfilter)=>{
    if (groupby && groupfilter) {
        if (groupby==1) { 
            return ~ck.id.indexOf('z'+groupfilter);
        } else if (groupby==2) {
            return ck.id.indexOf(groupfilter)==0;
        } else if (groupby==3) {
            return ~ck.id.indexOf(groupfilter);
        } else if (groupby==4) {
            return ~ck.id.indexOf('h'+groupfilter);
        }
    } return true;
}
export const runFilter=(ptk,col,opts={})=>{
    const items=[], chunks=[]; // items tag.at , chunks:nearestChunk
    const choices=opts.choices;
    const groupby=opts.groupby;
    const groupfilter=opts.groupfilter;
    
    const tag=ptk.defines[col.attrs.master];
    let choicecount=0;
    for (let field in choices) {
        choicecount+=choices[field].length;
    }
    for (let i=0;i<tag.linepos.length;i++) {
        let hit=0;
        for (let field in choices) {
            if (choices[field].length==0) continue;
            for (let j=0;j<choices[field].length;j++) {
                const key=choices[field][j];
                if (~col[field][i].indexOf(key) ) hit++;
            }
            if (hit*1.1<choicecount) continue;

            const line=tag.linepos[i];
            const ck=ptk.getNearestChunk(line);

            if (groupby==0 && groupfilter) {
                if (tag.innertext.get(i)!==groupfilter) continue;
            } else {
                if (!matchGroup(ck, groupby,groupfilter)) continue;
            }
            items.push(i); 
            chunks.push(ck);
        }
    }
    let groups=[],grouping={};
    if (groupby) { //
        groups=groupBy(items,chunks,groupby,groupfilter);
    } else {
        for (let i=0;i<items.length;i++) {
            const t=tag.innertext.get( items[i]);
            if (!grouping[t] ) grouping[t]=0;
            grouping[t]++;
        }
        //text as group filter
        groups=fromObj(grouping , (text,count)=>[text,count,text]) ;
        groups.sort((a,b)=>b[1]-a[1])
    }
    return {items,groups, mastertag:tag};
}
const groupStates=(format)=>{
    if (format=='statebutton') {
        return { "名":0,"位":1,"因":2,"證":3,"候":4}
    } else {
        return ["名","位","因","證","候"];
    }
}

const factorSimilarity=(factors,str)=>{
    const len=str.length/2 , count=factors.length;
    let match=0;
    for (let i=0;i<factors.length;i++) {
        if (~str.indexOf(factors[i])) match++;
    }
    const r=(match*2)/(len+count);
    // if (r>1) console.log(match, len, count,factors,str)
    return r;
}
export const similarFactors=(ptk,tagname,factors)=>{
    const out=[];
    for (let i=0;i<ptk.columns.manifest[tagname].length;i++) {
        const str=ptk.columns.manifest[tagname][i];
        if (!str) continue;
        const similarity=factorSimilarity(factors,str);
        if (similarity>0.5) {
            const illline= ptk.defines.ill.linepos[i];//line of ill, not symtom
            const at2=bsearchNumber(ptk.defines[tagname].linepos,illline);
            const id=i;//idx of ill
            out.push( { i, id,similarity,line: ptk.defines[tagname].linepos[at2] })
        }
        out.sort((a,b)=>b.similarity-a.similarity)
    }
    return out;
}
export const getApprox=(ptk,tagname,id)=>{
    const at=bsearchNumber(ptk.defines.ill.linepos,id)-1; //id is line
    const v=ptk.columns.manifest[tagname][at];
    const factors=v.split(/([a-z]\d)/).filter(it=>!!it);
    const out=similarFactors(ptk,tagname,factors).filter(it=>it.i!==at);
    return out;
}
addTemplate('cm',{filterColumn:'manifest',getApprox, similarFactors,
parseChoice, stringifyChoice,humanChoice,groupStates,
onLineText,onChunkCaption,getMultiStateFilters,runFilter});

