import { GetBucketLocationCommand, GetBucketTaggingCommand, ListBucketsCommand, S3Client, Tag } from "@aws-sdk/client-s3";
import { AwsAccountConfig, Summary } from "../interfaces.js";

export async function getS3Summary(account: AwsAccountConfig): Promise<Summary> {
    const s3Summary: Summary = {
        count: 0,
        taggedAssets: 0,
        untaggedAssets: 0,
    };

    // Use endpoint from environment variable if set
    // S3 is a global service - ListBuckets should always use us-east-1
    // Note: account.region may be set by other services, so we ignore it for S3
    const region = 'us-east-1';

    const s3Config: any = {
        credentials: account.credentials,
        region: region
    };

    const s3Endpoint = process.env.AWS_ENDPOINT_URL_S3;

    if (s3Endpoint) {
        s3Config.endpoint = s3Endpoint;
        s3Config.forcePathStyle = true; // Required for moto
    }

    const s3Client = new S3Client(s3Config);
    const command = new ListBucketsCommand({});
    const response = await s3Client.send(command);

    const buckets = response.Buckets || [];
    for (const bucket of buckets) {
        s3Summary.count++;

        try {
            const locationCommand = new GetBucketLocationCommand({Bucket: bucket.Name});
            const {LocationConstraint} = await s3Client.send(locationCommand);

            const bucketRegion = LocationConstraint || 'us-east-1';

            // Use same endpoint configuration for bucket region client
            const bucketRegionConfig: any = {
                credentials: account.credentials,
                region: bucketRegion
            };
            if (process.env.AWS_ENDPOINT_URL_S3) {
                bucketRegionConfig.endpoint = process.env.AWS_ENDPOINT_URL_S3;
                bucketRegionConfig.forcePathStyle = true;
            }

            const bucketRegionClient = new S3Client(bucketRegionConfig);
            const tagSet = await getS3Tags(bucketRegionClient, bucket.Name);
            if (tagSet.length > 0) {
                s3Summary.taggedAssets++;
            } else {
                s3Summary.untaggedAssets++;
            }
        } catch (err) {
            console.log(`S3: Error processing bucket ${bucket.Name}: ${err.message}`);
            // Count bucket but mark as untagged if we can't get tags
            s3Summary.untaggedAssets++;
        }
    }

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
