import { existsSync } from "node:fs";
import { spawn } from "node:child_process";

if (existsSync(".env") && typeof process.loadEnvFile === "function") {
  process.loadEnvFile(".env");
}

const apiPort = process.env.API_PORT ?? "8080";
const webPort = process.env.WEB_PORT ?? "5173";
const sharedEnv = {
  ...process.env,
  NODE_ENV: "development",
};

const services = [
  {
    name: "API",
    env: { ...sharedEnv, PORT: apiPort },
    args: ["--filter", "@workspace/api-server", "run", "dev"],
  },
  {
    name: "Web",
    env: {
      ...sharedEnv,
      PORT: webPort,
      BASE_PATH: "/",
      API_PROXY_TARGET:
        process.env.API_PROXY_TARGET ?? `http://127.0.0.1:${apiPort}`,
    },
    args: ["--filter", "@workspace/archive-research-center", "run", "dev"],
  },
];

let stopping = false;
const children = services.map(({ name, env, args }) => {
  const child = spawn("pnpm", args, {
    env,
    stdio: "inherit",
  });
  child.on("error", (error) => {
    console.error(`${name} service could not start: ${error.message}`);
    stopServices(1);
  });
  child.on("exit", (code, signal) => {
    if (!stopping) {
      const reason = signal ? `signal ${signal}` : `exit code ${code ?? 1}`;
      console.error(`${name} service stopped (${reason}); stopping the other service.`);
      stopServices(code ?? 1);
    }
  });
  return child;
});

function stopServices(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  process.exitCode = exitCode;
  for (const child of children) {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill("SIGTERM");
    }
  }
}

process.on("SIGINT", () => stopServices(130));
process.on("SIGTERM", () => stopServices(143));
