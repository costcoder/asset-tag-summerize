import {
    KMSClient,
    ListKeysCommand,
    DescribeKeyCommand,
    ListResourceTagsCommand
} from "@aws-sdk/client-kms";
import { AwsAccountConfig, Summary } from "../interfaces.js";

export async function getKmsSummary(account: AwsAccountConfig, regions: string[]): Promise<Summary> {
    const kmsSummary: Summary = {
        count: 0,
        taggedAssets: 0,
        untaggedAssets: 0,
    };

    for (const region of regions) {
        account.region = region;
        let nextToken: string | undefined;

        do {
            const client = new KMSClient(account);
            const command = new ListKeysCommand({ Marker: nextToken });
            const res = await client.send(command);
            nextToken = res.NextMarker;

            if (!res.Keys) {
                continue;
            }

            for (const key of res.Keys) {
                try {
                    // Describe key to check if it's customer-managed (skip AWS-managed keys)
                    const describeCommand = new DescribeKeyCommand({
                        KeyId: key.KeyId
                    });
                    const describeRes = await client.send(describeCommand);

                    // Only count customer-managed keys
                    if (describeRes.KeyMetadata?.KeyManager === 'CUSTOMER') {
                        kmsSummary.count++;

                        try {
                            const tagsCommand = new ListResourceTagsCommand({
                                KeyId: key.KeyId
                            });
                            const tagsRes = await client.send(tagsCommand);

                            if (tagsRes.Tags && tagsRes.Tags.length > 0) {
                                kmsSummary.taggedAssets++;
                            } else {
                                kmsSummary.untaggedAssets++;
                            }
                        } catch (err) {
                            // If we can't fetch tags, count as untagged
                            kmsSummary.untaggedAssets++;
                        }
                    }
                } catch (err) {
                    // Skip keys we can't describe
                }
            }
        } while (nextToken);
    }

    return kmsSummary;
}
