import net from "node:net";
import { spawnSync } from "node:child_process";

const npmCommand = "npm";
const dockerCommand = "docker";
const defaultTestDatabaseUrl = "postgresql://caca:caca@localhost:5433/caca_test?schema=public";
const databaseUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL ?? defaultTestDatabaseUrl;

function run(command, args, options = {}) {
  const commandLine = [command, ...args]
    .map((argument) => (/\s/.test(argument) ? `"${argument.replace(/"/g, '\\"')}"` : argument))
    .join(" ");
  const result = spawnSync(process.platform === "win32" ? commandLine : command, process.platform === "win32" ? [] : args, {
    stdio: options.stdio ?? "inherit",
    env: options.env ?? process.env,
    shell: process.platform === "win32"
  });

  if (result.error) {
    console.error(result.error.message);
  }

  if (result.status !== 0 && !options.allowFailure) {
    process.exit(result.status ?? 1);
  }

  return result;
}

async function ensureTestDatabase() {
  const deadline = Date.now() + 60_000;

  while (Date.now() < deadline) {
    const result = spawnSync(
      dockerCommand,
      ["compose", "exec", "-T", "postgres", "createdb", "-U", "caca", "caca_test"],
      {
        encoding: "utf8",
        stdio: "pipe"
      }
    );

    if (result.status === 0 || result.stderr.includes("already exists")) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error("Could not create PostgreSQL test database.");
}

function parseDatabaseHost(url) {
  const parsedUrl = new URL(url);

  return {
    hostname: parsedUrl.hostname,
    port: Number(parsedUrl.port || 5432)
  };
}

function canConnect({ hostname, port }) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: hostname, port, timeout: 1000 });

    socket.on("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.on("error", () => resolve(false));
    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });
  });
}

async function waitForPostgres(target) {
  const deadline = Date.now() + 60_000;

  while (Date.now() < deadline) {
    if (await canConnect(target)) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error("PostgreSQL did not become available in time.");
}

const target = parseDatabaseHost(databaseUrl);
const hasPostgres = await canConnect(target);
const shouldManagePostgres = !hasPostgres && databaseUrl === defaultTestDatabaseUrl;

try {
  if (shouldManagePostgres) {
    run(dockerCommand, ["compose", "up", "-d", "postgres"]);
    await waitForPostgres(target);
  }

  if (databaseUrl === defaultTestDatabaseUrl) {
    await ensureTestDatabase();
  }

  const testEnv = {
    ...process.env,
    DATABASE_URL: databaseUrl,
    TEST_DATABASE_URL: databaseUrl
  };

  run(npmCommand, ["run", "test", "--workspace", "backend"], { env: testEnv });
  run(npmCommand, ["run", "test", "--workspace", "frontend"], { env: testEnv });
} finally {
  if (shouldManagePostgres) {
    run(dockerCommand, ["compose", "stop", "postgres"], { allowFailure: true });
  }
}
