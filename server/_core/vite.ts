import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";
import { applySeoToHtml } from "../seo";
import { makeSsrFetch, renderHtml } from "./ssr";
import type { render as RenderFn } from "../../client/src/entry-server";

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  const clientTemplate = path.resolve(
    import.meta.dirname,
    "../..",
    "client",
    "index.html"
  );

  const loadTemplate = async (url: string) => {
    // always reload index.html from disk in case it changes
    let template = await fs.promises.readFile(clientTemplate, "utf-8");
    template = template.replace(
      `src="/src/entry-client.tsx"`,
      `src="/src/entry-client.tsx?v=${nanoid()}"`
    );
    return vite.transformIndexHtml(url, template);
  };

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const template = await loadTemplate(url);

      // Load the SSR entry through Vite (transpiled + HMR-aware) and render.
      const { render } = (await vite.ssrLoadModule(
        "/src/entry-server.tsx"
      )) as { render: typeof RenderFn };
      const { html: appHtml } = await render(url, {
        fetch: makeSsrFetch(req),
      });

      // head/state filled by steps 07/06; appHtml goes into #root.
      const page = renderHtml(template, { appHtml });
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      // SSR failed — fall back to the SPA shell with string-injected SEO so the
      // page still loads (client renders) instead of erroring.
      vite.ssrFixStacktrace(e as Error);
      console.error("[SSR] dev render failed, serving SPA fallback:", e);
      try {
        let page = await loadTemplate(url);
        page = applySeoToHtml(page, req);
        res.status(200).set({ "Content-Type": "text/html" }).end(page);
      } catch (fallbackErr) {
        next(fallbackErr);
      }
    }
  });
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  // SEO: read the file, inject meta tags, then send
  app.use("*", async (req, res) => {
    try {
      const indexPath = path.resolve(distPath, "index.html");
      let html = await fs.promises.readFile(indexPath, "utf-8");
      html = applySeoToHtml(html, req);
      res.status(200).set({ "Content-Type": "text/html" }).send(html);
    } catch {
      res.sendFile(path.resolve(distPath, "index.html"));
    }
  });
}
