import { z } from "zod";

export const environmentSchema = z
  .object({
    PORT: z.preprocess(
      (value) => (typeof value === "string" ? value.trim() : value),
      z.preprocess(
        (value) => (value === "" || value === undefined ? "5000" : value),
        z.coerce
          .number({ error: "must be a valid port number" })
          .int("must be a whole number")
          .min(1, "must be between 1 and 65535")
          .max(65_535, "must be between 1 and 65535"),
      ),
    ),
    JWT_SECRET: z
      .string({ error: "missing" })
      .trim()
      .min(1, "missing")
      .min(32, "must be at least 32 characters"),
    CLIENT_URL: z
      .string({ error: "missing" })
      .trim()
      .min(1, "missing")
      .transform((value) => value.replace(/\/+$/, ""))
      .refine(
        isValidClientUrl,
        "must start with http:// or https:// and have no trailing slash or path",
      ),
    GOOGLE_CLIENT_ID: z.string().min(1).optional(),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DEMO_PAYMENTS: z.preprocess(
      (value) => (value === "" || value === undefined ? "false" : value),
      z.enum(["true", "false"]).transform((value) => value === "true"),
    ),
    COOKIE_SAME_SITE: z.preprocess(
      (value) => (value === "" || value === undefined ? "lax" : value),
      z.enum(["lax", "none"]),
    ),
    DATABASE_URL: z.preprocess(
      (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
      z.string({ error: "missing" }).trim().url("must be a valid URL"),
    ),
    CRON_SECRET: z.string({ error: "missing" }).trim().min(1, "missing"),
    TRUST_PROXY: z.preprocess(
      (value) => (value === "" || value === undefined ? "0" : value),
      z.enum(["0", "1", "true", "false"]),
    ),
  });

function isValidClientUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      url.origin === value &&
      !value.endsWith("/")
    );
  } catch {
    return false;
  }
}
