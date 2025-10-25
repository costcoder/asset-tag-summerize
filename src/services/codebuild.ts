import {
    CodeBuildClient,
    ListProjectsCommand,
    BatchGetProjectsCommand
} from "@aws-sdk/client-codebuild";
import { AwsAccountConfig, Summary } from "../interfaces.js";

export async function getCodeBuildSummary(account: AwsAccountConfig, regions: string[]): Promise<Summary> {
    const codeBuildSummary: Summary = {
        count: 0,
        taggedAssets: 0,
        untaggedAssets: 0,
    };

    for (const region of regions) {
        account.region = region;
        let nextToken: string | undefined;

        do {
            const client = new CodeBuildClient(account);
            const command = new ListProjectsCommand({ nextToken: nextToken });
            const res = await client.send(command);
            nextToken = res.nextToken;

            if (!res.projects || res.projects.length === 0) {
                continue;
            }

            try {
                // Get project details including tags
                const batchCommand = new BatchGetProjectsCommand({
                    names: res.projects
                });
                const batchRes = await client.send(batchCommand);

                if (batchRes.projects) {
                    for (const project of batchRes.projects) {
                        codeBuildSummary.count++;

                        if (project.tags && project.tags.length > 0) {
                            codeBuildSummary.taggedAssets++;
                        } else {
                            codeBuildSummary.untaggedAssets++;
                        }
                    }
                }
            } catch (err) {
                // If we can't fetch project details, count all as untagged
                codeBuildSummary.count += res.projects.length;
                codeBuildSummary.untaggedAssets += res.projects.length;
            }
        } while (nextToken);
    }

    return codeBuildSummary;
}
