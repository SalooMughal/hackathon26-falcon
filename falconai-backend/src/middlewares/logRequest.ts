import logger from "@app/services/logging/logger";
import express, { Express, Request, Response, NextFunction } from "express";

const logRequest = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const originalSend = res.send;

  let responseBody: any; // Capture response body

  res.send = function (body: any): Response {
    responseBody = body;
    return originalSend.apply(this, arguments as any); // Ensure correct return type
  };

  res.on("finish", () => {
    const duration = Date.now() - start;

    let parsedResponse;
    try {
      parsedResponse = typeof responseBody === "string" ? JSON.parse(responseBody) : responseBody;
    } catch (err) {
      parsedResponse = "check request url";
    }

    const logMessage = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      responseTime: duration,
      contentLength: res.get("Content-Length") || "unknown",
      body: req.body,
      headers: req.headers,
      params: req.params,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      response: parsedResponse,
    };

    // Log based on status code
    if (res.statusCode >= 200 && res.statusCode < 300) {
      // 2xx: Success responses
      logger.info(JSON.stringify(logMessage));
    } else if (res.statusCode >= 300 && res.statusCode < 400) {
      // 3xx: Redirection responses
      logger.info(JSON.stringify(logMessage));
    } else if (res.statusCode >= 400 && res.statusCode < 500) {
      // 4xx: Client errors
      logger.warn(JSON.stringify(logMessage));
    } else if (res.statusCode >= 500) {
      // 5xx: Server errors
      logger.error(JSON.stringify(logMessage));
    } else {
      // Unexpected status codes
      logger.warn(JSON.stringify(logMessage));
    }
  });

  next();
};
export default logRequest;
