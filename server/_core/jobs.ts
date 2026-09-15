/**
 * מאגר עבודות רקע בזיכרון — לקריאות AI ארוכות (מודל חושב: 1–2 דקות) שאסור להן
 * להישאר בקשת HTTP פתוחה: Cloudflare מנתק אחרי ~100 שניות (524) בעוד השרת ממשיך.
 * הלקוח מקבל jobId מיד ושואל על התוצאה כל כמה שניות.
 *
 * dyno יחיד ב-Railway → זיכרון מספיק (כמו ה-rate-limiter). אתחול מאבד עבודות —
 * הלקוח מקבל null/NOT_FOUND ומציע ניסיון חוזר. תוצאה נקראת רק ע"י בעל העבודה.
 */
import { randomUUID } from "node:crypto";

export type JobState<T> =
  | { status: "pending" }
  | { status: "done"; result: T }
  | { status: "error"; message: string };

interface JobRecord {
  ownerId: number;
  state: JobState<unknown>;
  /** מתי הסתיימה (done/error) — לניקוי לפי TTL; undefined בזמן ריצה. */
  finishedAt?: number;
}

/** כמה זמן תוצאה נשמרת אחרי סיום — מספיק ל-polling איטי ולריענון דף. */
export const JOB_TTL_MS = 15 * 60 * 1000;

const jobs = new Map<string, JobRecord>();

function sweep(now: number): void {
  jobs.forEach((job, id) => {
    if (job.finishedAt !== undefined && now - job.finishedAt > JOB_TTL_MS) jobs.delete(id);
  });
}

/** מתחיל עבודה מיד (לא ממתין ל-poll) ומחזיר את המזהה. `run` לא אמור לזרוק — אבל אם כן, זו שגיאת עבודה. */
export function startJob<T>(ownerId: number, run: () => Promise<T>): string {
  sweep(Date.now());
  const id = randomUUID();
  const record: JobRecord = { ownerId, state: { status: "pending" } };
  jobs.set(id, record);
  run().then(
    (result) => {
      record.state = { status: "done", result };
      record.finishedAt = Date.now();
    },
    (err: unknown) => {
      record.state = { status: "error", message: err instanceof Error ? err.message : String(err) };
      record.finishedAt = Date.now();
    },
  );
  return id;
}

/** מצב העבודה — null כשאינה קיימת, פגה, או שייכת למשתמש אחר (לא מבדילים, בכוונה). */
export function getJob<T>(id: string, ownerId: number): JobState<T> | null {
  sweep(Date.now());
  const job = jobs.get(id);
  if (!job || job.ownerId !== ownerId) return null;
  return job.state as JobState<T>;
}

/** Test helper — מנקה את כל העבודות. */
export function __resetJobs(): void {
  jobs.clear();
}
