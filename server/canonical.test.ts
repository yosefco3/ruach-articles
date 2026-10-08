import { describe, it, expect, vi } from "vitest";
import { canonicalRedirect, canonicalRedirectTarget } from "./canonical";

const apex = "ruachwisdom.org";

describe("canonicalRedirectTarget", () => {
  it("www host → 301 to the apex, path and query preserved", () => {
    expect(
      canonicalRedirectTarget({ method: "GET", host: "www.ruachwisdom.org", originalUrl: "/tarot?x=1" }),
    ).toBe("https://ruachwisdom.org/tarot?x=1");
  });

  it("www host with a trailing slash fixes both in one hop", () => {
    expect(
      canonicalRedirectTarget({ method: "GET", host: "WWW.ruachwisdom.org:443", originalUrl: "/about/" }),
    ).toBe("https://ruachwisdom.org/about");
  });

  it("trailing slash on the apex → relative redirect without it", () => {
    expect(canonicalRedirectTarget({ method: "GET", host: apex, originalUrl: "/tarot/" })).toBe("/tarot");
    expect(canonicalRedirectTarget({ method: "HEAD", host: apex, originalUrl: "/article/rambam1/?a=b" })).toBe(
      "/article/rambam1?a=b",
    );
    expect(canonicalRedirectTarget({ method: "GET", host: apex, originalUrl: "/x///" })).toBe("/x");
  });

  it("already canonical → null", () => {
    expect(canonicalRedirectTarget({ method: "GET", host: apex, originalUrl: "/" })).toBeNull();
    expect(canonicalRedirectTarget({ method: "GET", host: apex, originalUrl: "/tarot?x=1" })).toBeNull();
    expect(canonicalRedirectTarget({ method: "GET", host: "localhost:5173", originalUrl: "/about" })).toBeNull();
  });

  it("never touches the root, API, uploads or Cloudflare paths, or non-GET requests", () => {
    expect(canonicalRedirectTarget({ method: "GET", host: apex, originalUrl: "/api/trpc/x/" })).toBeNull();
    expect(canonicalRedirectTarget({ method: "GET", host: apex, originalUrl: "/uploads/a/" })).toBeNull();
    expect(canonicalRedirectTarget({ method: "GET", host: apex, originalUrl: "/cdn-cgi/l/" })).toBeNull();
    expect(canonicalRedirectTarget({ method: "POST", host: "www.ruachwisdom.org", originalUrl: "/x/" })).toBeNull();
  });
});

describe("canonicalRedirect middleware", () => {
  it("sends a 301 and does not call next when a target exists", () => {
    const req = { method: "GET", headers: { host: "www.ruachwisdom.org" }, originalUrl: "/derech" } as any;
    const res = { redirect: vi.fn() } as any;
    const next = vi.fn();
    canonicalRedirect(req, res, next);
    expect(res.redirect).toHaveBeenCalledWith(301, "https://ruachwisdom.org/derech");
    expect(next).not.toHaveBeenCalled();
  });

  it("passes a canonical request through", () => {
    const req = { method: "GET", headers: { host: apex }, originalUrl: "/derech" } as any;
    const res = { redirect: vi.fn() } as any;
    const next = vi.fn();
    canonicalRedirect(req, res, next);
    expect(res.redirect).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });
});
