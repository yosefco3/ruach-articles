import { describe, it, expect, afterAll } from "vitest";
import { like } from "drizzle-orm";
import { getDb } from "./connection";
import { articles, teachers } from "../../drizzle/schema";
import {
  createTeacher, getTeacherBySlug, getTeacherByUserId, listTeachers, updateTeacher, deleteTeacher,
  reorderTeachers, getTeacherArticles,
} from "./teachers";
import { createArticle, getArticleById } from "./articles";

const P = `__test-teacher-${Date.now()}`;

afterAll(async () => {
  const db = await getDb();
  if (db) {
    await db.delete(articles).where(like(articles.slug, "__test-teacher-%"));
    await db.delete(teachers).where(like(teachers.slug, "__test-teacher-%"));
  }
});

describe("teachers db", () => {
  it("creates hidden by default, finds by slug and by linked user, lists visible in order", async () => {
    const db = await getDb();
    if (!db) throw new Error("DB not available — is docker compose up?");
    const a = await createTeacher({ slug: `${P}-a`, name: "מורה א", userId: 987001, visible: true, sortOrder: 2 });
    const b = await createTeacher({ slug: `${P}-b`, name: "מורה ב", visible: true, sortOrder: 1 });
    const hidden = await createTeacher({ slug: `${P}-c`, name: "מורה ג" });
    expect(hidden).toMatchObject({ visible: false, isFounder: false, contactEmail: "" });
    expect(await getTeacherByUserId(987001)).toMatchObject({ id: a.id });
    expect(await getTeacherByUserId(1)).toBeUndefined();
    const vis = (await listTeachers({ visibleOnly: true })).filter((t) => t.slug.startsWith(P));
    expect(vis.map((t) => t.id)).toEqual([b.id, a.id]);
    await reorderTeachers([a.id, b.id]);
    expect((await listTeachers({ visibleOnly: true })).filter((t) => t.slug.startsWith(P)).map((t) => t.id)).toEqual([a.id, b.id]);
  });

  it("teacher articles: published only by default; deleting a teacher detaches, keeps articles", async () => {
    const t = await createTeacher({ slug: `${P}-d`, name: "מורה ד" });
    const mk = (n: number, published: boolean) =>
      createArticle({ title: `מאמר ${n}`, slug: `${P}-art-${n}`, body: "<p>x</p>", category: "teacher", authorId: 1, published, teacherId: t.id });
    const a1 = await mk(1, true); await mk(2, false);
    expect((await getTeacherArticles(t.id)).map((x) => x.title)).toEqual(["מאמר 1"]);
    expect((await getTeacherArticles(t.id, { publishedOnly: false })).length).toBe(2);

    await updateTeacher(t.id, { visible: true, website: "https://example.com" });
    expect(await getTeacherBySlug(`${P}-d`)).toMatchObject({ visible: true, website: "https://example.com" });
    await deleteTeacher(t.id);
    expect(await getTeacherBySlug(`${P}-d`)).toBeUndefined();
    const id = (a1 as { id?: number }).id;
    if (id) expect((await getArticleById(id))?.teacherId).toBeNull();
  });
});
