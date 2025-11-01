import {
    ElastiCacheClient,
    DescribeCacheClustersCommand,
    ListTagsForResourceCommand
} from "@aws-sdk/client-elasticache";
import { AwsAccountConfig, Summary } from "../interfaces.js";

export async function getElastiCacheSummary(account: AwsAccountConfig, regions: string[], accountId: string): Promise<Summary> {
    const elastiCacheSummary: Summary = {
        count: 0,
        taggedAssets: 0,
        untaggedAssets: 0,
    };

    for (const region of regions) {
        account.region = region;
        let nextToken: string | undefined;

        do {
            const client = new ElastiCacheClient(account);
            const command = new DescribeCacheClustersCommand({ Marker: nextToken });
            const res = await client.send(command);
            nextToken = res.Marker;

            if (!res.CacheClusters) {
                continue;
            }

            for (const cluster of res.CacheClusters) {
                elastiCacheSummary.count++;

                try {
                    // Build ARN for the cache cluster
                    const clusterArn = `arn:aws:elasticache:${region}:${accountId}:cluster:${cluster.CacheClusterId}`;

                    const tagsCommand = new ListTagsForResourceCommand({
                        ResourceName: clusterArn
                    });
                    const tagsRes = await client.send(tagsCommand);

                    if (tagsRes.TagList && tagsRes.TagList.length > 0) {
                        elastiCacheSummary.taggedAssets++;
                    } else {
                        elastiCacheSummary.untaggedAssets++;
                    }
                } catch (err) {
                    // If we can't fetch tags, count as untagged
                    elastiCacheSummary.untaggedAssets++;
                }
            }
        } while (nextToken);
    }

    return elastiCacheSummary;
}
