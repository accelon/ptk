export const headerWithNumber = [
    /第([一二三四五六七八九十百千○〇零]+)[回章卷品節]*/,
    /卷([一二三四五六七八九十百千○〇零]+)/,
    /卷第([一二三四五六七八九十百千○〇零]+)/,
]
export const isChineseNumber=(str:string,pat:string)=>{
    pat=pat||/[一二三四五六七八九十百千○〇]+/
    return str.replace(pat,'')=='';
}
export const fromChineseNumber=(str:string)=>{
    return parseInt(str.trim()
    .replace(/百([二三四五六七八九])十/,'$1十')
    .replace(/百十$/,'10')
    .replace(/百十/,'1')
    .replace(/百$/,'00')
    .replace(/百/,'0')
    .replace(/一/g,'1')
    .replace(/二/g,'2')
    .replace(/三/g,'3')
    .replace(/四/g,'4')
    .replace(/五/g,'5')
    .replace(/六/g,'6')
    .replace(/七/g,'7')
    .replace(/八/g,'8')
    .replace(/九/g,'9')
    .replace(/^十$/,'10')
    .replace(/^十/,'1')
    .replace(/十$/,'0')
    .replace(/十/,'')
    .replace(/[○〇零]/g,'0'));
}
export const isChineseChapter=(str:string)=>{
    for (let i=0;i<headerWithNumber.length;i++) {
        const pat=headerWithNumber[i];
        const m=str.match(pat);
        if (m) {
            return fromChineseNumber(m[1]);
        }
    }
    return null;;
}
export const extractChineseNumber=(str:string,begining=false)=>{
    let cn=-1;
    for (let i=0;i<headerWithNumber.length;i++) {
        const pat=headerWithNumber[i];
        const m=str.match(pat);
        if (m) cn=fromChineseNumber(m[1]);
    }
    if (!cn) {
        const m=begining?str.match(/^[　 ]?([一二三四五六七八九十○百零]+)/):str.match(/([一二三四五六七八九十○百零]+)/);
        if (m) cn=fromChineseNumber(m[1]);
    }
    return cn;
}
const StyledNumber1={'Ⅰ':10,'ⅰ':10,'⒜':26,'Ⓐ':26,'ⓐ':26,'⓫':10,'㉑':15,'㍘':25,'㍙':24,'㈠':10,
'㊀':10,'㋀':12,'㏠':31,'①':50,'⑴':20,'⒈':20,'⓵':10,'❶':10,'➀':10,'➊':10}
export const styledNumber=(n,style='①',offset=1)=>{
    let max=StyledNumber1[style];
    if (typeof n!=='number') n=parseInt(n)||0;
    if (!max) { //u
        return n.toString(); //fall back
    } else {
        if ((n-offset)>=max) {
            return n.toString();
        }

        if (style=='①') {
            if (n>35) {
                style='㊱';
                n-=35;
            } else if (n>20) {
                style='㉑';
                n-=20;
            }
            if (n==0) return '⓪'
        }
        let code=style.charCodeAt(0) + n - offset;
        return String.fromCharCode(code);
    }
}

const ForeignNumbers={'၀':true,'०':true,'๐':true,'໐':true,'០':true,'༠':true}
export const foreignNumber=(n:number,style:string)=>{
    const s=n.toString();
    const zero=ForeignNumbers[style];
    if (!zero) return s;
    const base=style.charCodeAt(0);
    let out='';
    for (let i=0;i<s.length;i++) {
        out+=String.fromCharCode(s.charCodeAt(i)-0x30 + base);
    }
    return out;
}
export const qianziwen="天地玄黃宇宙洪荒日月盈昃辰宿列張寒來暑往秋收冬藏閏餘成歲律呂調陽雲騰致雨露結為霜金生麗水玉出崑崗劍號巨闕珠稱夜光果珍李奈菜重芥薑海咸河淡鱗潛羽翔龍師火帝鳥官人皇始制文字乃服衣裳推位讓國有虞陶唐弔民伐罪周發殷湯坐朝問道垂拱平章愛育黎首臣伏戎羌遐邇壹體率賓歸王鳴鳳在樹白駒食場化被草木賴及萬方蓋此身髮四大五常恭惟鞠養豈敢毀傷女慕貞絜男效才良知過必改得能莫忘罔談彼短靡恃己長信使可覆器欲難量墨悲絲染詩讚羔羊景行維賢剋念作聖德建名立形端表正空谷傳聲虛堂習聽禍因惡積福緣善慶尺璧非寶寸陰是競資父事君曰嚴與敬孝當竭力忠則盡命臨深履薄夙興溫清似蘭斯馨如松之盛川流不息淵澄取映容止若思言辭安定篤初誠美慎終宜令榮業所基藉甚無竟學優登仕攝職從政存以甘棠去而益詠樂殊貴賤禮別尊卑上和下睦夫唱婦隨外受傅訓入奉母儀諸姑伯叔猶子比兒孔懷兄弟同氣連枝交友投分切磨箴規仁慈隱惻造次弗離節義廉退顛沛匪虧性靜情逸心動神疲守真志滿逐物意移堅持雅操好爵自縻都邑華夏東西二京背邙面洛浮渭據涇宮殿盤鬱樓觀飛驚圖寫禽獸畫彩仙靈丙舍傍啟甲帳對楹肆筵設席鼓瑟吹笙升階納陛弁轉疑星右通廣內左達承明既集墳典亦聚群英杜稿鍾隸漆書壁經府羅將相路俠槐卿戶封八縣家給千兵高冠陪輦驅轂振纓世祿侈富車駕肥輕策功茂實勒碑刻銘磻溪伊尹佐時阿衡奄宅曲阜微旦孰營桓公輔合濟弱扶傾綺回漢惠說感武丁俊乂密勿多士寔寧晉楚更霸趙魏困橫假途滅虢踐土會盟何遵約法韓弊煩刑起翦頗牧用軍最精宣威沙漠馳譽丹青九州禹跡百郡秦并岳宗泰岱禪主云亭雁門紫塞雞田赤城昆池碣石鉅野洞庭曠遠綿邈岩岫杳冥治本於農務茲稼穡俶載南畝我藝黍稷稅熟貢新勸賞黜陟孟軻敦素史魚秉直庶幾中庸勞謙謹敕聆音察理鑒貌辨色貽厥嘉猷勉其祗植省躬譏誡寵增抗極殆辱近恥林皋幸即兩疏見機解組誰逼索居閒處沉默寂寥求古尋論散慮逍遙欣奏累遣慼謝歡招渠荷的歷園莽抽條枇杷晚翠梧桐早凋陳根委翳落葉飄颻遊鵾獨運凌摩絳霄耽讀翫市寓目囊箱易輶攸畏屬耳垣牆具膳餐飯適口充腸飽飫烹宰飢厭糟糠親戚故舊老少異糧妾御績紡侍巾帷房紈扇圓潔銀燭煒煌晝眠夕寐藍筍象床弦歌酒宴接杯舉觴矯手頓足悅豫且康嫡後嗣續祭祀烝嘗稽顙再拜悚懼恐惶牋牒簡要顧答審詳骸垢想浴執熱願涼驢騾犢特駭躍超驤誅斬賊盜捕獲叛亡布射遼丸嵇琴阮嘯恬筆倫紙鈞巧任釣釋紛利俗並皆佳妙毛施淑姿工顰妍笑年矢每催曦暉朗曜璇璣懸斡晦魄環照指薪修祜永綏吉劭矩步引領俯仰廊廟束帶矜莊徘徊瞻眺孤陋寡聞愚蒙等誚謂語助者焉哉乎也";
//follow by max 999
export const normalizeQianziwen=s=>{
    return s.replace('巖','岩').replace('凊','清').replace('嶽','岳').replace('克','剋').replace('吊','弔').replace('柰','奈').replace('鹹','咸').replace('贊','讚').replace('咏','詠');
}
export const parseQianziwen=(s='',juancount=10)=>{
    s=normalizeQianziwen(s);
    const at=qianziwen.indexOf(s.charAt(0));
    if (~at) {            
        const follow=s.length>1?parseInt(s.slice(1),10)-1:0;
        if (isNaN(follow)) {
            return -1;
        }
        return at*juancount+follow;
    }
    return -1;
}
