import { describe, it, expect, vi } from "vitest";
import { serveRobotsTxt } from "./robots";

describe("Robots.txt", () => {
  it("returns valid robots.txt with sitemap reference", () => {
    const req = {} as any;
    const res = {
      status: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      send: vi.fn(),
    } as any;

    serveRobotsTxt(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const body = res.send.mock.calls[0][0] as string;
    expect(body).toContain("User-agent: *");
    expect(body).toContain("Allow: /");
    expect(body).toContain("Disallow: /admin");
    expect(body).toContain("Disallow: /api/");
    expect(body).toContain("Sitemap: https://ruachwisdom.org/sitemap.xml");
  });
});