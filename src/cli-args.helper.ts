import process from "process";
import {CliArg} from "./interfaces";

export function getCliArguments(): CliArg {
    const cliArgs : CliArg = {};

    process.argv.forEach((arg, index) => {
        if (arg.startsWith('--')) {
            // Handle --config-file
            if (arg.startsWith('--config-file=')) {
                cliArgs['configFile'] = arg.split('=')[1];
            } else if (arg === '--config-file') {
                cliArgs['configFile'] = process.argv[index+1];
            }
            // Handle --output
            else if (arg.startsWith('--output=')) {
                cliArgs['output'] = arg.split('=')[1];
            } else if (arg === '--output') {
                cliArgs['output'] = process.argv[index+1];
            }
            // Handle --error-log
            else if (arg.startsWith('--error-log=')) {
                cliArgs['errorLog'] = arg.split('=')[1];
            } else if (arg === '--error-log') {
                cliArgs['errorLog'] = process.argv[index+1];
            }
            // Handle --yes flag (skip confirmation)
            else if (arg === '--yes') {
                cliArgs['yes'] = 'true';
            }
        }
        // Handle shorthand flags
        else if (arg === '-y') {
            cliArgs['yes'] = 'true';
        } else if (arg === '-o') {
            cliArgs['output'] = process.argv[index+1];
        } else if (arg === '-e') {
            cliArgs['errorLog'] = process.argv[index+1];
        }
    });

    return cliArgs;
}