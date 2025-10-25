import {
    BackupClient,
    ListBackupVaultsCommand,
    ListTagsCommand
} from "@aws-sdk/client-backup";
import { AwsAccountConfig, Summary } from "../interfaces.js";

export async function getBackupSummary(account: AwsAccountConfig, regions: string[]): Promise<Summary> {
    const backupSummary: Summary = {
        count: 0,
        taggedAssets: 0,
        untaggedAssets: 0,
    };

    for (const region of regions) {
        account.region = region;
        let nextToken: string | undefined;

        do {
            const client = new BackupClient(account);
            const command = new ListBackupVaultsCommand({ NextToken: nextToken });
            const res = await client.send(command);
            nextToken = res.NextToken;

            if (!res.BackupVaultList) {
                continue;
            }

            for (const vault of res.BackupVaultList) {
                backupSummary.count++;

                try {
                    const tagsCommand = new ListTagsCommand({
                        ResourceArn: vault.BackupVaultArn
                    });
                    const tagsRes = await client.send(tagsCommand);

                    if (tagsRes.Tags && Object.keys(tagsRes.Tags).length > 0) {
                        backupSummary.taggedAssets++;
                    } else {
                        backupSummary.untaggedAssets++;
                    }
                } catch (err) {
                    // If we can't fetch tags, count as untagged
                    backupSummary.untaggedAssets++;
                }
            }
        } while (nextToken);
    }

    return backupSummary;
}
