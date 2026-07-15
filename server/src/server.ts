import { createApp } from "./app.js"

const DEFAULT_PORT = 3000;

function getPort(): number {
  const value = process.env.PORT;

  if (value === undefined) {
    return DEFAULT_PORT;
  }

  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error(`Invalid PORT value: ${value}`);
  }

  return port;
}

const port = getPort();
const app = createApp();

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});