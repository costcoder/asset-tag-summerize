import process from "process";
import {CliArg} from "./interfaces";

export function getCliArguments(): CliArg {
    const cliArgs : CliArg = {};

    process.argv.forEach((arg, index) => {
        if (arg.startsWith('--')) {
            if (arg === '--config-file') {
                cliArgs['configFile'] = process.argv[index+1];
            }
        }
    });

    return cliArgs;
}