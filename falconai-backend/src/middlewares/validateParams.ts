import { ZodTypeAny, ZodError } from "zod";
import { Request, Response, NextFunction } from "express";
import statusCodes from "@app/constants/statusCodes";
import { methods } from "@app/utils/methods";
import logger from "@app/services/logging/logger";

function assignValidated(req: Request, location: "body" | "query" | "params", parsed: unknown) {
  // Express 5 exposes req.query as a getter; plain assignment is ignored.
  // Redefine the property so controllers receive the coerced/validated values.
  Object.defineProperty(req, location, {
    value: parsed,
    writable: true,
    configurable: true,
    enumerable: true,
  });
}

export const validate =
  (schema: ZodTypeAny, location: "body" | "query" | "params" = "body") =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = location === "body" ? req.body : location === "query" ? req.query : req.params;

      const parsed = schema.parse(data);
      assignValidated(req, location, parsed);
      next();
    } catch (err: unknown) {
      if (err instanceof ZodError) {
        const errors = err.issues.map((issue) => {
          const path = issue.path.join(".");
          return {
            field: path || "root",
            message: issue.message,
          };
        });

        const errorMessages = errors.map((e) => `${e.field}: ${e.message}`).join(", ");
        const detailedMessage = errors.length === 1 ? errors[0].message : `Validation failed: ${errorMessages}`;

        return methods.sendResponse(res, statusCodes.ValidationError, detailedMessage, { errors });
      }

      logger.error("Unexpected validation middleware error:", err);
      return methods.sendResponse(res, statusCodes.ValidationError);
    }
  };
