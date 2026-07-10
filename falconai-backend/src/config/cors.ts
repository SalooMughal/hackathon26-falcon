// Define allowed origins (NO "*" when using credentials: true)
export const allowedOrigins = ["*"];

// CORS configuration
export const corsOptions = {
  origin: (origin: string | undefined, callback: Function) => {
    // Allow requests with no origin (same-origin, Swagger UI, Postman, mobile apps)
    if (!origin) return callback(null, true);

    // In development, allow all localhost origins
    if (process.env.NODE_ENV !== "production") {
      if (origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:")) {
        return callback(null, true);
      }
    }

    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Reject other origins
    callback(new Error(`Not allowed by CORS. Origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "ngrok-skip-browser-warning", "X-Requested-With"],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
  maxAge: 86400, // Cache preflight requests for 24 hours
};
