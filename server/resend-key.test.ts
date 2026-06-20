import { describe, it, expect } from "vitest";
import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

// Live integration check — hits the real Resend API. Only meaningful when a key
// is configured, so skip (rather than fail) when it's absent (CI, local dev).
describe.skipIf(!apiKey)("Resend API key validation (live)", () => {
  it("should authenticate successfully with the provided API key", async () => {
    const resend = new Resend(apiKey);
    // List domains — lightweight call that validates the API key without sending email
    const { data, error } = await resend.domains.list();
    expect(error, `Resend API error: ${JSON.stringify(error)}`).toBeNull();
    expect(data).toBeDefined();
  });
});
