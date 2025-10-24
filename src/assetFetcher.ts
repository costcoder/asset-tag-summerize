import {
    DescribeInstancesCommand,
    DescribeInstancesCommandOutput,
    DescribeRegionsCommand,
    EC2Client
} from "@aws-sdk/client-ec2";
import {AccountServicesSummary, AwsAccountConfig, Configuration, Summary} from "./interfaces";
import {GetBucketLocationCommand, GetBucketTaggingCommand, ListBucketsCommand, S3Client, Tag} from "@aws-sdk/client-s3";
import {GetCallerIdentityCommand, STSClient} from "@aws-sdk/client-sts";
import {DescribeDBInstancesCommand, RDSClient} from "@aws-sdk/client-rds";
import {LambdaClient, ListFunctionsCommand, ListTagsCommand, ListTagsCommandOutput} from "@aws-sdk/client-lambda";
import {
    DynamoDBClient,
    ListTablesCommand,
    ListTagsOfResourceCommand,
    ListTagsOfResourceCommandOutput
} from "@aws-sdk/client-dynamodb";

export async function getAccountSummary(credentials: Configuration): Promise<AccountServicesSummary> {
    const accountServicesSummary: AccountServicesSummary = {
        totalAssets: 0,
        totalTaggedAssets: 0,
        totalUntaggedAssets: 0,
        accountId: '',
        servicesSummary: {},
    }
    const account: AwsAccountConfig = {
        credentials,
    };

    const regions = await getRegions(account);

    const accountId = await getAccountId(account);

    try {
        console.log('Reading DynamoDB...');
        const dynamodbSummary: Summary = await getDynamoDBSummary(account, regions, accountId);
        accountServicesSummary.totalAssets += dynamodbSummary.count;
        accountServicesSummary.totalTaggedAssets += dynamodbSummary.taggedAssets;
        accountServicesSummary.totalUntaggedAssets += dynamodbSummary.untaggedAssets;
        accountServicesSummary.servicesSummary['dynamodb'] = dynamodbSummary;
    } catch (e) {
        if (e.name == "AccessDeniedException") {
            console.log(e.message);
            console.log('Skipping DynamoDB');
        } else {
            throw e;
        }
    }

    try {
        console.log('Reading Lambda...');
        const lambdaSummary: Summary = await getLambdaSummary(account, regions, accountId);
        accountServicesSummary.totalAssets += lambdaSummary.count;
        accountServicesSummary.totalTaggedAssets += lambdaSummary.taggedAssets;
        accountServicesSummary.totalUntaggedAssets += lambdaSummary.untaggedAssets;
        accountServicesSummary.servicesSummary['lambda'] = lambdaSummary;
    } catch (e) {
        if (e.name == "AccessDeniedException") {
            console.log(e.message);
            console.log('Skipping Lambda');
        } else {
            throw e;
        }
    }

    try {
        console.log('Reading RDS...');
        const rdsSummary: Summary = await getRdsSummary(account, regions);
        accountServicesSummary.totalAssets += rdsSummary.count;
        accountServicesSummary.totalTaggedAssets += rdsSummary.taggedAssets;
        accountServicesSummary.totalUntaggedAssets += rdsSummary.untaggedAssets;
        accountServicesSummary.servicesSummary['rds'] = rdsSummary;
    } catch (e) {
        if (e.name == "AccessDenied") {
            console.log(e.message);
            console.log('Skipping RDS');
        } else {
            throw e;
        }
    }

    try {
        console.log('Reading S3...');
        const s3Summary: Summary = await getS3Summary(account);
        accountServicesSummary.totalAssets += s3Summary.count;
        accountServicesSummary.totalTaggedAssets += s3Summary.taggedAssets;
        accountServicesSummary.totalUntaggedAssets += s3Summary.untaggedAssets;
        accountServicesSummary.accountId = accountId;
        accountServicesSummary['s3'] = s3Summary;
    } catch (e) {
        if (e.name == "AccessDenied") {
            console.log(e.message);
            console.log('Skipping S3');
        } else {
            throw e;
        }
    }

    try {
        console.log('Reading EC2...');
        const ec2Summary: Summary = await getEc2Summary(account, regions);
        accountServicesSummary.totalAssets += ec2Summary.count;
        accountServicesSummary.totalTaggedAssets += ec2Summary.taggedAssets;
        accountServicesSummary.totalUntaggedAssets += ec2Summary.untaggedAssets;
        accountServicesSummary.servicesSummary['ec2'] = ec2Summary;
    } catch (e) {
        if (e.name == "UnauthorizedOperation") {
            console.log(e.message);
            console.log('Skipping EC2');
        } else {
            throw e;
        }
    }

    return accountServicesSummary;
}

async function getAccountId(account: AwsAccountConfig): Promise<string> {
    const client = new STSClient(account);
    const response = await client.send(new GetCallerIdentityCommand({}));
    return response.Account;
}

async function getRegions(account: AwsAccountConfig): Promise<string[]> {
    const client = new EC2Client(account);
    const command = new DescribeRegionsCommand();
    const response = await client.send(command);
    return response.Regions.map(region => region.RegionName);
}

async function getS3Summary(account: AwsAccountConfig): Promise<Summary> {
    const s3Summary: Summary = {
        count: 0,
        taggedAssets: 0,
        untaggedAssets: 0,
    };

    const s3Client = new S3Client(account);
    let nextToken: string | undefined;
    do {
        const command = new ListBucketsCommand({ContinuationToken: nextToken});
        const response = await s3Client.send(command);

        const {Buckets, ContinuationToken} = response;
        nextToken = ContinuationToken;
        for (const bucket of Buckets) {
            s3Summary.count++;
            const locationCommand = new GetBucketLocationCommand({Bucket: bucket.Name});
            const {LocationConstraint} = await s3Client.send(locationCommand);

            const bucketRegion = LocationConstraint || 'us-east-1';
            const bucketRegionClient = new S3Client({credentials: account.credentials, region: bucketRegion});
            const tagSet = await getS3Tags(bucketRegionClient, bucket.Name);
            if (tagSet.length > 0) {
                s3Summary.taggedAssets++;
            } else {
                s3Summary.untaggedAssets++;
            }
        }
    } while (nextToken);

    return s3Summary;
}

async function getS3Tags(client: S3Client, bucketName: string): Promise<Tag[]> {
    const NO_TAGS_ERROR = 'NoSuchTagSet';

    try {
        const {TagSet} = await client.send(new GetBucketTaggingCommand({Bucket: bucketName}));
        return TagSet;
    } catch (err) {
        if (err.name !== NO_TAGS_ERROR) {
            throw new Error(`Failed to get tags for bucket:${bucketName}, ${err}`);
        } else {
            return [];
        }
    }
}

async function getEc2Summary(account: AwsAccountConfig, regions: string[]): Promise<Summary> {
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

async function getRdsSummary(account: AwsAccountConfig, regions: string[]): Promise<Summary> {
    const rdsSummary: Summary = {
        count: 0,
        taggedAssets: 0,
        untaggedAssets: 0,
    };

    for (const region of regions) {
        account.region = region;
        let nextToken: string | undefined;
        do {
            const client = new RDSClient(account);
            const command = new DescribeDBInstancesCommand({Marker: nextToken});
            const res = await client.send(command);
            nextToken = res.Marker;
            for (const instance of res.DBInstances) {
                rdsSummary.count++;
                if (instance.TagList.length > 0) {
                    rdsSummary.taggedAssets++;
                } else {
                    rdsSummary.untaggedAssets++;
                }
            }
        } while (nextToken);
    }

    return rdsSummary;
}

async function getLambdaSummary(account: AwsAccountConfig, regions: string[], accountId: string): Promise<Summary> {
    const lambdaSummary: Summary = {
        count: 0,
        taggedAssets: 0,
        untaggedAssets: 0,
    };
    for (const region of regions) {
        account.region = region;
        let nextToken: string | undefined;

        do {
            const client = new LambdaClient(account);

            const res = await client.send(
                new ListFunctionsCommand({
                    Marker: nextToken,
                })
            );

            if (!res.Functions) {
                continue
            } else {
                lambdaSummary.count += res.Functions.length;
            }

            for (const lambda of res.Functions) {
                const functionArn = getArn(accountId, region, `function:${lambda.FunctionName}`, 'lambda');
                const tagRes: ListTagsCommandOutput = await client.send(new ListTagsCommand({Resource: functionArn}));
                if (tagRes.Tags) {
                    lambdaSummary.taggedAssets++;
                } else {
                    lambdaSummary.untaggedAssets++;
                }
            }
        } while (nextToken);
    }
    return lambdaSummary;
}

async function getDynamoDBSummary(account: AwsAccountConfig, regions: string[], accountId: string): Promise<Summary> {
    const dynamodbSummary: Summary = {
        count: 0,
        taggedAssets: 0,
        untaggedAssets: 0,
    };

    for (const region of regions) {
        account.region = region;
        let nextToken: string | undefined;
        do {
            const client = new DynamoDBClient(account);
            const command = new ListTablesCommand({ExclusiveStartTableName: nextToken,});
            const res = await client.send(command);

            if (!res.TableNames) {
                continue;
            }

            dynamodbSummary.count += res.TableNames.length;
            for (const tableName of res.TableNames) {
                const tableArn = getArn(accountId, region, `table/${tableName}`, 'dynamodb');
                const tagRes: ListTagsOfResourceCommandOutput = await client.send(new ListTagsOfResourceCommand({ResourceArn: tableArn}));
                if (tagRes.Tags) {
                    dynamodbSummary.taggedAssets++;
                } else {
                    dynamodbSummary.untaggedAssets++;
                }
            }
        } while (nextToken);
    }

    return dynamodbSummary;
}

export function getArn(accountId: string, region: string, resourceIdentifier: string, service: string): string {
    return `arn:aws:${service}:${region}:${accountId}:${resourceIdentifier}`;
}
