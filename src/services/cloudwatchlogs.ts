import {
    CloudWatchLogsClient,
    DescribeLogGroupsCommand,
    ListTagsForResourceCommand
} from "@aws-sdk/client-cloudwatch-logs";
import { AwsAccountConfig, Summary } from "../interfaces.js";

export async function getCloudWatchLogsSummary(account: AwsAccountConfig, regions: string[]): Promise<Summary> {
    const cloudWatchLogsSummary: Summary = {
        count: 0,
        taggedAssets: 0,
        untaggedAssets: 0,
    };

    for (const region of regions) {
        account.region = region;
        let nextToken: string | undefined;

        do {
            const client = new CloudWatchLogsClient(account);
            const command = new DescribeLogGroupsCommand({ nextToken: nextToken });
            const res = await client.send(command);
            nextToken = res.nextToken;

            if (!res.logGroups) {
                continue;
            }

            for (const logGroup of res.logGroups) {
                cloudWatchLogsSummary.count++;

                try {
                    const tagsCommand = new ListTagsForResourceCommand({
                        resourceArn: logGroup.arn
                    });
                    const tagsRes = await client.send(tagsCommand);

                    if (tagsRes.tags && Object.keys(tagsRes.tags).length > 0) {
                        cloudWatchLogsSummary.taggedAssets++;
                    } else {
                        cloudWatchLogsSummary.untaggedAssets++;
                    }
                } catch (err) {
                    // If we can't fetch tags, count as untagged
                    cloudWatchLogsSummary.untaggedAssets++;
                }
            }
        } while (nextToken);
    }

    return cloudWatchLogsSummary;
}
