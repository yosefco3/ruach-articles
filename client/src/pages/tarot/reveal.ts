/**
 * מנוע חשיפת השליפה — מנותק מ-React כדי שיהיה נבדק (התבנית של iching/reveal).
 * האנימציה ויזואלית בלבד; התוצאה כבר חושבה ע"י `draw()`. הרצף: ערבוב החפיסה →
 * פריסת שלושה קלפים הפוכים → היפוך אחד-אחד.
 */
export interface DealCallbacks {
  onShuffleStart: () => void; // ערימת הגבות רועדת
  onDeal: (i: number) => void; // קלף i (0..2) נפרס, עדיין הפוך
  onFlip: (i: number) => void; // קלף i מתהפך ונחשף
  onDone: () => void; // הכול חשוף → phase=result
}

export interface DealOptions {
  shuffleMs?: number; // משך הערבוב (ברירת מחדל 1200)
  dealMs?: number; // המתנה בין פריסות (ברירת מחדל 350)
  flipMs?: number; // המתנה בין היפוכים (ברירת מחדל 900)
  reducedMotion?: boolean; // דילוג מיידי ללא השהיות
  setTimeoutFn?: (fn: () => void, ms: number) => ReturnType<typeof setTimeout>;
  clearTimeoutFn?: (h: ReturnType<typeof setTimeout>) => void;
}

export const SPREAD = 3;

/** מריץ את רצף החשיפה ומחזיר פונקציית ביטול (לניקוי טיימרים). */
export function runDeal(cb: DealCallbacks, opts: DealOptions = {}): () => void {
  const shuffleMs = opts.shuffleMs ?? 1200;
  const dealMs = opts.dealMs ?? 350;
  const flipMs = opts.flipMs ?? 900;
  const st = opts.setTimeoutFn ?? ((fn, ms) => setTimeout(fn, ms));
  const ct = opts.clearTimeoutFn ?? ((h) => clearTimeout(h));

  if (opts.reducedMotion) {
    for (let i = 0; i < SPREAD; i++) cb.onDeal(i);
    for (let i = 0; i < SPREAD; i++) cb.onFlip(i);
    cb.onDone();
    return () => {};
  }

  const timers: ReturnType<typeof setTimeout>[] = [];
  let cancelled = false;
  const at = (ms: number, fn: () => void) =>
    timers.push(
      st(() => {
        if (!cancelled) fn();
      }, ms),
    );

  cb.onShuffleStart();
  let t = shuffleMs;
  for (let i = 0; i < SPREAD; i++) {
    const idx = i;
    at(t, () => cb.onDeal(idx));
    t += dealMs;
  }
  t += 250; // נשימה קצרה בין הפריסה להיפוך הראשון
  for (let i = 0; i < SPREAD; i++) {
    const idx = i;
    at(t, () => cb.onFlip(idx));
    t += flipMs;
  }
  at(t, () => cb.onDone());

  return () => {
    cancelled = true;
    timers.forEach((h) => ct(h));
  };
}
