import {create} from './cli/create.ts';
type fCommmand =  ( name:string, flag: string) => Promise<boolean|undefined>;
//https://stackoverflow.com/questions/29689966/how-to-define-type-for-a-function-callback-as-any-function-type-not-universal
//https://stackoverflow.com/questions/38744159/in-typescript-how-to-define-type-of-async-function
const { args: Args } = Deno;
const [cmd, ptkName, flag] = [Args[0], Args[1], Args[2]];

const command: { [key: string]: fCommmand } = { "create": create };

async function cliMain(ptkName: string, flag: string) {
    if (command[cmd]) {
        await command[cmd] ( ptkName, flag);
    }  else if (cmd === "--version" || cmd === "-v") {
        console.log(`version 1.0`);
    }  else {
        console.log(`To create a project, type:` + ` %cptk create %c[project name]`, "color:#55dac8;", "color:red;");
        console.log(`To compile a project, type:` + ` %cptk build`, "color:#55dac8;");
        console.log(`To start a dev server, type:` + ` %cptk dev`, "color:#55dac8;");
    }
}

if (import.meta.main) {
    await cliMain(ptkName, flag);
}
  