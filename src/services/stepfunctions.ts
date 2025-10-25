import {
    SFNClient,
    ListStateMachinesCommand,
    ListTagsForResourceCommand
} from "@aws-sdk/client-sfn";
import { AwsAccountConfig, Summary } from "../interfaces.js";

export async function getStepFunctionsSummary(account: AwsAccountConfig, regions: string[]): Promise<Summary> {
    const stepFunctionsSummary: Summary = {
        count: 0,
        taggedAssets: 0,
        untaggedAssets: 0,
    };

    for (const region of regions) {
        account.region = region;
        let nextToken: string | undefined;

        do {
            const client = new SFNClient(account);
            const command = new ListStateMachinesCommand({ nextToken: nextToken });
            const res = await client.send(command);
            nextToken = res.nextToken;

            if (!res.stateMachines) {
                continue;
            }

            for (const stateMachine of res.stateMachines) {
                stepFunctionsSummary.count++;

                try {
                    const tagsCommand = new ListTagsForResourceCommand({
                        resourceArn: stateMachine.stateMachineArn
                    });
                    const tagsRes = await client.send(tagsCommand);

                    if (tagsRes.tags && tagsRes.tags.length > 0) {
                        stepFunctionsSummary.taggedAssets++;
                    } else {
                        stepFunctionsSummary.untaggedAssets++;
                    }
                } catch (err) {
                    // If we can't fetch tags, count as untagged
                    stepFunctionsSummary.untaggedAssets++;
                }
            }
        } while (nextToken);
    }

    return stepFunctionsSummary;
}
