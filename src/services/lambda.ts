import { LambdaClient, ListFunctionsCommand, ListTagsCommand, ListTagsCommandOutput } from "@aws-sdk/client-lambda";
import { AwsAccountConfig, Summary } from "../interfaces.js";

export async function getLambdaSummary(account: AwsAccountConfig, regions: string[]): Promise<Summary> {
    const lambdaSummary: Summary = {
        count: 0,
        taggedAssets: 0,
        untaggedAssets: 0,
    };
    for (const region of regions) {
        account.region = region;
        let nextToken: string | undefined;

        do {
            const client = new LambdaClient(account);

            const res = await client.send(
                new ListFunctionsCommand({
                    Marker: nextToken,
                })
            );

            if (!res.Functions) {
                continue
            } else {
                lambdaSummary.count += res.Functions.length;
            }

            for (const lambda of res.Functions) {
                const tagRes: ListTagsCommandOutput = await client.send(new ListTagsCommand({Resource: lambda.FunctionArn}));
                if (tagRes.Tags) {
                    lambdaSummary.taggedAssets++;
                } else {
                    lambdaSummary.untaggedAssets++;
                }
            }
        } while (nextToken);
    }
    return lambdaSummary;
}

function getArn(accountId: string, region: string, resourceIdentifier: string, service: string): string {
    return `arn:aws:${service}:${region}:${accountId}:${resourceIdentifier}`;
}
