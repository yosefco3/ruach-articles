/**
 * שימור פריסה/קריאה סביב התחברות גוגל: לחיצה על "התחבר עם גוגל" מפנה לדף חיצוני
 * וה-state של React אובד. לפני הניווט שומרים את הקריאה ב-sessionStorage, ואחרי
 * החזרה (returnTo לאותו דף) הדף משחזר אותה פעם אחת ומוחק. תוקף: 30 דקות.
 */
import { cardById, type TarotReading } from "@shared/tarot";
import type { Reading as IchingReading } from "@shared/iching";

const TAROT_KEY = "tarot:pending-reading";
const ICHING_KEY = "iching:pending-reading";
const TTL_MS = 30 * 60 * 1000;

function storageSet(key: string, value: unknown): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* אחסון חסום (מצב פרטי וכו') — פשוט לא נשחזר */
  }
}

/** קורא ומוחק (פעם אחת), null אם אין/פג תוקף/לא תקין. */
function storageTake(key: string): { q: string; ts: number; payload: unknown } | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    sessionStorage.removeItem(key);
    const parsed = JSON.parse(raw) as { q?: unknown; ts?: unknown; payload?: unknown };
    if (typeof parsed.q !== "string" || typeof parsed.ts !== "number") return null;
    if (Date.now() - parsed.ts > TTL_MS) return null;
    return { q: parsed.q, ts: parsed.ts, payload: parsed.payload };
  } catch {
    return null;
  }
}

// ── טארוט: שומרים רק את מזהי הקלפים ומרכיבים מחדש מ-shared ──

export function savePendingTarot(q: string, reading: TarotReading): void {
  storageSet(TAROT_KEY, { q, ts: Date.now(), payload: reading.cards.map((c) => c.card.id) });
}

export function takePendingTarot(): { q: string; reading: TarotReading } | null {
  const saved = storageTake(TAROT_KEY);
  if (!saved || !Array.isArray(saved.payload) || saved.payload.length === 0) return null;
  const cards = [];
  for (let i = 0; i < saved.payload.length; i++) {
    const struct = typeof saved.payload[i] === "string" ? cardById(saved.payload[i]) : undefined;
    if (!struct) return null;
    cards.push({ card: struct, position: i, orientation: "upright" as const });
  }
  return { q: saved.q, reading: { cards } };
}

// ── אי-צ'ינג: הקריאה היא אובייקט JSON טהור — נשמרת כמות שהיא ──

function isValidIchingReading(r: unknown): r is IchingReading {
  const x = r as IchingReading | null;
  return (
    !!x &&
    Array.isArray(x.lines) &&
    x.lines.length === 6 &&
    Array.isArray(x.tosses) &&
    Array.isArray(x.changing) &&
    typeof x.primary?.number === "number" &&
    (x.changing.length === 0 || (!!x.resulting && Array.isArray(x.resultLines)))
  );
}

export function savePendingIching(q: string, reading: IchingReading): void {
  storageSet(ICHING_KEY, { q, ts: Date.now(), payload: reading });
}

export function takePendingIching(): { q: string; reading: IchingReading } | null {
  const saved = storageTake(ICHING_KEY);
  if (!saved || !isValidIchingReading(saved.payload)) return null;
  return { q: saved.q, reading: saved.payload };
}
