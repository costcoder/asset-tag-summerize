import {
    AutoScalingClient,
    DescribeAutoScalingGroupsCommand
} from "@aws-sdk/client-auto-scaling";
import { AwsAccountConfig, Summary } from "../interfaces.js";

export async function getAutoScalingSummary(account: AwsAccountConfig, regions: string[]): Promise<Summary> {
    const autoScalingSummary: Summary = {
        count: 0,
        taggedAssets: 0,
        untaggedAssets: 0,
    };

    for (const region of regions) {
        account.region = region;
        let nextToken: string | undefined;

        do {
            const client = new AutoScalingClient(account);
            const command = new DescribeAutoScalingGroupsCommand({ NextToken: nextToken });
            const res = await client.send(command);
            nextToken = res.NextToken;

            if (!res.AutoScalingGroups) {
                continue;
            }

            for (const group of res.AutoScalingGroups) {
                autoScalingSummary.count++;

                if (group.Tags && group.Tags.length > 0) {
                    autoScalingSummary.taggedAssets++;
                } else {
                    autoScalingSummary.untaggedAssets++;
                }
            }
        } while (nextToken);
    }

    return autoScalingSummary;
}
