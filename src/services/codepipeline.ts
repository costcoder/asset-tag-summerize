import {
    CodePipelineClient,
    ListPipelinesCommand,
    ListTagsForResourceCommand,
    GetPipelineCommand
} from "@aws-sdk/client-codepipeline";
import { AwsAccountConfig, Summary } from "../interfaces.js";

export async function getCodePipelineSummary(account: AwsAccountConfig, regions: string[], accountId: string): Promise<Summary> {
    const codePipelineSummary: Summary = {
        count: 0,
        taggedAssets: 0,
        untaggedAssets: 0,
    };

    for (const region of regions) {
        account.region = region;
        let nextToken: string | undefined;

        do {
            const client = new CodePipelineClient(account);
            const command = new ListPipelinesCommand({ nextToken: nextToken });
            const res = await client.send(command);
            nextToken = res.nextToken;

            if (!res.pipelines) {
                continue;
            }

            for (const pipeline of res.pipelines) {
                codePipelineSummary.count++;

                try {
                    // Build pipeline ARN
                    const pipelineArn = `arn:aws:codepipeline:${region}:${accountId}:${pipeline.name}`;
                    const tagsCommand = new ListTagsForResourceCommand({
                        resourceArn: pipelineArn
                    });
                    const tagsRes = await client.send(tagsCommand);

                    if (tagsRes.tags && tagsRes.tags.length > 0) {
                        codePipelineSummary.taggedAssets++;
                    } else {
                        codePipelineSummary.untaggedAssets++;
                    }
                } catch (err) {
                    // If we can't fetch tags, count as untagged
                    codePipelineSummary.untaggedAssets++;
                }
            }
        } while (nextToken);
    }

    return codePipelineSummary;
}
