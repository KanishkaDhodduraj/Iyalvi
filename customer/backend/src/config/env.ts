import "./loadEnv.js";

import { environmentSchema } from "./envSchema.js";

const parsed = environmentSchema.safeParse(process.env);

if (!parsed.success) {
  const keys = [...new Set(parsed.error.issues.map((issue) => String(issue.path[0] ?? "UNKNOWN")))];
  console.error(`Invalid backend environment keys: ${keys.join(", ")}`);
  process.exit(1);
}

export const env = parsed.data;
