import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";

import type { Todo } from "@todo-cicd/shared";

import { createApp } from "./app.js";
import { InMemoryTodoRepository } from "./todos/in-memory-todo-repository.js";

describe("Todo API", () => {
  let repository: InMemoryTodoRepository;

  beforeEach(() => {
    repository = new InMemoryTodoRepository();
  });

  it("returns a successful health response", async () => {
    const response = await request(createApp(repository)).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "ok",
    });
  });

  it("starts with an empty todo list", async () => {
    const response = await request(createApp(repository)).get("/api/todos");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it("creates and lists a todo", async () => {
    const app = createApp(repository);

    const createResponse = await request(app)
      .post("/api/todos")
      .send({
        title: "Walk dogs",
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body).toMatchObject({
      title: "Walk dogs",
      completed: false,
    });

    expect(createResponse.body.id).toEqual(expect.any(String));
    expect(createResponse.body.createdAt).toEqual(expect.any(String));

    const listResponse = await request(app).get("/api/todos");

    expect(listResponse.status).toBe(200);
    expect(listResponse.body).toHaveLength(1);
    expect(listResponse.body[0]).toEqual(createResponse.body);
  });

  it("rejects an empty title", async () => {
    const response = await request(createApp(repository))
      .post("/api/todos")
      .send({
        title: "   ",
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "title must not be empty",
    });
  });

  it("marks a todo complete", async () => {
    const app = createApp(repository);

    const createResponse = await request(app)
      .post("/api/todos")
      .send({
        title: "Write tests",
      });

    const todo = createResponse.body as Todo;

    const updateResponse = await request(app)
      .patch(`/api/todos/${todo.id}`)
      .send({
        completed: true,
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body).toEqual({
      ...todo,
      completed: true,
    });
  });

  it("deletes a todo", async () => {
    const app = createApp(repository);

    const createResponse = await request(app)
      .post("/api/todos")
      .send({
        title: "Temporary todo",
      });

    const todo = createResponse.body as Todo;

    const deleteResponse = await request(app).delete(
      `/api/todos/${todo.id}`,
    );

    expect(deleteResponse.status).toBe(204);

    const listResponse = await request(app).get("/api/todos");

    expect(listResponse.body).toEqual([]);
  });

  it("returns 404 for an unknown todo", async () => {
    const response = await request(createApp(repository))
      .patch("/api/todos/not-a-real-id")
      .send({
        completed: true,
      });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: "Todo not found",
    });
  });
});