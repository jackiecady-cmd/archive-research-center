import { existsSync } from "node:fs";
import { spawn } from "node:child_process";

if (existsSync(".env")) {
  process.loadEnvFile(".env");
}

const child = spawn("pnpm", process.argv.slice(2), {
  env: process.env,
  stdio: "inherit",
});

child.on("error", (error) => {
  console.error(`Command could not start: ${error.message}`);
  process.exitCode = 1;
});
child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
process.on("SIGINT", () => child.kill("SIGINT"));
process.on("SIGTERM", () => child.kill("SIGTERM"));
