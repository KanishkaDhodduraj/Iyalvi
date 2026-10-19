import { app } from "./app.js";
import { env } from "./config/env.js";

async function start(): Promise<void> {
  const onListening = () => console.info(`Admin API listening on port ${env.PORT}`);
  if (env.NODE_ENV === "development") {
    app.listen(env.PORT, "127.0.0.1", onListening);
  } else {
    app.listen(env.PORT, onListening);
  }
}

void start();
