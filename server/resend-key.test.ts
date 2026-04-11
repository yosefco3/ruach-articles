import { describe, it, expect } from "vitest";
import { Resend } from "resend";

describe("Resend API key validation", () => {
  it("should authenticate successfully with the provided API key", async () => {
    const apiKey = process.env.RESEND_API_KEY;
    expect(apiKey, "RESEND_API_KEY must be set").toBeTruthy();

    const resend = new Resend(apiKey);
    // List domains — lightweight call that validates the API key without sending email
    const { data, error } = await resend.domains.list();
    expect(error, `Resend API error: ${JSON.stringify(error)}`).toBeNull();
    expect(data).toBeDefined();
  });
});
