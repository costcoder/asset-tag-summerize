import {
    EMRClient,
    ListClustersCommand,
    DescribeClusterCommand
} from "@aws-sdk/client-emr";
import { AwsAccountConfig, Summary } from "../interfaces.js";

export async function getEmrSummary(account: AwsAccountConfig, regions: string[]): Promise<Summary> {
    const emrSummary: Summary = {
        count: 0,
        taggedAssets: 0,
        untaggedAssets: 0,
    };

    for (const region of regions) {
        account.region = region;
        let nextToken: string | undefined;

        do {
            const client = new EMRClient(account);
            const command = new ListClustersCommand({ Marker: nextToken });
            const res = await client.send(command);
            nextToken = res.Marker;

            if (!res.Clusters) {
                continue;
            }

            for (const cluster of res.Clusters) {
                emrSummary.count++;

                try {
                    // Get cluster details which include tags
                    const describeCommand = new DescribeClusterCommand({
                        ClusterId: cluster.Id
                    });
                    const describeRes = await client.send(describeCommand);

                    if (describeRes.Cluster?.Tags && describeRes.Cluster.Tags.length > 0) {
                        emrSummary.taggedAssets++;
                    } else {
                        emrSummary.untaggedAssets++;
                    }
                } catch (err) {
                    // If we can't fetch cluster details, count as untagged
                    emrSummary.untaggedAssets++;
                }
            }
        } while (nextToken);
    }

    return emrSummary;
}
