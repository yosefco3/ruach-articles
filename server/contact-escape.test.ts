import { beforeEach, describe, expect, it, vi } from "vitest";
import { contactRouter, escapeHtml } from "./contact";
import { publicCtx } from "./test-helpers/trpc";

// Visitor text from the contact forms goes into the HTML of the notification email.
// It must arrive escaped, or a visitor can inject markup into the owner's inbox.

const { send } = vi.hoisted(() => ({ send: vi.fn().mockResolvedValue({ id: "x" }) }));

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({ emails: { send } })),
}));

vi.mock("./db", () => ({
  getSiteSettings: vi.fn().mockResolvedValue({ siteTitle: "דרך הרוח", contactEmail: "contact@ruach.test" }),
  getTeacherById: vi.fn().mockResolvedValue({ id: 3, name: "מורה <b>", visible: true, contactEmail: "t@ruach.test" }),
}));

const PAYLOAD = `<img src=x onerror="alert(1)"><a href='https://evil.test'>click</a>`;

describe("contact notification emails escape visitor input", () => {
  beforeEach(() => send.mockClear());

  it("escapeHtml escapes & < > \" '", () => {
    expect(escapeHtml(`a&b<c>"d"'e'`)).toBe("a&amp;b&lt;c&gt;&quot;d&quot;&#39;e&#39;");
  });

  it("contact.submit escapes subject, name and message", async () => {
    const caller = contactRouter.createCaller(publicCtx());
    const res = await caller.submit({
      name: `Dana ${PAYLOAD}`,
      email: "dana@example.com",
      subject: `Subject ${PAYLOAD}`,
      message: `Message body ${PAYLOAD}`,
    });
    expect(res.success).toBe(true);
    expect(send).toHaveBeenCalledTimes(1);
    const html: string = send.mock.calls[0][0].html;
    expect(html).not.toContain("<img");
    expect(html).not.toContain("evil.test'>");
    expect(html).toContain("Subject &lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
    expect(html).toContain("Dana &lt;img");
    expect(html).toContain("Message body &lt;img");
  });

  it("contact.toTeacher escapes name and message", async () => {
    const caller = contactRouter.createCaller(publicCtx());
    const res = await caller.toTeacher({
      teacherId: 3,
      name: `Dana ${PAYLOAD}`,
      email: "dana@example.com",
      message: `Message body ${PAYLOAD}`,
    });
    expect(res.success).toBe(true);
    const html: string = send.mock.calls[0][0].html;
    expect(html).not.toContain("<img");
    expect(html).not.toContain("<b>");
    expect(html).toContain("Message body &lt;img");
  });
});
