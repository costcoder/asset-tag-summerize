# Assets Scanner
Tool that scans multiple AWS accounts, summarizes asset counts per service, and provides an overall breakdown of total assets, tagged assets, and untagged assets.

If you find this package useful hit the star with <3

## Installation
```npm install -g @costcode/atsum```

## Usage
```atsum [--config-file <path to config file>]```

Uses ~/.aws/credentials file or other configuration file that passed through command line --config-file.  

Configuration file should be in the following format:
```
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

.
.
.
```

## Sample Output

```
 Using config file: ./credentials
 Reading DynamoDB...
 Reading Lambda...
 Reading RDS...
 Reading S3...
 Reading EC2...
 Summary
 ========
 {
   "totalAssets": 10,
   "totalTaggedAssets": 4,
   "totalUntaggedAssets": 6,
   "accountSummary": {
     "<Account ID>": {
       "totalAssets": 10,
       "totalTaggedAssets": 4,
       "totalUntaggedAssets": 6,
       "accountId": "<Account ID>",
       "servicesSummary": {
         "dynamodb": {
           "count": 1,
           "taggedAssets": 1,
           "untaggedAssets": 0
         },
         "lambda": {
           "count": 1,
           "taggedAssets": 1,
           "untaggedAssets": 0
         },
         "rds": {
           "count": 1,
           "taggedAssets": 1,
           "untaggedAssets": 0
         },
         "ec2": {
           "count": 1,
           "taggedAssets": 1,
           "untaggedAssets": 0
         }
       },
       "s3": {
         "count": 6,
         "taggedAssets": 0,
         "untaggedAssets": 6
       }
     }
   }
 }
```
## Troubleshooting
If you get error during running, mostly the reason is that you don't have permissions to read the resources.  
i.e. ```is not authorized to perform: lambda:ListTags on resource: arn:aws:lambda:us-east-1:```  
Make sure the set the required permission for all resources of that type (Lambda)  
You can set policy of read-only access for all resources (suggested),  
or you can use this minimalistic policy:
```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "Statement1",
            "Effect": "Allow",
            "Action": [
                "ec2:DescribeRegions",
                "s3:ListAllMyBuckets",
                "s3:GetBucketLocation",
                "s3:GetBucketTagging",
                "ec2:DescribeInstances",
                "rds:DescribeDBInstances",
                "lambda:ListFunctions",
                "lambda:ListTags",
                "dynamodb:ListTables",
                "dynamodb:ListTagsOfResource",
                "cloudfront:ListDistributions",
                "route53:ListHostedZones",
                "apigateway:GET",
                "autoscaling:DescribeAutoScalingGroups",
                "ecs:ListClusters",
                "ecr:DescribeRepositories",
                "elasticmapreduce:ListClusters",
                "elasticache:DescribeCacheClusters",
                "redshift:DescribeClusters",
                "SNS:ListTopics",
                "sqs:listqueues",
                "states:ListStateMachines",
                "codebuild:ListProjects",
                "codedeploy:ListApplications",
                "codepipeline:ListPipelines",
                "logs:DescribeLogGroups",
                "backup:ListBackupVaults",
                "kms:ListKeys",
                "acm:ListCertificates",
                "workspaces:DescribeWorkspaces"
            ],
            "Resource": [
                "*"
            ]
        }
    ]
}
```