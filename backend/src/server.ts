import app from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";

const PORT = env.PORT;

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`, "Server");
  logger.info(`Environment: ${env.NODE_ENV}`, "Server");
  logger.info(`CORS origin: ${env.CORS_ORIGIN}`, "Server");
});
