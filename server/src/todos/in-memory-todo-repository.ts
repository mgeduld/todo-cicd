import { randomUUID } from "node:crypto";

import type {
  CreateTodoInput,
  Todo,
  UpdateTodoInput,
} from "@todo-cicd/shared";

import type { TodoRepository } from "./todo-repository.js";

export class InMemoryTodoRepository implements TodoRepository {
  private readonly todos = new Map<string, Todo>();

  async list(): Promise<Todo[]> {
    return [...this.todos.values()].sort((left, right) =>
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

    this.todos.set(todo.id, todo);

    return todo;
  }

  async update(
    id: string,
    input: UpdateTodoInput,
  ): Promise<Todo | null> {
    const existingTodo = this.todos.get(id);

    if (existingTodo === undefined) {
      return null;
    }

    const updatedTodo: Todo = {
      ...existingTodo,
      completed: input.completed,
    };

    this.todos.set(id, updatedTodo);

    return updatedTodo;
  }

  async delete(id: string): Promise<boolean> {
    return this.todos.delete(id);
  }
}