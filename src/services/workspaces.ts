import {
    WorkSpacesClient,
    DescribeWorkspacesCommand,
    DescribeTagsCommand
} from "@aws-sdk/client-workspaces";
import { AwsAccountConfig, Summary } from "../interfaces.js";

export async function getWorkSpacesSummary(account: AwsAccountConfig, regions: string[]): Promise<Summary> {
    const workSpacesSummary: Summary = {
        count: 0,
        taggedAssets: 0,
        untaggedAssets: 0,
    };

    for (const region of regions) {
        account.region = region;
        let nextToken: string | undefined;

        do {
            const client = new WorkSpacesClient(account);
            const command = new DescribeWorkspacesCommand({ NextToken: nextToken });
            const res = await client.send(command);
            nextToken = res.NextToken;

            if (!res.Workspaces) {
                continue;
            }

            for (const workspace of res.Workspaces) {
                workSpacesSummary.count++;

                try {
                    const tagsCommand = new DescribeTagsCommand({
                        ResourceId: workspace.WorkspaceId
                    });
                    const tagsRes = await client.send(tagsCommand);

                    if (tagsRes.TagList && tagsRes.TagList.length > 0) {
                        workSpacesSummary.taggedAssets++;
                    } else {
                        workSpacesSummary.untaggedAssets++;
                    }
                } catch (err) {
                    // If we can't fetch tags, count as untagged
                    workSpacesSummary.untaggedAssets++;
                }
            }
        } while (nextToken);
    }

    return workSpacesSummary;
}
