import app from "./app";
import { logger } from "./lib/logger";
import { seedIfEmpty, seedEval } from "./lib/seed";
import { tick, startScheduler } from "./lib/scheduler";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function boot(): Promise<void> {
  try {
    await seedIfEmpty();
    await seedEval();
    await tick();
    startScheduler();
  } catch (err) {
    logger.error({ err }, "Boot tasks failed");
  }
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
  void boot();
});
