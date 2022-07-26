import PTK from 'ptk/nodebundle.cjs'
const {toPinyin} = PTK;
import {red,green} from '../cli/colors.cjs'
let test=0,pass=0;

const tests={
'ㄔㄨ':'chū',"ㄗㄨㄥ": "zōng","ㄩㄢ":"yuān",
 "ㄋㄩㄝˋ": "nüè", "ㄒㄩㄥˋ": "xiòng",
};

for (let zy in tests) {
	test++;
	const py=toPinyin(zy);
	if (py==tests[zy]) {
		pass++;
	} else {
		console.log('wrong',py,'expecting',green(tests[zy]),'got',red(py));
	}
}


console.log('pass',test==pass?green(pass):pass, (test-pass)?('failed',red(test-pass)):'')