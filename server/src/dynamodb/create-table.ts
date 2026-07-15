import {
  CreateTableCommand,
  DescribeTableCommand,
  DynamoDBClient,
  DynamoDBClientConfig,
  ResourceInUseException,
  waitUntilTableExists,
} from "@aws-sdk/client-dynamodb";

import { loadConfig } from "../config.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({
  path: path.resolve(currentDirectory, "../../../.env"),
});

const config = loadConfig();

const clientConfig: DynamoDBClientConfig = {
  region: config.awsRegion,
};

if (config.dynamoDbEndpoint !== undefined) {
  clientConfig.endpoint = config.dynamoDbEndpoint;
  clientConfig.credentials = {
    accessKeyId: "local",
    secretAccessKey: "local",
  };
}

const client = new DynamoDBClient(clientConfig);

async function createTable(): Promise<void> {
  try {
    await client.send(
      new CreateTableCommand({
        TableName: config.dynamoDbTableName,
        AttributeDefinitions: [
          {
            AttributeName: "id",
            AttributeType: "S",
          },
        ],
        KeySchema: [
          {
            AttributeName: "id",
            KeyType: "HASH",
          },
        ],
        BillingMode: "PAY_PER_REQUEST",
      }),
    );

    await waitUntilTableExists(
      {
        client,
        maxWaitTime: 30,
      },
      {
        TableName: config.dynamoDbTableName,
      },
    );

    console.log(
      `Created DynamoDB table: ${config.dynamoDbTableName}`,
    );
  } catch (error) {
    if (
      error instanceof ResourceInUseException ||
      isTableAlreadyExists(error)
    ) {
      await client.send(
        new DescribeTableCommand({
          TableName: config.dynamoDbTableName,
        }),
      );

      console.log(
        `DynamoDB table already exists: ${config.dynamoDbTableName}`,
      );

      return;
    }

    throw error;
  }
}

function isTableAlreadyExists(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "ResourceInUseException"
  );
}

createTable()
  .catch((error: unknown) => {
    console.error("Unable to create DynamoDB table:", error);
    process.exitCode = 1;
  })
  .finally(() => {
    client.destroy();
  });