import "dotenv/config";
import { createApp } from "./startup/express";
import { mountApiRoutes } from "./startup/routes";
import { mountSeoRoutes } from "./startup/seo-routes";
import { mountFrontend } from "./startup/frontend";
import { startListening } from "./startup/server";
import { setupOAuth } from "./oauth";

async function startServer() {
  const { app, server } = createApp();
  setupOAuth(app);
  mountApiRoutes(app);
  mountSeoRoutes(app);
  await mountFrontend(app, server);
  await startListening(server);
}

startServer().catch(console.error);