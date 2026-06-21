/**
 * מנוע חשיפת ההטלה — פורט מ-`runThrow` באב-טיפוס, מנותק מ-React כדי שיהיה נבדק.
 * האנימציה ויזואלית בלבד; התוצאה כבר חושבה ע"י `cast()`. כאן רק חושפים בקצב.
 */
export interface RevealCallbacks {
  onFlipStart: (i: number) => void; // קו i מתחיל — flipping
  onSettle: (i: number) => void; // קו i נחשף (revealCount = i+1)
  onDone: () => void; // כל 6 הקווים נחשפו → phase=result
}

export interface RevealOptions {
  flipMs?: number; // משך סיבוב המטבעות (ברירת מחדל 750)
  betweenMs?: number; // המתנה בין קווים (ברירת מחדל 1250)
  reducedMotion?: boolean; // דילוג מיידי ללא השהיות
  setTimeoutFn?: (fn: () => void, ms: number) => ReturnType<typeof setTimeout>;
  clearTimeoutFn?: (h: ReturnType<typeof setTimeout>) => void;
}

/** מריץ את רצף החשיפה ומחזיר פונקציית ביטול (לניקוי טיימרים). */
export function runReveal(cb: RevealCallbacks, opts: RevealOptions = {}): () => void {
  const flipMs = opts.flipMs ?? 750;
  const betweenMs = opts.betweenMs ?? 1250;
  const st = opts.setTimeoutFn ?? ((fn, ms) => setTimeout(fn, ms));
  const ct = opts.clearTimeoutFn ?? ((h) => clearTimeout(h));

  if (opts.reducedMotion) {
    for (let i = 0; i < 6; i++) cb.onSettle(i);
    cb.onDone();
    return () => {};
  }

  const timers: ReturnType<typeof setTimeout>[] = [];
  let cancelled = false;

  function step(i: number) {
    if (cancelled) return;
    if (i >= 6) {
      cb.onDone();
      return;
    }
    cb.onFlipStart(i);
    timers.push(
      st(() => {
        if (cancelled) return;
        cb.onSettle(i);
        timers.push(st(() => step(i + 1), betweenMs));
      }, flipMs),
    );
  }
  step(0);

  return () => {
    cancelled = true;
    timers.forEach((t) => ct(t));
  };
}
