import { describe, it, expect } from "vitest";
import { EMPTY_TEACHER_FORM, slugifyName, teacherFormToInput, teacherToForm } from "./adminForm";

describe("teacher admin form", () => {
  it("slugifyName", () => {
    expect(slugifyName("יונתן בן חנן")).toBe("יונתן-בן-חנן");
    expect(slugifyName("Rav Oded (Pardes)")).toBe("rav-oded-pardes");
  });
  it("validates and normalizes", () => {
    expect(teacherFormToInput(EMPTY_TEACHER_FORM)).toEqual({ error: "נדרש שם" });
    expect(teacherFormToInput({ ...EMPTY_TEACHER_FORM, name: "א", website: "example.com" })).toMatchObject({ error: expect.stringContaining("http") });
    expect(teacherFormToInput({ ...EMPTY_TEACHER_FORM, name: "א", contactEmail: "nope" })).toMatchObject({ error: expect.stringContaining("מייל ליצירת קשר") });
    const r = teacherFormToInput({ ...EMPTY_TEACHER_FORM, name: " יונתן ", area: " ירושלים ", quote: " ", website: "https://a.b", contactEmail: " t@x.y " });
    expect(r).toEqual({ input: expect.objectContaining({ slug: "יונתן", name: "יונתן", area: "ירושלים", quote: null, photo: null, bio: null, contactEmail: "t@x.y" }) });
  });
  it("teacherToForm fills nulls", () => {
    const f = teacherToForm({ slug: "s", name: "n", photo: null, tagline: "", area: "", formats: "", bio: null, quote: null,
      website: "", publicEmail: "", phone: "", contactEmail: "c@d.e", isFounder: true, visible: false });
    expect(f).toMatchObject({ photo: "", bio: "", quote: "", contactEmail: "c@d.e", isFounder: true });
  });
});
