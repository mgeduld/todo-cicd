import type {
  CreateTodoInput,
  Todo,
  UpdateTodoInput,
} from "@todo-cicd/shared";

export async function getTodos(): Promise<Todo[]> {
  return request<Todo[]>("/api/todos");
}

export async function createTodo(
  input: CreateTodoInput,
): Promise<Todo> {
  return request<Todo>("/api/todos", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

export async function updateTodo(
  id: string,
  input: UpdateTodoInput,
): Promise<Todo> {
  return request<Todo>(`/api/todos/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

export async function deleteTodo(id: string): Promise<void> {
  await request<void>(`/api/todos/${id}`, {
    method: "DELETE",
  });
}

async function request<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new ApiError(
      response.status,
      await readErrorMessage(response),
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

async function readErrorMessage(
  response: Response,
): Promise<string> {
  try {
    const value: unknown = await response.json();

    if (
      typeof value === "object" &&
      value !== null &&
      "error" in value &&
      typeof value.error === "string"
    ) {
      return value.error;
    }
  } catch {
    // The server did not return usable JSON.
  }

  return `Request failed with status ${response.status}`;
}

export class ApiError extends Error {
  public readonly status: number;

  constructor(status: number, message: string) {
    super(message);

    this.name = "ApiError";
    this.status = status;
  }
}