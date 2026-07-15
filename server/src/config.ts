export type AppConfig = {
  port: number;
  awsRegion: string;
  dynamoDbEndpoint?: string | undefined;
  dynamoDbTableName: string;
};

const DEFAULT_PORT = 3000;
const DEFAULT_REGION = "us-east-1";
const DEFAULT_TABLE_NAME = "todo-cicd-local";

export function loadConfig(
  environment: NodeJS.ProcessEnv = process.env,
): AppConfig {
  return {
    port: parsePort(environment.PORT),
    awsRegion: environment.AWS_REGION ?? DEFAULT_REGION,
    dynamoDbEndpoint: normalizeOptionalString(
      environment.DYNAMODB_ENDPOINT,
    ),
    dynamoDbTableName:
      environment.DYNAMODB_TABLE_NAME ?? DEFAULT_TABLE_NAME,
  };
}

function parsePort(value: string | undefined): number {
  if (value === undefined) {
    return DEFAULT_PORT;
  }

  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error(`Invalid PORT value: ${value}`);
  }

  return port;
}

function normalizeOptionalString(
  value: string | undefined,
): string | undefined {
  if (value === undefined || value.trim() === "") {
    return undefined;
  }

  return value;
}