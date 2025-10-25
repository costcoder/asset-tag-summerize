import {
    ACMClient,
    ListCertificatesCommand,
    ListTagsForCertificateCommand
} from "@aws-sdk/client-acm";
import { AwsAccountConfig, Summary } from "../interfaces.js";

export async function getAcmSummary(account: AwsAccountConfig, regions: string[]): Promise<Summary> {
    const acmSummary: Summary = {
        count: 0,
        taggedAssets: 0,
        untaggedAssets: 0,
    };

    for (const region of regions) {
        account.region = region;
        let nextToken: string | undefined;

        do {
            const client = new ACMClient(account);
            const command = new ListCertificatesCommand({ NextToken: nextToken });
            const res = await client.send(command);
            nextToken = res.NextToken;

            if (!res.CertificateSummaryList) {
                continue;
            }

            for (const cert of res.CertificateSummaryList) {
                acmSummary.count++;

                try {
                    const tagsCommand = new ListTagsForCertificateCommand({
                        CertificateArn: cert.CertificateArn
                    });
                    const tagsRes = await client.send(tagsCommand);

                    if (tagsRes.Tags && tagsRes.Tags.length > 0) {
                        acmSummary.taggedAssets++;
                    } else {
                        acmSummary.untaggedAssets++;
                    }
                } catch (err) {
                    // If we can't fetch tags, count as untagged
                    acmSummary.untaggedAssets++;
                }
            }
        } while (nextToken);
    }

    return acmSummary;
}
