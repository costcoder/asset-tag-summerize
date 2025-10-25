import {
    CodeDeployClient,
    ListApplicationsCommand,
    ListTagsForResourceCommand
} from "@aws-sdk/client-codedeploy";
import { AwsAccountConfig, Summary } from "../interfaces.js";

export async function getCodeDeploySummary(account: AwsAccountConfig, regions: string[], accountId: string): Promise<Summary> {
    const codeDeploySummary: Summary = {
        count: 0,
        taggedAssets: 0,
        untaggedAssets: 0,
    };

    for (const region of regions) {
        account.region = region;
        let nextToken: string | undefined;

        do {
            const client = new CodeDeployClient(account);
            const command = new ListApplicationsCommand({ nextToken: nextToken });
            const res = await client.send(command);
            nextToken = res.nextToken;

            if (!res.applications) {
                continue;
            }

            for (const applicationName of res.applications) {
                codeDeploySummary.count++;

                try {
                    // Build ARN for the application
                    const applicationArn = `arn:aws:codedeploy:${region}:${accountId}:application:${applicationName}`;

                    const tagsCommand = new ListTagsForResourceCommand({
                        ResourceArn: applicationArn
                    });
                    const tagsRes = await client.send(tagsCommand);

                    if (tagsRes.Tags && tagsRes.Tags.length > 0) {
                        codeDeploySummary.taggedAssets++;
                    } else {
                        codeDeploySummary.untaggedAssets++;
                    }
                } catch (err) {
                    // If we can't fetch tags, count as untagged
                    codeDeploySummary.untaggedAssets++;
                }
            }
        } while (nextToken);
    }

    return codeDeploySummary;
}
