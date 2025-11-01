import {
    RedshiftClient,
    DescribeClustersCommand
} from "@aws-sdk/client-redshift";
import { AwsAccountConfig, Summary } from "../interfaces.js";

export async function getRedshiftSummary(account: AwsAccountConfig, regions: string[]): Promise<Summary> {
    const redshiftSummary: Summary = {
        count: 0,
        taggedAssets: 0,
        untaggedAssets: 0,
    };

    for (const region of regions) {
        account.region = region;
        let nextToken: string | undefined;

        do {
            const client = new RedshiftClient(account);
            const command = new DescribeClustersCommand({ Marker: nextToken });
            const res = await client.send(command);
            nextToken = res.Marker;

            if (!res.Clusters) {
                continue;
            }

            for (const cluster of res.Clusters) {
                redshiftSummary.count++;

                if (cluster.Tags && cluster.Tags.length > 0) {
                    redshiftSummary.taggedAssets++;
                } else {
                    redshiftSummary.untaggedAssets++;
                }
            }
        } while (nextToken);
    }

    return redshiftSummary;
}
