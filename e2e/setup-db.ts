import { execFileSync } from "node:child_process";

const defaultDatabaseUrl =
  "postgresql://deliveryreg:deliveryreg@localhost:55438/deliveryreg_e2e?schema=public";

const databaseUrl = process.env.E2E_DATABASE_URL ?? process.env.DATABASE_URL ?? defaultDatabaseUrl;
const parsed = new URL(databaseUrl);
const databaseName = parsed.pathname.replace(/^\//, "");

if (!databaseName) {
  throw new Error("E2E database URL must include a database name.");
}

const maintenanceUrl = new URL(parsed);
maintenanceUrl.pathname = "/postgres";
maintenanceUrl.search = "";

const pgEnv = {
  ...process.env,
  DATABASE_URL: databaseUrl,
  PGPASSWORD: decodeURIComponent(parsed.password)
};

function run(command: string, args: string[]) {
  execFileSync(command, args, {
    env: pgEnv,
    stdio: "inherit"
  });
}

function output(command: string, args: string[]) {
  return execFileSync(command, args, {
    env: pgEnv,
    encoding: "utf8"
  }).trim();
}

const exists = output("psql", [
  maintenanceUrl.toString(),
  "-tAc",
  `SELECT 1 FROM pg_database WHERE datname = '${databaseName.replaceAll("'", "''")}'`
]);

if (exists !== "1") {
  run("createdb", [
    "--host",
    parsed.hostname,
    "--port",
    parsed.port || "5432",
    "--username",
    decodeURIComponent(parsed.username),
    databaseName
  ]);
}

run("npx", ["prisma", "migrate", "deploy"]);
run("npx", ["tsx", "e2e/seed.ts"]);
