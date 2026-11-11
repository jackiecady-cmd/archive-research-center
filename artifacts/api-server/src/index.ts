import { retentionWarnings } from "@workspace/config/legal";
import app from "./app";
import { clearPrefilledCitationSourceText } from "./lib/clear-citation-prefill";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"] ?? "8080";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

for (const warning of retentionWarnings()) {
  logger.warn(warning);
}

await clearPrefilledCitationSourceText().catch((error: unknown) => {
  logger.error({ err: error }, "Could not clear pre-filled citation source text");
});

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
