import {
    SNSClient,
    ListTopicsCommand,
    ListTagsForResourceCommand
} from "@aws-sdk/client-sns";
import { AwsAccountConfig, Summary } from "../interfaces.js";

export async function getSnsSummary(account: AwsAccountConfig, regions: string[]): Promise<Summary> {
    const snsSummary: Summary = {
        count: 0,
        taggedAssets: 0,
        untaggedAssets: 0,
    };

    for (const region of regions) {
        account.region = region;
        let nextToken: string | undefined;

        do {
            const client = new SNSClient(account);
            const command = new ListTopicsCommand({ NextToken: nextToken });
            const res = await client.send(command);
            nextToken = res.NextToken;

            if (!res.Topics) {
                continue;
            }

            for (const topic of res.Topics) {
                snsSummary.count++;

                try {
                    const tagsCommand = new ListTagsForResourceCommand({
                        ResourceArn: topic.TopicArn
                    });
                    const tagsRes = await client.send(tagsCommand);

                    if (tagsRes.Tags && tagsRes.Tags.length > 0) {
                        snsSummary.taggedAssets++;
                    } else {
                        snsSummary.untaggedAssets++;
                    }
                } catch (err) {
                    // If we can't fetch tags, count as untagged
                    snsSummary.untaggedAssets++;
                }
            }
        } while (nextToken);
    }

    return snsSummary;
}
