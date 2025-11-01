import { DescribeDBInstancesCommand, RDSClient } from "@aws-sdk/client-rds";
import { AwsAccountConfig, Summary } from "../interfaces.js";

export async function getRdsSummary(account: AwsAccountConfig, regions: string[]): Promise<Summary> {
    const rdsSummary: Summary = {
        count: 0,
        taggedAssets: 0,
        untaggedAssets: 0,
    };

    for (const region of regions) {
        account.region = region;
        let nextToken: string | undefined;
        do {
            const client = new RDSClient(account);
            const command = new DescribeDBInstancesCommand({Marker: nextToken});
            const res = await client.send(command);
            nextToken = res.Marker;
            for (const instance of res.DBInstances) {
                rdsSummary.count++;
                if (instance.TagList.length > 0) {
                    rdsSummary.taggedAssets++;
                } else {
                    rdsSummary.untaggedAssets++;
                }
            }
        } while (nextToken);
    }

    return rdsSummary;
}
