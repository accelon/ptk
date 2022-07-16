import {humanBytes} from './misc.ts'
const {blue,yellow,green,red,bgWhite} = '../cli/colors.cjs';

export const showMemory=(stage)=>{
	console.log(green(stage.padEnd(8,' ')),'v8',
	...humanBytes(process.memoryUsage().heapTotal), 
	',C++',...humanBytes(process.memoryUsage().external)); //memory hold by C++ object ( like Int32Array TextDecoder)
}
export const runTest=async (stage,cb)=>{
	console.time(stage);
	await cb();
	console.timeEnd(stage);
	showMemory(stage);
}
