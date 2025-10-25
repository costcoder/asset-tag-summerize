export interface CliArg {
    [key: string]: string;
}

export interface Configuration {
    accessKeyId: string;
    secretAccessKey: string;
}

export interface AwsAccountConfig {
    credentials: {
        accessKeyId: string;
        secretAccessKey: string;
    },
    region?: string

}

export interface Summary {
    count: number;
    taggedAssets: number;
    untaggedAssets: number;
}

export interface ServiceError {
    service: string;
    error: string;
    message: string;
    timestamp: string;
}

export interface AccountServicesSummary {
    totalAssets: number;
    totalTaggedAssets: number;
    totalUntaggedAssets: number;
    accountId: string;
    servicesSummary: {
        [service: string]: Summary;
    };
    errors?: ServiceError[];
}

export interface AwsTotalSummary {
    totalAssets: number;
    totalTaggedAssets: number;
    totalUntaggedAssets: number;
    accountSummary: {
        [account: string]: AccountServicesSummary;
    }

}