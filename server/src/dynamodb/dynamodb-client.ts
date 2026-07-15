import {
    DynamoDBClient,
    type DynamoDBClientConfig,
} from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

export type DynamoDbConfig = {
    region: string;
    endpoint?: string | undefined;
};

export function createDynamoDbClient(config: DynamoDbConfig) {
    const clientConfig: DynamoDBClientConfig = {
        region: config.region,
    };

    if (config.endpoint !== undefined) {
        clientConfig.endpoint = config.endpoint;
        clientConfig.credentials = {
            accessKeyId: "local",
            secretAccessKey: "local",
        };
    }

    const baseClient = new DynamoDBClient(clientConfig);

    return DynamoDBDocumentClient.from(baseClient, {
        marshallOptions: {
            removeUndefinedValues: true,
        },
    });
}