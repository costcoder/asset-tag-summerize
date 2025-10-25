import * as readline from 'readline';
import {Configuration} from "./interfaces.js";

export function displayConfiguration(
    credentials: Configuration[],
    configFile: string,
    isMotoMode: boolean
): void {
    console.log('\n========================================');
    console.log('Assets Scanner Configuration');
    console.log('========================================');
    console.log(`Credentials File: ${configFile}`);
    console.log(`Accounts Found:   ${credentials.length}`);

    if (isMotoMode) {
        console.log(`Target Endpoint:  http://localhost:5000 (MOTO)`);
    } else {
        console.log(`Target Endpoint:  AWS (Production)`);
    }

    console.log(`Services:         27 AWS services`);
    console.log('\nThis scan will query AWS services across all regions.');
    console.log('========================================\n');
}

export async function promptConfirmation(): Promise<boolean> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question('Do you want to proceed? (Y/n): ', (answer) => {
            rl.close();

            const normalized = answer.trim().toLowerCase();

            // Empty input or 'y'/'yes' = proceed
            if (normalized === '' || normalized === 'y' || normalized === 'yes') {
                resolve(true);
            } else {
                resolve(false);
            }
        });
    });
}
