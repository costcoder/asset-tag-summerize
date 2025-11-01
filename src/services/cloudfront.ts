import {
    CloudFrontClient,
    ListDistributionsCommand,
    ListTagsForResourceCommand
} from "@aws-sdk/client-cloudfront";
import { AwsAccountConfig, Summary } from "../interfaces.js";

export async function getCloudFrontSummary(account: AwsAccountConfig): Promise<Summary> {
    const cloudFrontSummary: Summary = {
        count: 0,
        taggedAssets: 0,
        untaggedAssets: 0,
    };

    // CloudFront is a global service, only available in us-east-1
    // Create local config to avoid modifying shared account object
    const cloudFrontConfig: AwsAccountConfig = {
        credentials: account.credentials,
        region: 'us-east-1'
    };

    const client = new CloudFrontClient(cloudFrontConfig);
    let nextToken: string | undefined;

    do {
        const command = new ListDistributionsCommand({ Marker: nextToken });
        const res = await client.send(command);
        nextToken = res.DistributionList?.NextMarker;

        if (!res.DistributionList?.Items) {
            continue;
        }

        for (const distribution of res.DistributionList.Items) {
            cloudFrontSummary.count++;

            try {
                const tagsCommand = new ListTagsForResourceCommand({
                    Resource: distribution.ARN
                });
                const tagsRes = await client.send(tagsCommand);

                if (tagsRes.Tags?.Items && tagsRes.Tags.Items.length > 0) {
                    cloudFrontSummary.taggedAssets++;
                } else {
                    cloudFrontSummary.untaggedAssets++;
                }
            } catch (err) {
                // If we can't fetch tags, count as untagged
                cloudFrontSummary.untaggedAssets++;
            }
        }
    } while (nextToken);

    return cloudFrontSummary;
}
