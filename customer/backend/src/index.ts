import "dotenv/config";
import "./config/loadEnv.js";

async function start(): Promise<void> {
  const [{ app }, { env }] = await Promise.all([
    import("./application.mjs"),
    import("./config/env.js"),
  ]);
  app.listen(env.PORT, () => {
    console.info(`Backend listening on port ${env.PORT}`);
  });
}

void start();
