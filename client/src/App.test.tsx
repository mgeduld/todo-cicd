import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";

import App from "./App";

afterEach(() => {
  vi.restoreAllMocks();
});

it("loads and creates a todo", async () => {
  const user = userEvent.setup();

  const fetchMock = vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValueOnce(
      jsonResponse([]),
    )
    .mockResolvedValueOnce(
      jsonResponse(
        {
          id: "todo-1",
          title: "Wash dishes",
          completed: false,
          createdAt: "2026-07-15T12:00:00.000Z",
        },
        201,
      ),
    );

  render(<App />);

  expect(
    await screen.findByText("There are no todos yet."),
  ).toBeInTheDocument();

  await user.type(
    screen.getByLabelText("New todo"),
    "Wash dishes",
  );

  await user.click(
    screen.getByRole("button", {
      name: "Add",
    }),
  );

  expect(
    await screen.findByText("Wash dishes"),
  ).toBeInTheDocument();

  expect(fetchMock).toHaveBeenNthCalledWith(
    1,
    "/api/todos",
    undefined,
  );

  expect(fetchMock).toHaveBeenNthCalledWith(
    2,
    "/api/todos",
    expect.objectContaining({
      method: "POST",
      body: JSON.stringify({
        title: "Wash dishes",
      }),
    }),
  );
});

function jsonResponse(
  body: unknown,
  status = 200,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}