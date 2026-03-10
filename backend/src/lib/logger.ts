import { env } from "../config/env.js";
import type { JsonObject } from "./json.js";

type LogLevel = "info" | "warn" | "error" | "debug";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  data?: JsonObject;
}

function formatLog(entry: LogEntry): string {
  const base = `[${entry.timestamp}] [${entry.level.toUpperCase()}]`;
  const ctx = entry.context ? ` [${entry.context}]` : "";
  const data = entry.data ? ` ${JSON.stringify(entry.data)}` : "";
  return `${base}${ctx} ${entry.message}${data}`;
}

function createEntry(
  level: LogLevel,
  message: string,
  context?: string,
  data?: JsonObject,
): LogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
    data,
  };
}

export const logger = {
  info(message: string, context?: string, data?: JsonObject) {
    const entry = createEntry("info", message, context, data);
    console.log(formatLog(entry));
  },

  warn(message: string, context?: string, data?: JsonObject) {
    const entry = createEntry("warn", message, context, data);
    console.warn(formatLog(entry));
  },

  error(message: string, context?: string, data?: JsonObject) {
    const entry = createEntry("error", message, context, data);
    console.error(formatLog(entry));
  },

  debug(message: string, context?: string, data?: JsonObject) {
    if (env.NODE_ENV === "development") {
      const entry = createEntry("debug", message, context, data);
      console.debug(formatLog(entry));
    }
  },
};
