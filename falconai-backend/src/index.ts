import "module-alias/register";
import express, { Application } from "express";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import logRequest from "@app/middlewares/logRequest";
import logger from "@app/services/logging/logger";
import basicAuth from "express-basic-auth";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger/swagger-docs";
import { corsOptions } from "./config/cors";
import { limiter } from "./config/rate-limit";
import httpRouter from "./transport/http";

const app: Application = express();
const port = 3000;

// Trust proxy (required for Railway, ngrok, etc.)
app.set("trust proxy", true);

// Apply CORS BEFORE rate limiter (important for preflight requests)
app.use(cors(corsOptions));

// Handle preflight OPTIONS requests explicitly
app.options("{*path}", cors(corsOptions));

app.use((req, res, next) => {
  // Skip global JSON parsing for webhook routes — they use captureRawBody instead
  if (req.path.includes("webhook")) return next();
  express.json()(req, res, next);
});
app.use(express.urlencoded({ extended: true }));
app.use(limiter);

app.use(logRequest);

app.listen(port, async () => {
  logger.info(`Connected to DB & app listening on port ${port}`);
});

//----------------Swagger Documentation----------------\\

const swaggerAuth = basicAuth({
  users: {
    [process.env.SWAGGER_USERNAME || "admin"]: process.env.SWAGGER_PASSWORD || "falconai-backend-295",
  },
  challenge: true,
  realm: "FalconAI API Documentation",
});

app.use(
  "/api-docs",
  swaggerAuth,
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customSiteTitle: "FalconAI API Documentation",
    customCss: `
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info .title { color: #2c3e50; }
  `,
  }),
);

app.use(httpRouter);
