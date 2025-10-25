import { GetBucketLocationCommand, GetBucketTaggingCommand, ListBucketsCommand, S3Client, Tag } from "@aws-sdk/client-s3";
import { AwsAccountConfig, Summary } from "../interfaces.js";

export async function getS3Summary(account: AwsAccountConfig): Promise<Summary> {
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
