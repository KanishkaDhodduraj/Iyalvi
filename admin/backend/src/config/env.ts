import { resolve } from "node:path";
import dotenv from "dotenv";
import { z } from "zod";

const envPath = resolve(process.cwd(), ".env");
if (process.env.NODE_ENV !== "test") {
  dotenv.config({ path: envPath, quiet: true });
}

const schema = z.object({
  PORT: z.preprocess(
    (value) => (value === "" || value === undefined ? 5001 : value),
    z.coerce.number().int().min(1).max(65535),
  ),
  DATABASE_URL: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string({ error: "missing" }).trim().url(),
  ),
  ADMIN_JWT_SECRET: z.string({ error: "missing" }).min(32),
  ADMIN_CLIENT_URL: z.string().trim().url().transform((value) => value.replace(/\/+$/, "")).refine((value) => {
    const url = new URL(value);
    return (
      ["http:", "https:"].includes(url.protocol) &&
      url.origin === value
    );
  }),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  COOKIE_SAME_SITE: z.preprocess(
    (value) => (value === "" || value === undefined ? "lax" : value),
    z.enum(["lax", "none"]),
  ),
  TRUST_PROXY: z.preprocess(
    (value) => (value === "" || value === undefined ? "0" : value),
    z.enum(["0", "1", "true", "false"]),
  ),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  const details = parsed.error.issues.map((issue) => issue.path.join("."));
  console.error(`Invalid admin environment. Check: ${[...new Set(details)].join(", ")}`);
  throw new Error(`Invalid admin environment. Check: ${[...new Set(details)].join(", ")}`);
}

export const env = parsed.data;
