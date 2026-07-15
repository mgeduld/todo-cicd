import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { InMemoryTodoRepository } from "./todos/in-memory-todo-repository.js";
import type { TodoRepository } from "./todos/todo-repository.js";
import {
  BadRequestError,
  createTodoRouter,
} from "./todos/todo-router.js";

export function createApp(
  todoRepository: TodoRepository = new InMemoryTodoRepository(),
) {
  const app = express();

  app.use(express.json());

  app.get("/health", (_request, response) => {
    response.status(200).json({
      status: "ok",
    });
  });

  app.use("/api/todos", createTodoRouter(todoRepository));

  const currentDirectory = path.dirname(
    fileURLToPath(import.meta.url),
  );

  const clientDirectory = path.resolve(
    currentDirectory,
    "../../client/dist",
  );

  app.use(express.static(clientDirectory));

  app.use(
    (
      error: unknown,
      _request: express.Request,
      response: express.Response,
      _next: express.NextFunction
    ) => {
      if (error instanceof BadRequestError) {
        response.status(400).json({
          error: error.message,
        });

        return;
      }

      console.error(error);
      response.status(500).json({
        error: "Internal server error",
      });
    },
  );

  return app;
}