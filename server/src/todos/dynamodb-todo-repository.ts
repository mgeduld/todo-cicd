import { randomUUID } from "node:crypto";

import type {
  CreateTodoInput,
  Todo,
  UpdateTodoInput,
} from "@todo-cicd/shared";
import type { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import {
  DeleteCommand,
  PutCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

import type { TodoRepository } from "./todo-repository.js";

export class DynamoDbTodoRepository implements TodoRepository {
  constructor(
    private readonly client: DynamoDBDocumentClient,
    private readonly tableName: string,
  ) {}

  async list(): Promise<Todo[]> {
    // Gonna use ScanCommend for this small dataset. Nornally a bad idea
    const response = await this.client.send(
      new ScanCommand({
        TableName: this.tableName,
      }),
    );

    const todos = (response.Items ?? []).map(parseTodo);

    return todos.sort((left, right) =>
      left.createdAt.localeCompare(right.createdAt),
    );
  }

  async create(input: CreateTodoInput): Promise<Todo> {
    const todo: Todo = {
      id: randomUUID(),
      title: input.title,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    await this.client.send(
      new PutCommand({
        TableName: this.tableName,
        Item: todo,
        ConditionExpression: "attribute_not_exists(id)",
      }),
    );

    return todo;
  }

  async update(
    id: string,
    input: UpdateTodoInput,
  ): Promise<Todo | null> {
    try {
      const response = await this.client.send(
        new UpdateCommand({
          TableName: this.tableName,
          Key: {
            id,
          },
          UpdateExpression: "SET completed = :completed",
          ExpressionAttributeValues: {
            ":completed": input.completed,
          },
          ConditionExpression: "attribute_exists(id)",
          ReturnValues: "ALL_NEW",
        }),
      );

      if (response.Attributes === undefined) {
        return null;
      }

      return parseTodo(response.Attributes);
    } catch (error) {
      if (isConditionalCheckFailure(error)) {
        return null;
      }

      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.client.send(
        new DeleteCommand({
          TableName: this.tableName,
          Key: {
            id,
          },
          ConditionExpression: "attribute_exists(id)",
        }),
      );

      return true;
    } catch (error) {
      if (isConditionalCheckFailure(error)) {
        return false;
      }

      throw error;
    }
  }
}

function parseTodo(value: Record<string, unknown>): Todo {
  const { id, title, completed, createdAt } = value;

  if (
    typeof id !== "string" ||
    typeof title !== "string" ||
    typeof completed !== "boolean" ||
    typeof createdAt !== "string"
  ) {
    throw new Error("DynamoDB returned an invalid Todo item");
  }

  return {
    id,
    title,
    completed,
    createdAt,
  };
}

function isConditionalCheckFailure(
  error: unknown,
): error is { name: "ConditionalCheckFailedException" } {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "ConditionalCheckFailedException"
  );
}