import {
    DescribeInstancesCommand,
    DescribeInstancesCommandOutput,
    EC2Client
} from "@aws-sdk/client-ec2";
import { AwsAccountConfig, Summary } from "../interfaces.js";

export async function getEc2Summary(account: AwsAccountConfig, regions: string[]): Promise<Summary> {
    const ec2Summary: Summary = {
        count: 0,
        taggedAssets: 0,
        untaggedAssets: 0,
    };

    for (const region of regions) {
        account.region = region;
        let nextToken: string | undefined;
        do {
            const client = new EC2Client(account);
            const command = new DescribeInstancesCommand({NextToken: nextToken});
            const res: DescribeInstancesCommandOutput = await client.send(command);
            nextToken = res.NextToken;
            for (const instance of res.Reservations.flatMap(reservation => reservation.Instances)) {
                ec2Summary.count++;
                if (instance.Tags) {
                    ec2Summary.taggedAssets++;
                } else {
                    ec2Summary.untaggedAssets++;
                }
            }
        } while (nextToken);
    }

    return ec2Summary;
}
