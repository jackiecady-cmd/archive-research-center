import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { errorHandler } from "./lib/errors";
import { allowedOrigins, createRateLimiter, csrfProtection } from "./lib/security";

const app: Express = express();

if (process.env.TRUST_PROXY === "1" || process.env.TRUST_PROXY === "true") {
  app.set("trust proxy", 1);
}

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins().includes(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());
app.use(csrfProtection);
// Production keeps a tight cap on sign-in attempts. Tests register many accounts in one process.
const authWriteLimit = createRateLimiter({
  windowMs: 60_000,
  max: process.env.NODE_ENV === "test" ? 100 : 10,
});
app.use("/api/auth/login", authWriteLimit);
app.use("/api/auth/register", authWriteLimit);
app.use("/api/comp-codes/redeem", createRateLimiter({ windowMs: 15 * 60_000, max: 20 }));
app.use("/api/rooms/join", createRateLimiter({ windowMs: 15 * 60_000, max: 20 }));
app.use("/api", createRateLimiter({ windowMs: 60_000, max: 120 }));
app.use("/api", router);
app.use(errorHandler);

export default app;
