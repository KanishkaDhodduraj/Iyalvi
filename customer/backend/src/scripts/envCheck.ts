import "../config/loadEnv.js";
import { environmentSchema } from "../config/envSchema.js";

const result = environmentSchema.safeParse(process.env);
if (result.success) {
  console.info("Valid environment keys: DATABASE_URL, JWT_SECRET, CLIENT_URL, TRUST_PROXY, CRON_SECRET");
} else {
  const keys = [...new Set(result.error.issues.map((issue) => String(issue.path[0] ?? "UNKNOWN")))];
  console.error(`Invalid environment keys: ${keys.join(", ")}`);
  process.exitCode = 1;
}
