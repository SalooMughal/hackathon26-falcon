import express, { Request, Response, NextFunction } from "express";

/**
 * Middleware that parses JSON while preserving the raw body string on req.rawBody.
 * Uses express.json()'s `verify` callback so it works correctly regardless of
 * whether a global express.json() middleware exists — this one is self-contained.
 *
 * Mount this INSTEAD of (not alongside) express.json() on routes that need
 * the raw body for signature verification (e.g. webhook routes).
 */
export const captureRawBody = express.json({
  verify: (req: Request, _res: Response, buf: Buffer) => {
    (req as Request & { rawBody: string }).rawBody = buf.toString("utf8");
  },
});
