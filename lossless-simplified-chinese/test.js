import {toSim,fromSim} from './index.js'
let pass=0;
let test=0;

console.clear();
console.log('')
const text='大道之行也．天下為公．選賢與能．講信脩睦．故人不獨親其親．不獨子其子．使老有所終．壯有所用．幼有所長．矜寡孤獨廢疾者．皆有所養．男有分．女有歸．貨惡其棄於地也．不必藏於已．力惡其不出於身也．不必為已．是故謀閉而不興．盜竊亂賊而不作．故外戶而不閉．是謂大同';

const text2='廣式炒麵 複雜 覆滅';
const text3='天后宮 後宮佳麗'
// console.log(text3,'>>',toSim(text3),fromSim(toSim(text3)));
// console.log(text3,'>>',toSim(text3));

pass+=(toSim('樹幹',0)=='樹幹')   ;test++;       //do nothing
pass+=(toSim('樹幹',1)=='树幹')   ;test++;       //safe
pass+=(toSim('樹幹')  =='树幹')   ;test++;       //mode is optional, default to 1
pass+=(toSim('樹幹',2)=='树干') ;test++;       //unsafe=1
pass+=(toSim('樹乾',2)=='树乾')  ;test++;      
pass+=(toSim('餅乾')=='饼乾')     ;test++;     //safe
pass+=(toSim('心願')=='心願')  ;test++;   
pass+=(toSim('心願',2)=='心愿')  ;test++;   

pass+=(toSim('簡體')=='简體')  ;test++;   
pass+=(toSim('簡體',2)=='简体')  ;test++;   
pass+=(fromSim('饼干',1)  =='餅干')   ;test++;     //
pass+=(fromSim('饼干')  =='餅干')   ;test++;     //mode is optional
pass+=(fromSim('树干')  =='樹干')   ;test++;     //safe
pass+=(fromSim('饼干',2)=='餅幹')     ;test++;  //pick the first match (wrong)
pass+=(fromSim('树干',2)=='樹幹')     ;test++;  //pick the first match (correct)
pass+=(fromSim('饼干',3)=='餅[幹乾干]');test++; //expand other possibility

pass+= (fromSim(toSim(text,1))==text);test++;
pass+= (fromSim(toSim(text2,1))==text2);test++;
pass+= (fromSim(toSim(text3,1))==text3);test++;

pass+=(toSim('無損簡體',1)=='无损简體' )  ;test++;
pass+=(toSim('無損簡體',2)=='无损简体')   ;test++;
pass+=(fromSim('无损简體')=='無損簡體'    )  ;test++;
pass+=(fromSim('无损简体')=='無損簡体'     ) ;test++;
pass+=(fromSim('无损简体',2)=='無損簡體'    );test++;
pass+=(fromSim('无损简体',3)=='無損簡[體体]');test++;

pass+=(fromSim('头发')=='頭发');test++;
pass+=(fromSim('头发',2)=='頭髮') ;test++; //wrong guest\
pass+=(fromSim('头发',3)=='頭[髮發]');test++;


pass+=fromSim(toSim('𥢒'))=='𥢒';test++;

console.log('Passed test',pass,'test count',test);