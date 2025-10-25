import {
    Route53Client,
    ListHostedZonesCommand,
    ListTagsForResourceCommand
} from "@aws-sdk/client-route-53";
import { AwsAccountConfig, Summary } from "../interfaces.js";

export async function getRoute53Summary(account: AwsAccountConfig): Promise<Summary> {
    const route53Summary: Summary = {
        count: 0,
        taggedAssets: 0,
        untaggedAssets: 0,
    };

    // Route53 is a global service, only available in us-east-1
    // Create local config to avoid modifying shared account object
    const route53Config: AwsAccountConfig = {
        credentials: account.credentials,
        region: 'us-east-1'
    };

    const client = new Route53Client(route53Config);
    let nextToken: string | undefined;

    do {
        const command = new ListHostedZonesCommand({ Marker: nextToken });
        const res = await client.send(command);
        nextToken = res.NextMarker;

        if (!res.HostedZones) {
            continue;
        }

        for (const zone of res.HostedZones) {
            route53Summary.count++;

            try {
                // Extract the hosted zone ID (remove /hostedzone/ prefix)
                const zoneId = zone.Id.replace('/hostedzone/', '');

                const tagsCommand = new ListTagsForResourceCommand({
                    ResourceType: 'hostedzone',
                    ResourceId: zoneId
                });
                const tagsRes = await client.send(tagsCommand);

                if (tagsRes.ResourceTagSet?.Tags && tagsRes.ResourceTagSet.Tags.length > 0) {
                    route53Summary.taggedAssets++;
                } else {
                    route53Summary.untaggedAssets++;
                }
            } catch (err) {
                // If we can't fetch tags, count as untagged
                route53Summary.untaggedAssets++;
            }
        }
    } while (nextToken);

    return route53Summary;
}
