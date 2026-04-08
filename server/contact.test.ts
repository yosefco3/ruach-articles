import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the notifyOwner function
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn(async () => true),
}));

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("contact.submit", () => {
  it("submits contact form with valid data", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.contact.submit({
      name: "יוסף כהן",
      email: "yosef@example.com",
      subject: "שאלה על הפלטפורמה",
      message: "זו הודעה ארוכה מספיק לבדיקה",
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain("בהצלחה");
  });

  it("rejects contact form with invalid email", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.contact.submit({
        name: "יוסף כהן",
        email: "invalid-email",
        subject: "שאלה על הפלטפורמה",
        message: "זו הודעה ארוכה מספיק לבדיקה",
      });
      expect.fail("Should have thrown validation error");
    } catch (err: any) {
      expect(err.code).toBe("BAD_REQUEST");
    }
  });

  it("rejects contact form with short name", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.contact.submit({
        name: "א",
        email: "yosef@example.com",
        subject: "שאלה על הפלטפורמה",
        message: "זו הודעה ארוכה מספיק לבדיקה",
      });
      expect.fail("Should have thrown validation error");
    } catch (err: any) {
      expect(err.code).toBe("BAD_REQUEST");
    }
  });

  it("rejects contact form with short subject", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.contact.submit({
        name: "יוסף כהן",
        email: "yosef@example.com",
        subject: "קצר",
        message: "זו הודעה ארוכה מספיק לבדיקה",
      });
      expect.fail("Should have thrown validation error");
    } catch (err: any) {
      expect(err.code).toBe("BAD_REQUEST");
    }
  });

  it("rejects contact form with short message", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.contact.submit({
        name: "יוסף כהן",
        email: "yosef@example.com",
        subject: "שאלה על הפלטפורמה",
        message: "קצר",
      });
      expect.fail("Should have thrown validation error");
    } catch (err: any) {
      expect(err.code).toBe("BAD_REQUEST");
    }
  });
});
