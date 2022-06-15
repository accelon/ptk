import * as fs from '../platform/denofs.ts';
import pitaka_json  from '../templates/pitaka_json.ts';
import file1_off from '../templates/file1_off.ts';
export const create=async (ptkName: string, flag: string|null)=>{
    const template=flag;
    if (!ptkName) {
        console.log('missing project name');
        return;
    }
    try {
        const outdir=ptkName+'/';
        if (await fs.exists(ptkName)) {
            console.log(`%c${ptkName}%c already exists`,'color:red',"color:white");
            return;
        }
        await fs.mkdir(ptkName);
        const content=pitaka_json(ptkName);
        await fs.writeTextFile(outdir+'pitaka.json', content );
        await fs.writeTextFile(outdir+'file1.off', file1_off() );

        console.log(`Project %c${ptkName} %csuccessfully.`,"color:red;","color:white");
        console.log(content);
        return true;
    } catch (error: unknown) {
        console.log(error);
    }
    return false;
}