import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { rateLimit } from "express-rate-limit";
import hpp from "hpp";
import { randomBytes } from "node:crypto";
import { env } from "./config/env.js";
import { connectDatabase } from "./config/db.js";
import helmet from "./config/helmet.js";
import { requireAdmin } from "./middleware/auth.js";
import { errorHandler, notFound } from "./middleware/errors.js";
import { mongoSanitizeExpress5 } from "./middleware/mongoSanitize.js";
import { emptyBody, emptyQuery } from "./middleware/validation.js";
import { adminRouter } from "./routes/admin.js";
import { authRouter } from "./routes/auth.js";
import { productImageRouter } from "./routes/productImageRoutes.js";
import { reportsRouter } from "./routes/reports.js";
import { sweepExpiredPromotions } from "./services/promotionExpiry.js";
import { hasValidCronAuthorization } from "./services/cronAuthorization.js";

export const app = express();
app.disable("x-powered-by");
app.set("trust proxy", env.TRUST_PROXY === "1" ? 1 : env.TRUST_PROXY === "true");
app.use(helmet());
app.use(cors({
  credentials: true,
  origin(origin, callback) {
    if (!origin) {
      callback(null, false);
      return;
    }
    callback(null, origin.replace(/\/+$/, "") === env.ADMIN_CLIENT_URL ? env.ADMIN_CLIENT_URL : false);
  },
}));
app.use(compression());
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());
app.use(mongoSanitizeExpress5);
app.use(hpp());

app.use("/api", rateLimit({ windowMs: 15 * 60 * 1000, limit: 100, standardHeaders: true, legacyHeaders: false }));
app.use("/api", async (request, response, next) => {
  if (request.path === "/health" || env.NODE_ENV === "test") {
    next();
    return;
  }
  try {
    await connectDatabase();
    next();
  } catch {
    response.status(503).json({ error: "Database unavailable" });
  }
});
app.get("/api/health", emptyQuery, emptyBody, (_request, response) => {
  response.json({ status: "ok" });
});
app.get("/api/auth/csrf", emptyQuery, emptyBody, (request, response) => {
  const existingToken = request.cookies?.admin_csrf;
  const csrfToken = typeof existingToken === "string"
    ? existingToken
    : randomBytes(32).toString("hex");
  response.cookie("admin_csrf", csrfToken, {
    secure: env.NODE_ENV === "production",
    sameSite: env.COOKIE_SAME_SITE,
    httpOnly: true,
    path: "/",
  });
  response.json({ csrfToken });
});
app.get("/api/cron/expire-promotions", emptyQuery, emptyBody, async (request, response) => {
  if (!hasValidCronAuthorization(request.get("authorization"), env.CRON_SECRET)) {
    response.status(env.CRON_SECRET ? 401 : 503).json({
      error: env.CRON_SECRET ? "Unauthorized" : "Cron is not configured",
    });
    return;
  }
  response.json(await sweepExpiredPromotions());
});
app.use("/api/auth/login", rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: true, legacyHeaders: false }));
app.use("/api/auth", authRouter);
app.use("/api/products", requireAdmin, productImageRouter);
app.use("/api/reports", requireAdmin, reportsRouter);
app.use("/api", adminRouter);
app.use(notFound);
app.use(errorHandler);
