import {
    CloudTrailClient,
    DescribeTrailsCommand,
    ListTagsCommand
} from "@aws-sdk/client-cloudtrail";
import { AwsAccountConfig, Summary } from "../interfaces.js";

export async function getCloudTrailSummary(account: AwsAccountConfig): Promise<Summary> {
    const cloudTrailSummary: Summary = {
        count: 0,
        taggedAssets: 0,
        untaggedAssets: 0,
    };

    // CloudTrail is a global service, only available in us-east-1
    // Create local config to avoid modifying shared account object
    const cloudTrailConfig: AwsAccountConfig = {
        credentials: account.credentials,
        region: 'us-east-1'
    };

    const client = new CloudTrailClient(cloudTrailConfig);

    try {
        const command = new DescribeTrailsCommand({});
        const res = await client.send(command);

        if (!res.trailList) {
            return cloudTrailSummary;
        }

        cloudTrailSummary.count = res.trailList.length;

        // Get trail ARNs for tag fetching
        const trailArns = res.trailList
            .map(trail => trail.TrailARN)
            .filter(arn => arn !== undefined);

        if (trailArns.length > 0) {
            try {
                const tagsCommand = new ListTagsCommand({
                    ResourceIdList: trailArns
                });
                const tagsRes = await client.send(tagsCommand);

                if (tagsRes.ResourceTagList) {
                    for (const resourceTag of tagsRes.ResourceTagList) {
                        if (resourceTag.TagsList && resourceTag.TagsList.length > 0) {
                            cloudTrailSummary.taggedAssets++;
                        } else {
                            cloudTrailSummary.untaggedAssets++;
                        }
                    }
                }
            } catch (err) {
                // If we can't fetch tags, count all as untagged
                cloudTrailSummary.untaggedAssets = cloudTrailSummary.count;
            }
        }
    } catch (err) {
        // Return empty summary on error
    }

    return cloudTrailSummary;
}
