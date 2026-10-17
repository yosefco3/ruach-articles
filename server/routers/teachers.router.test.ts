import { describe, it, expect } from "vitest";
import { makeCaller, publicCtx, userCtx, adminCtx } from "../test-helpers/trpc";

const teacher = (o: Record<string, unknown> = {}) => ({
  id: 1, slug: "yonatan", name: "יונתן בן חנן", photo: null, tagline: "", area: "ירושלים", formats: "אונליין",
  bio: "<p>x</p>", quote: null, website: "", publicEmail: "", phone: "", contactEmail: "secret@example.com",
  userId: 42, isFounder: true, visible: true, sortOrder: 0, createdAt: new Date(), updatedAt: new Date(), ...o,
});

describe("teachers router", () => {
  it("list/bySlug are public, hide contactEmail + userId, expose hasContact", async () => {
    const { caller } = makeCaller(publicCtx(), { listTeachers: async () => [teacher()], getTeacherBySlug: async () => teacher() });
    const [t] = await caller.teachers.list();
    expect(t).not.toHaveProperty("contactEmail");
    expect(t).not.toHaveProperty("userId");
    expect(t).toMatchObject({ slug: "yonatan", hasContact: true });
    expect(await caller.teachers.bySlug({ slug: "yonatan" })).toMatchObject({ name: "יונתן בן חנן" });
  });

  it("hidden teacher: NOT_FOUND for visitors, previewable by admin", async () => {
    const hidden = { getTeacherBySlug: async () => teacher({ visible: false }) };
    await expect(makeCaller(publicCtx(), hidden).caller.teachers.bySlug({ slug: "yonatan" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(makeCaller(adminCtx(), hidden).caller.teachers.bySlug({ slug: "yonatan" })).resolves.toMatchObject({ visible: false });
  });

  it("me/updateMe: only a linked teacher; self-edit is limited to profile fields", async () => {
    const notLinked = makeCaller(userCtx({ dbId: 7 }), { getTeacherByUserId: async () => undefined });
    expect(await notLinked.caller.teachers.me()).toBeNull();
    await expect(notLinked.caller.teachers.updateMe({ area: "חיפה" })).rejects.toMatchObject({ code: "FORBIDDEN" });

    const linked = makeCaller(userCtx({ dbId: 42 }), {
      getTeacherByUserId: async () => teacher(),
      updateTeacher: async (id: number, d: Record<string, unknown>) => teacher({ id, ...d }),
    });
    expect(await linked.caller.teachers.me()).toMatchObject({ id: 1 });
    await linked.caller.teachers.updateMe({ area: "חיפה", website: "https://a.b" });
    expect(linked.db.updateTeacher).toHaveBeenCalledWith(1, { area: "חיפה", website: "https://a.b" });
    // visible/isFounder/slug are not accepted from the teacher
    await expect(linked.caller.teachers.updateMe({ visible: true } as never)).resolves.toBeTruthy();
    expect(linked.db.updateTeacher).toHaveBeenLastCalledWith(1, {});
  });

  it("admin CRUD: create rejects duplicate slug; linkUser resolves the account by email", async () => {
    await expect(makeCaller(userCtx()).caller.teachers.create({ slug: "x", name: "x" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    const { caller, db } = makeCaller(adminCtx(), {
      getTeacherBySlug: async () => undefined,
      createTeacher: async (d: Record<string, unknown>) => teacher(d),
      getUserByEmail: async (e: string) => (e === "t@example.com" ? { id: 55, name: "T", email: e } : undefined),
      getTeacherByUserId: async () => undefined,
      updateTeacher: async (id: number, d: Record<string, unknown>) => teacher({ id, ...d }),
    });
    await caller.teachers.create({ slug: "moreh", name: "מורה", visible: false });
    expect(db.createTeacher).toHaveBeenCalledWith(expect.objectContaining({ slug: "moreh" }));
    await expect(caller.teachers.linkUser({ id: 1, email: "nobody@example.com" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await caller.teachers.linkUser({ id: 1, email: "t@example.com" });
    expect(db.updateTeacher).toHaveBeenCalledWith(1, { userId: 55 });
    await caller.teachers.unlinkUser({ id: 1 });
    expect(db.updateTeacher).toHaveBeenLastCalledWith(1, { userId: null });

    await expect(makeCaller(adminCtx(), { getTeacherBySlug: async () => teacher() }).caller.teachers.create({ slug: "yonatan", name: "x" }))
      .rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("validates: bad website / email", async () => {
    const { caller } = makeCaller(adminCtx());
    await expect(caller.teachers.create({ slug: "a", name: "a", website: "not a url" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.teachers.create({ slug: "a", name: "a", contactEmail: "nope" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.teachers.create({ slug: "a b", name: "a" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
