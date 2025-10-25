import {
    APIGatewayClient,
    GetRestApisCommand,
    GetTagsCommand
} from "@aws-sdk/client-api-gateway";
import { AwsAccountConfig, Summary } from "../interfaces.js";

export async function getApiGatewaySummary(account: AwsAccountConfig, regions: string[]): Promise<Summary> {
    const apiGatewaySummary: Summary = {
        count: 0,
        taggedAssets: 0,
        untaggedAssets: 0,
    };

    for (const region of regions) {
        account.region = region;
        let nextToken: string | undefined;

        do {
            const client = new APIGatewayClient(account);
            const command = new GetRestApisCommand({ position: nextToken });
            const res = await client.send(command);
            nextToken = res.position;

            if (!res.items) {
                continue;
            }

            for (const api of res.items) {
                apiGatewaySummary.count++;

                try {
                    const tagsCommand = new GetTagsCommand({
                        resourceArn: `arn:aws:apigateway:${region}::/restapis/${api.id}`
                    });
                    const tagsRes = await client.send(tagsCommand);

                    if (tagsRes.tags && Object.keys(tagsRes.tags).length > 0) {
                        apiGatewaySummary.taggedAssets++;
                    } else {
                        apiGatewaySummary.untaggedAssets++;
                    }
                } catch (err) {
                    // If we can't fetch tags, count as untagged
                    apiGatewaySummary.untaggedAssets++;
                }
            }
        } while (nextToken);
    }

    return apiGatewaySummary;
}
