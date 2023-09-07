import {tokenizeOfftext} from '../nodebundle.cjs'

const testdata=[
['abc一二三',4],
['abc xyx',2],
['^aa一二',3],
['一二^aa一二',5],
['^aa^bb44',2],
['^aa^bb',2],
['^aa^bb<xx>',2],
['一^aa<aa>^bb<xx>',3],
['1 ^aa<aa>22^bb<xx>333 444',6],
['^^aa',2],
['^aa^',2]
]
let tests=0,passes=0;
for (let i=0;i<testdata.length;i++) {
    tests++
    const tokenized=tokenizeOfftext(testdata[i][0]);
    if (tokenized.length==testdata[i][1])passes++;
    else {
        console.log('fail',testdata[i], tokenized)
    }
}

console.log('tests',tests,'passes',passes)