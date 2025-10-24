import process from 'process';

type ProcessMainHandler = () => Promise<number | void>;

export async function processMain(handler: ProcessMainHandler, options: ProcessMainOptions = {}) {

    let exitCode = 0;
    let skipExitingMessage = options.skipExitingMessage || false;


    try {
        const retVal = await handler();
        if (typeof retVal == 'number') {
            exitCode = retVal;
        }
    } catch (error) {
        console.error(`The following error occurred`, error);
        exitCode = 1;
    }

    if (!skipExitingMessage) {
        console.info('Exiting with exit code: ' + exitCode);
    }

    process.exit(exitCode);
}

export interface ProcessMainOptions {
    skipExitingMessage?: boolean;
}
