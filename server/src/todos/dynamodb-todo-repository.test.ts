import {
  CreateTableCommand,
  DeleteTableCommand,
  DynamoDBClient,
} from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import { DynamoDbTodoRepository } from "./dynamodb-todo-repository.js";

const endpoint =
  process.env.DYNAMODB_ENDPOINT ?? "http://localhost:8000";

const region = process.env.AWS_REGION ?? "us-east-1";

const tableName = `todo-cicd-test-${process.pid}`;

const baseClient = new DynamoDBClient({
  region,
  endpoint,
  credentials: {
    accessKeyId: "local",
    secretAccessKey: "local",
  },
});

const documentClient = DynamoDBDocumentClient.from(baseClient);

const repository = new DynamoDbTodoRepository(
  documentClient,
  tableName,
);

beforeAll(async () => {
  await baseClient.send(
    new CreateTableCommand({
      TableName: tableName,
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
});

beforeEach(async () => {
  const response = await documentClient.send(
    new ScanCommand({
      TableName: tableName,
      ProjectionExpression: "id",
    }),
  );

  for (const item of response.Items ?? []) {
    if (typeof item.id === "string") {
      await repository.delete(item.id);
    }
  }
});

afterAll(async () => {
  await baseClient.send(
    new DeleteTableCommand({
      TableName: tableName,
    }),
  );

  documentClient.destroy();
});

describe("DynamoDbTodoRepository", () => {
  it("creates and lists todos", async () => {
    const todo = await repository.create({
      title: "Test DynamoDB",
    });

    const todos = await repository.list();

    expect(todos).toEqual([todo]);
  });

  it("updates an existing todo", async () => {
    const todo = await repository.create({
      title: "Update me",
    });

    const updatedTodo = await repository.update(todo.id, {
      completed: true,
    });

    expect(updatedTodo).toEqual({
      ...todo,
      completed: true,
    });
  });

  it("returns null when updating an unknown todo", async () => {
    const result = await repository.update("missing-id", {
      completed: true,
    });

    expect(result).toBeNull();
  });

  it("deletes an existing todo", async () => {
    const todo = await repository.create({
      title: "Delete me",
    });

    const deleted = await repository.delete(todo.id);

    expect(deleted).toBe(true);
    expect(await repository.list()).toEqual([]);
  });

  it("returns false when deleting an unknown todo", async () => {
    const deleted = await repository.delete("missing-id");

    expect(deleted).toBe(false);
  });
});