import {
    ECRClient,
    DescribeRepositoriesCommand,
    ListTagsForResourceCommand
} from "@aws-sdk/client-ecr";
import { AwsAccountConfig, Summary } from "../interfaces.js";

export async function getEcrSummary(account: AwsAccountConfig, regions: string[]): Promise<Summary> {
    const ecrSummary: Summary = {
        count: 0,
        taggedAssets: 0,
        untaggedAssets: 0,
    };

    for (const region of regions) {
        account.region = region;
        let nextToken: string | undefined;

        do {
            const client = new ECRClient(account);
            const command = new DescribeRepositoriesCommand({ nextToken: nextToken });
            const res = await client.send(command);
            nextToken = res.nextToken;

            if (!res.repositories) {
                continue;
            }

            for (const repository of res.repositories) {
                ecrSummary.count++;

                try {
                    const tagsCommand = new ListTagsForResourceCommand({
                        resourceArn: repository.repositoryArn
                    });
                    const tagsRes = await client.send(tagsCommand);

                    if (tagsRes.tags && tagsRes.tags.length > 0) {
                        ecrSummary.taggedAssets++;
                    } else {
                        ecrSummary.untaggedAssets++;
                    }
                } catch (err) {
                    // If we can't fetch tags, count as untagged
                    ecrSummary.untaggedAssets++;
                }
            }
        } while (nextToken);
    }

    return ecrSummary;
}
