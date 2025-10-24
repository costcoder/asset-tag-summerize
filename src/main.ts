import {processMain} from "./processMain";
import {getCliArguments} from "./cli-args.helper";
import {getAccessConfigurations} from "./config.helper";
import {AccountServicesSummary, AwsTotalSummary, Summary} from "./interfaces";
import {getAccountSummary} from "./assetFetcher";

async function main() {
    const cliArgs = getCliArguments();
    const credentials = await getAccessConfigurations(cliArgs['configFile']);

    const aggregatedSummary: AwsTotalSummary = {
        totalAssets: 0,
        totalTaggedAssets: 0,
        totalUntaggedAssets: 0,
        accountSummary: {},
    };

    for (const credential of credentials) {
        const summary: AccountServicesSummary = await getAccountSummary(credential);
        aggregatedSummary.totalAssets += summary.totalAssets;
        aggregatedSummary.totalTaggedAssets += summary.totalTaggedAssets;
        aggregatedSummary.totalUntaggedAssets += summary.totalUntaggedAssets;
        aggregatedSummary.accountSummary[summary.accountId] = summary;
    }

    console.log('Summary');
    console.log('========')
    console.log(JSON.stringify(aggregatedSummary, null, 2));
}

processMain(main);