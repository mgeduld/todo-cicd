import { createApp } from "./app.js";
import { loadConfig } from "./config.js";
import { createDynamoDbClient } from "./dynamodb/dynamodb-client.js";
import { DynamoDbTodoRepository } from "./todos/dynamodb-todo-repository.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({
  path: path.resolve(currentDirectory, "../../.env"),
});

const config = loadConfig();

console.log({
  endpoint: config.dynamoDbEndpoint,
  region: config.awsRegion,
  tableName: config.dynamoDbTableName,
});

const dynamoDbClient = createDynamoDbClient({
  region: config.awsRegion,
  endpoint: config.dynamoDbEndpoint,
});

const repository = new DynamoDbTodoRepository(
  dynamoDbClient,
  config.dynamoDbTableName,
);

const app = createApp(repository);

const server = app.listen(config.port, () => {
  console.log(
    `Server listening on http://localhost:${config.port}`,
  );
});

function shutDown(signal: string): void {
  console.log(`Received ${signal}; shutting down`);

  server.close((error) => {
    dynamoDbClient.destroy();

    if (error !== undefined) {
      console.error("Error while closing server:", error);
      process.exitCode = 1;
    }
  });
}

process.on("SIGINT", () => {
  shutDown("SIGINT");
});

process.on("SIGTERM", () => {
  shutDown("SIGTERM");
});