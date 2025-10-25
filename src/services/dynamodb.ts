import {
    DynamoDBClient,
    ListTablesCommand,
    ListTagsOfResourceCommand,
    ListTagsOfResourceCommandOutput
} from "@aws-sdk/client-dynamodb";
import { AwsAccountConfig, Summary } from "../interfaces.js";

export async function getDynamoDBSummary(account: AwsAccountConfig, regions: string[], accountId: string): Promise<Summary> {
    const dynamodbSummary: Summary = {
        count: 0,
        taggedAssets: 0,
        untaggedAssets: 0,
    };

    for (const region of regions) {
        account.region = region;
        let nextToken: string | undefined;
        do {
            const client = new DynamoDBClient(account);
            const command = new ListTablesCommand({ExclusiveStartTableName: nextToken,});
            const res = await client.send(command);

            if (!res.TableNames) {
                continue;
            }

            dynamodbSummary.count += res.TableNames.length;
            for (const tableName of res.TableNames) {
                const tableArn = getArn(accountId, region, `table/${tableName}`, 'dynamodb');
                const tagRes: ListTagsOfResourceCommandOutput = await client.send(new ListTagsOfResourceCommand({ResourceArn: tableArn}));
                if (tagRes.Tags) {
                    dynamodbSummary.taggedAssets++;
                } else {
                    dynamodbSummary.untaggedAssets++;
                }
            }
        } while (nextToken);
    }

    return dynamodbSummary;
}

function getArn(accountId: string, region: string, resourceIdentifier: string, service: string): string {
    return `arn:aws:${service}:${region}:${accountId}:${resourceIdentifier}`;
}
