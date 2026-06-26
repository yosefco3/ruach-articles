import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { pathToFileURL } from "url";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";
import { applySeoToHtml } from "../seo";
import { makeSsrFetch, renderHtml } from "./ssr";
import type { render as RenderFn } from "../../client/src/entry-server";

/**
 * True for Vite's content-hashed build outputs (e.g. `index-DFa4nFoc.js`),
 * which can be cached immutably. HTML/manifests/robots return false.
 */
export function isImmutableAsset(filePath: string): boolean {
  // Vite emits every content-hashed bundle under /assets/.
  if (/[\\/]assets[\\/]/.test(filePath)) return true;
  // Hashed filename elsewhere (mixed-case base62 hash before the extension).
  return /[.-][A-Za-z0-9_-]{8,}\.(js|css|mjs|woff2?|ttf|png|jpe?g|svg|webp|avif|gif)$/i.test(
    filePath,
  );
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  // vite.config now exports a function (command-aware); resolve it for serve.
  const resolvedConfig =
    typeof viteConfig === "function"
      ? await viteConfig({ command: "serve", mode: "development" })
      : viteConfig;

  const vite = await createViteServer({
    ...resolvedConfig,
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
      const { html: appHtml, state } = await render(url, {
        fetch: makeSsrFetch(req),
      });

      // appHtml -> #root, state seeds the cache; per-route <head> is injected
      // by applySeoToHtml (the SSR head source — helmet is client-only).
      let page = renderHtml(template, { appHtml, state });
      page = applySeoToHtml(page, req);
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

export async function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  const indexPath = path.resolve(distPath, "index.html");
  const entryServerPath = path.resolve(
    distPath,
    "..",
    "server",
    "entry-server.js"
  );

  // Load the built SSR bundle once (not per request). file:// URL keeps the
  // dynamic import portable; the literal-free path stays a runtime import so
  // esbuild won't try to bundle the separately-built entry-server.js.
  const { render } = (await import(pathToFileURL(entryServerPath).href)) as {
    render: typeof RenderFn;
  };

  // Real static assets first, so /assets/*.js never hit the renderer.
  // index:false so "/" falls through to the SSR handler instead of being
  // served as the raw (empty-#root) index.html.
  app.use(
    express.static(distPath, {
      index: false,
      setHeaders: (res, filePath) => {
        // Content-hashed filenames change whenever content changes, so they're
        // safe to cache for a year. Everything else (index.html, manifests) stays
        // short-lived so SEO/JSON-LD updates take effect on the next load.
        res.setHeader(
          "Cache-Control",
          isImmutableAsset(filePath)
            ? "public, max-age=31536000, immutable"
            : "public, max-age=3600",
        );
      },
    }),
  );

  app.use("*", async (req, res) => {
    try {
      const template = await fs.promises.readFile(indexPath, "utf-8");
      const { html: appHtml, state } = await render(req.originalUrl, {
        fetch: makeSsrFetch(req),
      });
      // appHtml -> #root, state seeds the cache; per-route <head> is injected
      // by applySeoToHtml (the SSR head source — helmet is client-only).
      let page = renderHtml(template, { appHtml, state });
      page = applySeoToHtml(page, req);
      res.status(200).set({ "Content-Type": "text/html" }).send(page);
    } catch (e) {
      // SSR failed — serve the built SPA shell with string-injected SEO.
      console.error("[SSR] prod render failed, serving SPA fallback:", e);
      try {
        let html = await fs.promises.readFile(indexPath, "utf-8");
        html = applySeoToHtml(html, req);
        res.status(200).set({ "Content-Type": "text/html" }).send(html);
      } catch {
        res.sendFile(indexPath);
      }
    }
  });
}
