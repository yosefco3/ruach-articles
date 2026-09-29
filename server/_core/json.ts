/**
 * חילוץ JSON מתשובות של מודל שפה — טהור, בלי תלות ברשת או ב-env.
 */

/**
 * אובייקט ה-JSON התקין האחרון בטקסט (החיצוני ביותר שמסתיים בסוגר האחרון שניתן לפענח),
 * או null. עמיד לגדרות ```json```, לטקסט עוטף ולטיוטות JSON קודמות בתוך חשיבה.
 */
export function extractLastJsonObject(text: string): string | null {
  const starts: number[] = [];
  const ends: number[] = [];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "{") starts.push(i);
    else if (text[i] === "}") ends.push(i);
  }
  let attempts = 0;
  for (let e = ends.length - 1; e >= 0; e--) {
    for (const start of starts) {
      if (start > ends[e]) break;
      if (++attempts > 500) return null;
      const candidate = text.slice(start, ends[e] + 1);
      try {
        const parsed: unknown = JSON.parse(candidate);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return candidate;
      } catch {
        /* לא JSON — ממשיכים למועמד הבא */
      }
    }
  }
  return null;
}
