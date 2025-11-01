import { DescribeRegionsCommand, EC2Client } from "@aws-sdk/client-ec2";
import { AccountServicesSummary, AwsAccountConfig, Configuration, Summary, ServiceError } from "./interfaces.js";
import { GetCallerIdentityCommand, STSClient } from "@aws-sdk/client-sts";

// Original services
import { getEc2Summary } from "./services/ec2.js";
import { getS3Summary } from "./services/s3.js";
import { getRdsSummary } from "./services/rds.js";
import { getLambdaSummary } from "./services/lambda.js";
import { getDynamoDBSummary } from "./services/dynamodb.js";

// Networking & Content Delivery
import { getCloudFrontSummary } from "./services/cloudfront.js";
import { getRoute53Summary } from "./services/route53.js";
import { getApiGatewaySummary } from "./services/apigateway.js";

// Compute & Containers
import { getAutoScalingSummary } from "./services/autoscaling.js";
import { getElasticBeanstalkSummary } from "./services/elasticbeanstalk.js";
import { getEcsSummary } from "./services/ecs.js";
import { getEcrSummary } from "./services/ecr.js";
import { getEmrSummary } from "./services/emr.js";

// Storage & Databases
import { getElastiCacheSummary } from "./services/elasticache.js";
import { getRedshiftSummary } from "./services/redshift.js";

// Application Integration
import { getSnsSummary } from "./services/sns.js";
import { getSqsSummary } from "./services/sqs.js";
import { getStepFunctionsSummary } from "./services/stepfunctions.js";

// Developer Tools
import { getCodeBuildSummary } from "./services/codebuild.js";
import { getCodeDeploySummary } from "./services/codedeploy.js";
import { getCodePipelineSummary } from "./services/codepipeline.js";

// Management & Governance
import { getCloudWatchLogsSummary } from "./services/cloudwatchlogs.js";
import { getCloudTrailSummary } from "./services/cloudtrail.js";
import { getBackupSummary } from "./services/backup.js";

// Security & Identity
import { getKmsSummary } from "./services/kms.js";
import { getAcmSummary } from "./services/acm.js";

// End User Computing
import { getWorkSpacesSummary } from "./services/workspaces.js";

export async function getAccountSummary(credentials: Configuration): Promise<AccountServicesSummary> {
    const accountServicesSummary: AccountServicesSummary = {
        totalAssets: 0,
        totalTaggedAssets: 0,
        totalUntaggedAssets: 0,
        accountId: '',
        servicesSummary: {},
        errors: [],
    }
    const account: AwsAccountConfig = {
        credentials,
    };

    const regions = await getRegions(account);
    const accountId = await getAccountId(account);
    accountServicesSummary.accountId = accountId;

    // Original Services
    await scanService('DynamoDB', async () => {
        const summary = await getDynamoDBSummary(account, regions, accountId);
        updateSummary(accountServicesSummary, 'dynamodb', summary);
    }, accountServicesSummary);

    await scanService('Lambda', async () => {
        const summary = await getLambdaSummary(account, regions);
        updateSummary(accountServicesSummary, 'lambda', summary);
    }, accountServicesSummary);

    await scanService('RDS', async () => {
        const summary = await getRdsSummary(account, regions);
        updateSummary(accountServicesSummary, 'rds', summary);
    }, accountServicesSummary);

    await scanService('S3', async () => {
        const summary = await getS3Summary(account);
        updateSummary(accountServicesSummary, 's3', summary);
    }, accountServicesSummary);

    await scanService('EC2', async () => {
        const summary = await getEc2Summary(account, regions);
        updateSummary(accountServicesSummary, 'ec2', summary);
    }, accountServicesSummary);

    // Networking & Content Delivery
    await scanService('CloudFront', async () => {
        const summary = await getCloudFrontSummary(account);
        updateSummary(accountServicesSummary, 'cloudfront', summary);
    }, accountServicesSummary);

    await scanService('Route53', async () => {
        const summary = await getRoute53Summary(account);
        updateSummary(accountServicesSummary, 'route53', summary);
    }, accountServicesSummary);

    await scanService('API Gateway', async () => {
        const summary = await getApiGatewaySummary(account, regions);
        updateSummary(accountServicesSummary, 'apigateway', summary);
    }, accountServicesSummary);

    // Compute & Containers
    await scanService('Auto Scaling', async () => {
        const summary = await getAutoScalingSummary(account, regions);
        updateSummary(accountServicesSummary, 'autoscaling', summary);
    }, accountServicesSummary);

    await scanService('Elastic Beanstalk', async () => {
        const summary = await getElasticBeanstalkSummary(account, regions);
        updateSummary(accountServicesSummary, 'elasticbeanstalk', summary);
    }, accountServicesSummary);

    await scanService('ECS', async () => {
        const summary = await getEcsSummary(account, regions);
        updateSummary(accountServicesSummary, 'ecs', summary);
    }, accountServicesSummary);

    await scanService('ECR', async () => {
        const summary = await getEcrSummary(account, regions);
        updateSummary(accountServicesSummary, 'ecr', summary);
    }, accountServicesSummary);

    await scanService('EMR', async () => {
        const summary = await getEmrSummary(account, regions);
        updateSummary(accountServicesSummary, 'emr', summary);
    }, accountServicesSummary);

    // Storage & Databases
    await scanService('ElastiCache', async () => {
        const summary = await getElastiCacheSummary(account, regions, accountId);
        updateSummary(accountServicesSummary, 'elasticache', summary);
    }, accountServicesSummary);

    await scanService('Redshift', async () => {
        const summary = await getRedshiftSummary(account, regions);
        updateSummary(accountServicesSummary, 'redshift', summary);
    }, accountServicesSummary);

    // Application Integration
    await scanService('SNS', async () => {
        const summary = await getSnsSummary(account, regions);
        updateSummary(accountServicesSummary, 'sns', summary);
    }, accountServicesSummary);

    await scanService('SQS', async () => {
        const summary = await getSqsSummary(account, regions);
        updateSummary(accountServicesSummary, 'sqs', summary);
    }, accountServicesSummary);

    await scanService('Step Functions', async () => {
        const summary = await getStepFunctionsSummary(account, regions);
        updateSummary(accountServicesSummary, 'stepfunctions', summary);
    }, accountServicesSummary);

    // Developer Tools
    await scanService('CodeBuild', async () => {
        const summary = await getCodeBuildSummary(account, regions);
        updateSummary(accountServicesSummary, 'codebuild', summary);
    }, accountServicesSummary);

    await scanService('CodeDeploy', async () => {
        const summary = await getCodeDeploySummary(account, regions, accountId);
        updateSummary(accountServicesSummary, 'codedeploy', summary);
    }, accountServicesSummary);

    await scanService('CodePipeline', async () => {
        const summary = await getCodePipelineSummary(account, regions, accountId);
        updateSummary(accountServicesSummary, 'codepipeline', summary);
    }, accountServicesSummary);

    // Management & Governance
    await scanService('CloudWatch Logs', async () => {
        const summary = await getCloudWatchLogsSummary(account, regions);
        updateSummary(accountServicesSummary, 'cloudwatchlogs', summary);
    }, accountServicesSummary);

    await scanService('CloudTrail', async () => {
        const summary = await getCloudTrailSummary(account);
        updateSummary(accountServicesSummary, 'cloudtrail', summary);
    }, accountServicesSummary);

    await scanService('Backup', async () => {
        const summary = await getBackupSummary(account, regions);
        updateSummary(accountServicesSummary, 'backup', summary);
    }, accountServicesSummary);

    // Security & Identity
    await scanService('KMS', async () => {
        const summary = await getKmsSummary(account, regions);
        updateSummary(accountServicesSummary, 'kms', summary);
    }, accountServicesSummary);

    await scanService('ACM', async () => {
        const summary = await getAcmSummary(account, regions);
        updateSummary(accountServicesSummary, 'acm', summary);
    }, accountServicesSummary);

    // End User Computing
    await scanService('WorkSpaces', async () => {
        const summary = await getWorkSpacesSummary(account, regions);
        updateSummary(accountServicesSummary, 'workspaces', summary);
    }, accountServicesSummary);

    return accountServicesSummary;
}

// Helper function to scan a service with error handling
async function scanService(
    serviceName: string,
    scanFn: () => Promise<void>,
    accountSummary: AccountServicesSummary,
    allowedErrors: string[] = []
): Promise<void> {
    try {
        console.log(`Reading ${serviceName}...`);
        await scanFn();
        console.log(`✓ ${serviceName} scanned successfully`);
    } catch (e) {
        const errorMessage = e.message || 'Unknown error';
        const errorName = e.name || 'Error';

        // Log error to console
        console.error(`✗ ${serviceName} failed: ${errorMessage}`);

        // Track error in results
        const serviceError: ServiceError = {
            service: serviceName,
            error: errorName,
            message: errorMessage,
            timestamp: new Date().toISOString(),
        };

        accountSummary.errors.push(serviceError);

        // Continue execution - don't throw
    }
}

// Helper function to update account summary
function updateSummary(
    accountSummary: AccountServicesSummary,
    serviceKey: string,
    serviceSummary: Summary
): void {
    accountSummary.totalAssets += serviceSummary.count;
    accountSummary.totalTaggedAssets += serviceSummary.taggedAssets;
    accountSummary.totalUntaggedAssets += serviceSummary.untaggedAssets;
    accountSummary.servicesSummary[serviceKey] = serviceSummary;
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
