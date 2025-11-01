import {processMain} from "./processMain";
import {getCliArguments} from "./cli-args.helper";
import {getAccessConfigurations} from "./config.helper";
import {AccountServicesSummary, AwsTotalSummary, ServiceError} from "./interfaces";
import {getAccountSummary} from "./assetFetcher";
import {displayConfiguration, promptConfirmation} from "./confirmation-helper.js";
import {initializeOutputFiles, writeFinalResults, appendErrorToLog, finalizeErrorLog} from "./output-helper.js";

async function main() {
    const cliArgs = getCliArguments();
    const credentials = await getAccessConfigurations(cliArgs['configFile']);

    // Detect if running in moto mode by checking environment variables
    const isMotoMode = Object.keys(process.env).some(key =>
        key.startsWith('AWS_ENDPOINT_URL_')
    );

    // Display configuration summary
    displayConfiguration(
        credentials,
        cliArgs['configFile'] || '~/.aws/credentials',
        isMotoMode
    );

    // Prompt for confirmation (unless --yes flag is set)
    if (cliArgs['yes'] !== 'true') {
        const confirmed = await promptConfirmation();
        if (!confirmed) {
            console.log('\nScan cancelled by user.\n');
            process.exit(0);
        }
    } else {
        console.log('Auto-confirming scan (--yes flag detected)...\n');
    }

    // Initialize output files
    const { resultsFile, errorLogFile } = initializeOutputFiles(
        cliArgs['output'],
        cliArgs['errorLog']
    );

    console.log(`Results will be saved to: ${resultsFile}`);
    console.log(`Errors will be logged to: ${errorLogFile}\n`);

    const aggregatedSummary: AwsTotalSummary = {
        totalAssets: 0,
        totalTaggedAssets: 0,
        totalUntaggedAssets: 0,
        accountSummary: {},
    };

    const allErrors: ServiceError[] = [];

    for (const credential of credentials) {
        try {
            const summary: AccountServicesSummary = await getAccountSummary(credential);
            aggregatedSummary.totalAssets += summary.totalAssets;
            aggregatedSummary.totalTaggedAssets += summary.totalTaggedAssets;
            aggregatedSummary.totalUntaggedAssets += summary.totalUntaggedAssets;
            aggregatedSummary.accountSummary[summary.accountId] = summary;

            // Write errors to log file
            if (summary.errors && summary.errors.length > 0) {
                for (const error of summary.errors) {
                    appendErrorToLog(errorLogFile, error, summary.accountId);
                    allErrors.push(error);
                }
            }
        } catch (error) {
            const errorMessage = error.message || 'Unknown error';
            console.error(`\n✗ Failed to scan account ${credential.accessKeyId}: ${errorMessage}`);
            console.error('Continuing with next account...\n');
            // Continue to next account - don't throw
        }
    }

    console.log('\n========================================');
    console.log('Scan Summary');
    console.log('========================================');

    // Count successes and failures
    const totalAccounts = credentials.length;
    const scannedAccounts = Object.keys(aggregatedSummary.accountSummary).length;
    const failedAccounts = totalAccounts - scannedAccounts;

    let totalErrors = 0;
    let totalSuccesses = 0;
    Object.values(aggregatedSummary.accountSummary).forEach(account => {
        totalErrors += (account.errors?.length || 0);
        totalSuccesses += Object.keys(account.servicesSummary).length;
    });

    console.log(`Accounts Scanned:    ${scannedAccounts}/${totalAccounts}`);
    console.log(`Services Successful: ${totalSuccesses}`);
    console.log(`Services Failed:     ${totalErrors}`);
    console.log(`Total Assets:        ${aggregatedSummary.totalAssets}`);
    console.log(`  Tagged:            ${aggregatedSummary.totalTaggedAssets}`);
    console.log(`  Untagged:          ${aggregatedSummary.totalUntaggedAssets}`);
    console.log('========================================\n');

    // Write final results to files
    writeFinalResults(
        resultsFile,
        aggregatedSummary,
        cliArgs['configFile'] || '~/.aws/credentials',
        allErrors
    );
    finalizeErrorLog(errorLogFile, totalErrors);

    console.log('Output Files:');
    console.log(`  Results:   ${resultsFile}`);
    console.log(`  Error Log: ${errorLogFile}\n`);

    console.log('Full Results:');
    console.log(JSON.stringify(aggregatedSummary, null, 2));
}

processMain(main);