import { createLogger, format, transports, Logger } from "winston";
import path from "path";
const { combine, timestamp, printf, errors } = format;

const IS_PRODUCTION = process.env.NODE_ENV === "production";

type LogLevels = "info" | "warn" | "error";
const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
  },
};

// List of sensitive fields to redact from logs
const SENSITIVE_FIELDS = ["password", "newPassword", "oldPassword", "confirmPassword", "token", "accessToken", "refreshToken"];

/**
 * Recursively sanitize sensitive fields from objects
 * Replaces sensitive values with "[REDACTED]"
 */
const sanitizeLogData = (data: any): any => {
  if (data === null || data === undefined) {
    return data;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeLogData(item));
  }

  // Handle objects
  if (typeof data === "object") {
    const sanitized: any = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        // Check if the key is a sensitive field (case-insensitive)
        const lowerKey = key.toLowerCase();
        const isSensitive = SENSITIVE_FIELDS.some((field) => lowerKey.includes(field.toLowerCase()));

        if (isSensitive) {
          sanitized[key] = "[REDACTED]";
        } else {
          // Recursively sanitize nested objects
          sanitized[key] = sanitizeLogData(data[key]);
        }
      }
    }
    return sanitized;
  }

  // Return primitives as-is
  return data;
};

const logFormat = printf(({ level, message, timestamp }) => {
  const mss = message;

  let logData: any;

  if (typeof mss === "string") {
    try {
      // Try to parse as JSON - if successful, add level to it
      const parsed = JSON.parse(mss);
      logData = { level, timestamp, ...parsed };
    } catch (e) {
      // If not JSON, wrap plain text message in JSON object with level
      logData = { level, timestamp, message: mss };
    }
  } else if (typeof mss === "object" && mss !== null) {
    // If already an object, add level to it
    logData = { level, timestamp, ...mss };
  } else {
    // For other types (number, boolean, etc.), wrap in message object with level
    logData = { level, timestamp, message: String(mss) };
  }

  // Sanitize sensitive fields before stringifying
  const sanitizedLogData = sanitizeLogData(logData);

  return JSON.stringify(sanitizedLogData);
});

const filterByLevel = (levelToFilter: string) =>
  format((info) => {
    return info.level === levelToFilter ? info : false;
  })();

const createCustomLogger = (): Logger => {
  const loggerTransports = [];
  const consoleTransport = new transports.Console({
    format: combine(timestamp(), errors({ stack: true }), logFormat),
  });
  if (IS_PRODUCTION) {
    loggerTransports.push(consoleTransport);
  } else {
    loggerTransports.push(
      consoleTransport,
      new transports.File({
        filename: path.join("logs", "combined.log"),
      }),
      new transports.File({
        filename: path.join("logs", "info.log"),
        level: "info",
        format: combine(filterByLevel("info"), timestamp(), logFormat), // Filter to only info
      }),
      new transports.File({
        filename: path.join("logs", "warnings.log"),
        level: "warn",
        format: combine(filterByLevel("warn"), timestamp(), logFormat), // Filter to only warn
      }),
      new transports.File({
        filename: path.join("logs", "errors.log"),
        level: "error",
        format: combine(filterByLevel("error"), timestamp(), logFormat), // Filter to only error
      }),
    );
  }

  return createLogger({
    levels: customLevels.levels,
    level: "info",
    format: combine(timestamp(), errors({ stack: true }), logFormat),
    defaultMeta: { service: "falconai-backend-service" },
    transports: loggerTransports,
  });
};

const logger = createCustomLogger();

export default logger;
