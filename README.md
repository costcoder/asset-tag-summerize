# Asset Tag Summerize
Tool that scans multiple AWS accounts, summarizes asset counts per service, reports how many tags each service has, and provides an overall breakdown of total assets, tagged assets, and untagged assets.

If you find this package useful hit the star with <3

## Installation
```npm install -g @costcoder/atsum```

## Usage
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