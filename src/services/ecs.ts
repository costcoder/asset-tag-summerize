import {
    ECSClient,
    ListClustersCommand,
    ListTagsForResourceCommand
} from "@aws-sdk/client-ecs";
import { AwsAccountConfig, Summary } from "../interfaces.js";

export async function getEcsSummary(account: AwsAccountConfig, regions: string[]): Promise<Summary> {
    const ecsSummary: Summary = {
        count: 0,
        taggedAssets: 0,
        untaggedAssets: 0,
    };

    for (const region of regions) {
        account.region = region;
        let nextToken: string | undefined;

        do {
            const client = new ECSClient(account);
            const command = new ListClustersCommand({ nextToken: nextToken });
            const res = await client.send(command);
            nextToken = res.nextToken;

            if (!res.clusterArns || res.clusterArns.length === 0) {
                continue;
            }

            ecsSummary.count += res.clusterArns.length;

            for (const clusterArn of res.clusterArns) {
                try {
                    const tagsCommand = new ListTagsForResourceCommand({
                        resourceArn: clusterArn
                    });
                    const tagsRes = await client.send(tagsCommand);

                    if (tagsRes.tags && tagsRes.tags.length > 0) {
                        ecsSummary.taggedAssets++;
                    } else {
                        ecsSummary.untaggedAssets++;
                    }
                } catch (err) {
                    // If we can't fetch tags, count as untagged
                    ecsSummary.untaggedAssets++;
                }
            }
        } while (nextToken);
    }

    return ecsSummary;
}
