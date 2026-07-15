import {
  type SyntheticEvent,
  useEffect,
  useState,
} from "react";

import type { Todo } from "@todo-cicd/shared";

import {
  createTodo,
  deleteTodo,
  getTodos,
  updateTodo,
} from "./api";

import "./App.css";

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingTodoIds, setPendingTodoIds] = useState<
    Set<string>
  >(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchInitialTodos(): Promise<string> {
      try {
        const loadedTodos = await getTodos();

        if (!cancelled) {
          setTodos(loadedTodos);
        }
      } catch (caughtError) {
        if (!cancelled) {
          setError(getErrorMessage(caughtError));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void fetchInitialTodos();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(
    event: SyntheticEvent<HTMLFormElement, SubmitEvent>,
  ): Promise<void> {
    event.preventDefault();

    const trimmedTitle = title.trim();

    if (trimmedTitle === "") {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const todo = await createTodo({
        title: trimmedTitle,
      });

      setTodos((currentTodos) => [...currentTodos, todo]);
      setTitle("");
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCompletedChange(
    todo: Todo,
  ): Promise<void> {
    setTodoPending(todo.id, true);
    setError(null);

    try {
      const updatedTodo = await updateTodo(todo.id, {
        completed: !todo.completed,
      });

      setTodos((currentTodos) =>
        currentTodos.map((currentTodo) =>
          currentTodo.id === updatedTodo.id
            ? updatedTodo
            : currentTodo,
        ),
      );
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setTodoPending(todo.id, false);
    }
  }

  async function handleDelete(id: string): Promise<void> {
    setTodoPending(id, true);
    setError(null);

    try {
      await deleteTodo(id);

      setTodos((currentTodos) =>
        currentTodos.filter((todo) => todo.id !== id),
      );
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
      setTodoPending(id, false);
    }
  }

  async function handleRetry(): Promise<void> {
    setIsLoading(true);
    setError(null);

    try {
      const loadedTodos = await getTodos();

      setTodos(loadedTodos);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setIsLoading(false);
    }
  }

  function setTodoPending(
    id: string,
    isPending: boolean,
  ): void {
    setPendingTodoIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (isPending) {
        nextIds.add(id);
      } else {
        nextIds.delete(id);
      }

      return nextIds;
    });
  }

  return (
    <main className="container">
      <header>
        <p className="eyebrow">CI/CD learning project</p>

        <h1>Todos</h1>

        <p>
          A tiny application with a deliberately serious delivery
          pipeline.
        </p>
      </header>

      <form onSubmit={handleSubmit}>
        <label htmlFor="todo-title">New todo</label>

        <div className="new-todo">
          <input
            id="todo-title"
            name="title"
            type="text"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
            }}
            disabled={isSubmitting}
            autoComplete="off"
            placeholder="Learn GitHub Actions"
          />

          <button
            type="submit"
            disabled={isSubmitting || title.trim() === ""}
          >
            {isSubmitting ? "Adding…" : "Add"}
          </button>
        </div>
      </form>

      {error !== null && (
        <div className="error" role="alert">
          <span>{error}</span>

          <button
            type="button"
            className="secondary"
            onClick={() => {
              void handleRetry();
            }}
          >
            Retry
          </button>
        </div>
      )}

      <section aria-labelledby="todo-list-heading">
        <div className="list-heading">
          <h2 id="todo-list-heading">Todo list</h2>

          <span>
            {todos.length} {todos.length === 1 ? "item" : "items"}
          </span>
        </div>

        {isLoading ? (
          <p>Loading todos…</p>
        ) : todos.length === 0 ? (
          <p className="empty-state">
            There are no todos yet.
          </p>
        ) : (
          <ul>
            {todos.map((todo) => {
              const isPending = pendingTodoIds.has(todo.id);

              return (
                <li key={todo.id}>
                  <label>
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      disabled={isPending}
                      onChange={() => {
                        void handleCompletedChange(todo);
                      }}
                    />

                    <span
                      className={
                        todo.completed ? "completed" : undefined
                      }
                    >
                      {todo.title}
                    </span>
                  </label>

                  <button
                    type="button"
                    className="danger"
                    disabled={isPending}
                    onClick={() => {
                      void handleDelete(todo.id);
                    }}
                  >
                    {isPending ? "Working…" : "Delete"}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred";
}
