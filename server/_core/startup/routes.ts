import type { Express } from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../../routers/index";
import { createContext } from "../context";
import { uploadRouter } from "../../upload";
import { articleDocxRouter } from "../../articleDocxRoute";

export function mountApiRoutes(app: Express): void {
  // File upload endpoint
  app.use(uploadRouter);
  // Article Word document download
  app.use(articleDocxRouter);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
}