import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import mongoose from "mongoose";

import { env } from "./config/env.js";
import { connectDatabase } from "./config/db.js";
import helmet from "./config/helmet.js";
import { authRouter } from "./routes/authRoutes.js";
import { addressRouter } from "./routes/addressRoutes.js";
import { adminOrderRouter, orderRouter } from "./routes/orderRoutes.js";
import { cartRouter } from "./routes/cartRoutes.js";
import { couponRouter } from "./routes/couponRoutes.js";
import { productRouter } from "./routes/productRoutes.js";
import { wishlistRouter } from "./routes/wishlistRoutes.js";
import { contactRouter } from "./routes/contactRoutes.js";
import { reelRouter } from "./routes/reelRoutes.js";
import { allowedPaymentMethods } from "./services/orders.js";
import { errorHandler, HttpError, notFoundHandler } from "./middleware/errors.js";
import { publicReadRateLimit, sensitiveRateLimit } from "./middleware/rateLimit.js";
import { csrfProtection } from "./middleware/auth.js";
import { validateRequest } from "./middleware/validate.js";
import { z } from "zod";

export const app = express();
export default app;

app.disable("x-powered-by");
app.set("trust proxy", env.TRUST_PROXY === "1" ? 1 : env.TRUST_PROXY === "true");
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        frameSrc: ["'self'", "https://www.instagram.com"],
      },
    },
  }),
);
app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      if (origin?.replace(/\/+$/, "") === env.CLIENT_URL) {
        callback(null, env.CLIENT_URL);
        return;
      }
      if (!origin) {
        callback(null, false);
        return;
      }
      callback(new HttpError(403, "Origin not allowed"));
    },
  }),
);
app.use(compression());
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());
app.use((request, _response, next) => {
  const inputs = [request.body, request.params, request.query, request.headers];
  for (const value of inputs) {
    if (value && typeof value === "object" && mongoSanitize.has(value as Record<string, unknown>)) {
      next(new HttpError(400, "Invalid request"));
      return;
    }
  }
  next();
});
app.use(hpp());
app.use(csrfProtection);
app.use("/api", async (request, response, next) => {
  if (
    request.path === "/health" ||
    request.path === "/auth/csrf" ||
    env.NODE_ENV === "test"
  ) {
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
app.get("/api/health", validateRequest({ query: z.object({}).strict() }), (_request, response) => {
  response.json({
    status: "ok",
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});
app.get("/api/payment-options", publicReadRateLimit, validateRequest({ query: z.object({}).strict() }), (_request, response) => {
  response.json({ methods: allowedPaymentMethods() });
});
app.use("/api/auth", authRouter);
app.use("/api/products", productRouter);
app.use("/api/reels", reelRouter);
app.use("/api/wishlist", wishlistRouter);
app.use("/api/addresses", addressRouter);
app.use("/api/cart", cartRouter);
app.use("/api/coupons", couponRouter);
app.use("/api/orders", orderRouter);
app.use("/api/admin/orders", adminOrderRouter);
app.use("/api/payments", sensitiveRateLimit);
app.use("/api/contact", contactRouter);
app.use("/uploads", express.static("uploads", {
  dotfiles: "deny",
  fallthrough: false,
  index: false,
  setHeaders(response) {
    response.setHeader("X-Content-Type-Options", "nosniff");
  },
}));

app.use(notFoundHandler);
app.use(errorHandler);
