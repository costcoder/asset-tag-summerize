import {
    ElasticBeanstalkClient,
    DescribeEnvironmentsCommand,
    ListTagsForResourceCommand
} from "@aws-sdk/client-elastic-beanstalk";
import { AwsAccountConfig, Summary } from "../interfaces.js";

export async function getElasticBeanstalkSummary(account: AwsAccountConfig, regions: string[]): Promise<Summary> {
    const elasticBeanstalkSummary: Summary = {
        count: 0,
        taggedAssets: 0,
        untaggedAssets: 0,
    };

    for (const region of regions) {
        account.region = region;
        let nextToken: string | undefined;

        do {
            const client = new ElasticBeanstalkClient(account);
            const command = new DescribeEnvironmentsCommand({ NextToken: nextToken });
            const res = await client.send(command);
            nextToken = res.NextToken;

            if (!res.Environments) {
                continue;
            }

            for (const environment of res.Environments) {
                elasticBeanstalkSummary.count++;

                try {
                    const tagsCommand = new ListTagsForResourceCommand({
                        ResourceArn: environment.EnvironmentArn
                    });
                    const tagsRes = await client.send(tagsCommand);

                    if (tagsRes.ResourceTags && tagsRes.ResourceTags.length > 0) {
                        elasticBeanstalkSummary.taggedAssets++;
                    } else {
                        elasticBeanstalkSummary.untaggedAssets++;
                    }
                } catch (err) {
                    // If we can't fetch tags, count as untagged
                    elasticBeanstalkSummary.untaggedAssets++;
                }
            }
        } while (nextToken);
    }

    return elasticBeanstalkSummary;
}
