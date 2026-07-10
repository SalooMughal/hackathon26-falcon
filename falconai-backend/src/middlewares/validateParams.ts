import { ZodTypeAny, ZodError } from "zod";
import { Request, Response, NextFunction } from "express";
import statusCodes from "@app/constants/statusCodes";
import { methods } from "@app/utils/methods";

export const validate =
  (schema: ZodTypeAny, location: "body" | "query" | "params" = "body") =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = location === "body" ? req.body : location === "query" ? req.query : req.params;

      const parsed = schema.parse(data);
      (req as any)[location] = parsed;
      next();
    } catch (err: any) {
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
      return methods.sendResponse(res, statusCodes.ValidationError);
    }
  };
