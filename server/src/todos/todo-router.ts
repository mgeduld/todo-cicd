import { Router } from "express";

import type {
  CreateTodoInput,
  UpdateTodoInput,
} from "@todo-cicd/shared";

import type { TodoRepository } from "./todo-repository.js";

export function createTodoRouter(repository: TodoRepository): Router {
  const router = Router();

  router.get("/", async (_request, response, next) => {
    try {
      const todos = await repository.list();

      response.status(200).json(todos);
    } catch (error) {
      next(error);
    }
  });

  router.post("/", async (request, response, next) => {
    try {
      const input = parseCreateTodoInput(request.body);
      const todo = await repository.create(input);

      response.status(201).json(todo);
    } catch (error) {
      next(error);
    }
  });

  router.patch("/:id", async (request, response, next) => {
    try {
      const input = parseUpdateTodoInput(request.body);
      const todo = await repository.update(request.params.id, input);

      if (todo === null) {
        response.status(404).json({
          error: "Todo not found",
        });

        return;
      }

      response.status(200).json(todo);
    } catch (error) {
      next(error);
    }
  });

  router.delete("/:id", async (request, response, next) => {
    try {
      const deleted = await repository.delete(request.params.id);

      if (!deleted) {
        response.status(404).json({
          error: "Todo not found",
        });

        return;
      }

      response.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  return router;
}

function parseCreateTodoInput(value: unknown): CreateTodoInput {
  console.log("!!!!!!!!!!")
  if (
    typeof value !== "object" ||
    value === null ||
    !("title" in value) ||
    typeof value.title !== "string"
  ) {
    throw new BadRequestError("title must be a string");
  }

  const title = value.title.trim();

  if (title.length === 0) {
    console.log("EMPTY")
    throw new BadRequestError("title must not be empty");
  }

  return {
    title,
  };
}

function parseUpdateTodoInput(value: unknown): UpdateTodoInput {
  if (
    typeof value !== "object" ||
    value === null ||
    !("completed" in value) ||
    typeof value.completed !== "boolean"
  ) {
    throw new BadRequestError("completed must be a boolean");
  }

  return {
    completed: value.completed,
  };
}

export class BadRequestError extends Error {}