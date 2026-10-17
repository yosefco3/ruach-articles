import { and, asc, desc, eq } from "drizzle-orm";
import { articles, teachers, users, type InsertTeacher } from "../../drizzle/schema";
import { getDb } from "./connection";

/**
 * מורים בשיטה (site-pivot-books). קריאה סובלנית לטבלה חסרה (פרודקשן לפני 0023).
 */
export async function listTeachers(opts?: { visibleOnly?: boolean }) {
  try {
    const db = await getDb();
    if (!db) return [];
    const q = db.select().from(teachers).orderBy(asc(teachers.sortOrder), asc(teachers.id));
    return opts?.visibleOnly ? await q.where(eq(teachers.visible, true)) : await q;
  } catch (err) {
    console.warn("[teachers] listTeachers failed (missing table?):", err);
    return [];
  }
}

export async function getTeacherBySlug(slug: string) {
  try {
    const db = await getDb();
    if (!db) return undefined;
    const rows = await db.select().from(teachers).where(eq(teachers.slug, slug)).limit(1);
    return rows[0];
  } catch (err) {
    console.warn("[teachers] getTeacherBySlug failed (missing table?):", err);
    return undefined;
  }
}

export async function getTeacherById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(teachers).where(eq(teachers.id, id)).limit(1);
  return rows[0];
}

/** המורה המקושר לחשבון (אם יש) — הבסיס להרשאת "מורה כותב ומפרסם בעצמו". */
export async function getTeacherByUserId(userId: number) {
  try {
    const db = await getDb();
    if (!db) return undefined;
    const rows = await db.select().from(teachers).where(eq(teachers.userId, userId)).limit(1);
    return rows[0];
  } catch (err) {
    console.warn("[teachers] getTeacherByUserId failed (missing table?):", err);
    return undefined;
  }
}

export async function createTeacher(data: InsertTeacher) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(teachers).values(data);
  const created = await getTeacherBySlug(data.slug);
  if (!created) throw new Error("Teacher insert failed");
  return created;
}

export async function updateTeacher(id: number, data: Partial<InsertTeacher>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(teachers).set(data).where(eq(teachers.id, id));
  return getTeacherById(id);
}

export async function deleteTeacher(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // המאמרים נשארים — רק מתנתקים מהמורה.
  await db.update(articles).set({ teacherId: null }).where(eq(articles.teacherId, id));
  await db.delete(teachers).where(eq(teachers.id, id));
}

export async function reorderTeachers(ids: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  for (let i = 0; i < ids.length; i++) {
    await db.update(teachers).set({ sortOrder: i }).where(eq(teachers.id, ids[i]));
  }
}

/** המאמרים של מורה, חדש→ישן. */
export async function getTeacherArticles(teacherId: number, opts?: { publishedOnly?: boolean }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(articles.teacherId, teacherId)];
  if (opts?.publishedOnly !== false) conditions.push(eq(articles.published, true));
  return db
    .select({
      id: articles.id, title: articles.title, slug: articles.slug, excerpt: articles.excerpt,
      coverImage: articles.coverImage, category: articles.category, tags: articles.tags,
      published: articles.published, createdAt: articles.createdAt, teacherId: articles.teacherId,
    })
    .from(articles)
    .where(and(...conditions))
    .orderBy(desc(articles.createdAt));
}

/** חשבון לפי מייל — לקישור מורה לחשבון גוגל מהאדמין. */
export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select({ id: users.id, name: users.name, email: users.email }).from(users)
    .where(eq(users.email, email)).limit(1);
  return rows[0];
}
