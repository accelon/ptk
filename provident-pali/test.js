import {toIAST,fromIAST} from "./iast.js"
const str="Evaṃ me sutaṃ – ekaṃ samayaṃ bhagavā sāvatthiyaṃ viharati jetavane anāthapiṇḍikassa ārāme. Atha kho aññatarā devatā abhikkantāya rattiyā abhikkantavaṇṇā kevalakappaṃ jetavanaṃ obhāsetvā yena bhagavā tenupasaṅkami; upasaṅkamitvā bhagavantaṃ abhivādetvā ekamantaṃ aṭṭhāsi. Ekamantaṃ ṭhitā kho sā devatā bhagavantaṃ etadavoca – “‘kathaṃ nu tvaṃ, mārisa, oghamatarī’ti? ‘Appatiṭṭhaṃ khvāhaṃ, āvuso, anāyūhaṃ oghamatari’nti. ‘Yathā kathaṃ pana tvaṃ, mārisa, appatiṭṭhaṃ anāyūhaṃ oghamatarī’ti? ‘Yadākhvāhaṃ, āvuso, santiṭṭhāmi tadāssu . Evaṃ khvāhaṃ, āvuso, appatiṭṭhaṃ anāyūhaṃ oghamatari’”nti."

let test=0,pass=0;
console.log(fromIAST('yaññ'));
pass+=fromIAST('taṃ')=='tM';test++;
pass+=fromIAST('a')=='a';test++;

pass+=fromIAST('vaya')=='vy';test++;
pass+=fromIAST('dukkha')=='dUkVK';test++;
pass+=fromIAST(' appatiṭṭhaṃ ')==' apVptIWVXM ';test++;
console.log(fromIAST('ha'))
// pass+=fromIAST('hha')[0]=='!';test++ //不合法的音
// pass+=fromIAST('vav')[1]=='!';test++ //無最後的母音
// pass+=fromIAST('rha')[0]=='!';test++ //無最後的母音
// pass+=fromIAST('taa')[1]=='!';test++; //後面無法轉換
// // //三連音
pass+=fromIAST('indriya')=='inVdVrIy';test++;


// //特殊處理
pass+=fromIAST('piṇḍāya')=='pINVFAy';test++;
pass+=fromIAST('anāthapiṇḍikassa')=='anATpINVFIksVs';test++;
pass+=fromIAST('ṇaḍa')=='NF';test++;
pass+=fromIAST('santi')=='snVtI';test++;
pass+=fromIAST('sanati')=='sntI';test++;
pass+=fromIAST('nigaṇṭho')=='nIgNVXO';test++
pass+=fromIAST('nigaṇṭo')=='nIgNVWO';test++;
pass+=fromIAST('ṇaṭa')=='NW';test++;

// console.log(fromIAST('Idha chinditamārite, hatajānīsu kassapo'))

pass+=toIAST(fromIAST('aṭṭhapanātiādi'))==='aṭṭhapanātiādi';test++;


pass+=fromIAST('pad')=='pdV';test++;
pass+=toIAST('pdV')=='pad';test++;

pass+=toIAST('sUAk')=='sūka';test++;
pass+=fromIAST('khīnaṃ')=='KIAnM';test++;
pass+=fromIAST('ūpa')=='uAp';test++;
pass+=fromIAST('īpa')=='iAp';test++;

console.log(fromIAST('veḷuādayo'), toIAST('vELUaAdyO'));

pass+=toIAST(fromIAST('veḷuādayo'))=='veḷuādayo';test++;
// console.log(toIAST(fromIAST('kiccasampattiatthena')));

console.log( fromIAST('abbhā-mattaṃ-iva'))

console.log( `pass:${pass} / test:${test}`);