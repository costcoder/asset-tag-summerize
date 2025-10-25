import {
    SQSClient,
    ListQueuesCommand,
    ListQueueTagsCommand
} from "@aws-sdk/client-sqs";
import { AwsAccountConfig, Summary } from "../interfaces.js";

export async function getSqsSummary(account: AwsAccountConfig, regions: string[]): Promise<Summary> {
    const sqsSummary: Summary = {
        count: 0,
        taggedAssets: 0,
        untaggedAssets: 0,
    };

    for (const region of regions) {
        account.region = region;
        let nextToken: string | undefined;

        do {
            const client = new SQSClient(account);
            const command = new ListQueuesCommand({ NextToken: nextToken });
            const res = await client.send(command);
            nextToken = res.NextToken;

            if (!res.QueueUrls) {
                continue;
            }

            for (const queueUrl of res.QueueUrls) {
                sqsSummary.count++;

                try {
                    const tagsCommand = new ListQueueTagsCommand({
                        QueueUrl: queueUrl
                    });
                    const tagsRes = await client.send(tagsCommand);

                    if (tagsRes.Tags && Object.keys(tagsRes.Tags).length > 0) {
                        sqsSummary.taggedAssets++;
                    } else {
                        sqsSummary.untaggedAssets++;
                    }
                } catch (err) {
                    // If we can't fetch tags, count as untagged
                    sqsSummary.untaggedAssets++;
                }
            }
        } while (nextToken);
    }

    return sqsSummary;
}
