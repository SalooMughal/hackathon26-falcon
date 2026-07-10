import rateLimit from "express-rate-limit";

export const limiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 minutes
  max: Number(process.env.API_RATE_LIMIT_MAX ?? 200),
  message: { message: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "OPTIONS" || req.path.startsWith("/v1/application-form"),
});
