import type {
  CreateTodoInput,
  Todo,
  UpdateTodoInput,
} from "@todo-cicd/shared";

export interface TodoRepository {
  list(): Promise<Todo[]>;
  create(input: CreateTodoInput): Promise<Todo>;
  update(id: string, input: UpdateTodoInput): Promise<Todo | null>;
  delete(id: string): Promise<boolean>;
}

