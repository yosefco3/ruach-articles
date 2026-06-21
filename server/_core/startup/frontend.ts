import type { Express } from "express";
import type { Server } from "http";
import { serveStatic, setupVite } from "../vite";

export async function mountFrontend(
  app: Express,
  server: Server
): Promise<void> {
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    await serveStatic(app);
  }
}