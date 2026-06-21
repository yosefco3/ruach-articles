/**
 * מנוע ההטלה — פורט מהאב-טיפוס (`onCast`/`buildHex`/`finish`).
 * שיטת 3 המטבעות: 6 הטלות (קו 1 מלמטה עד 6), ערך 6/7/8/9, קווים משתנים,
 * הקסגרמה ראשית ונגזרת. פונקציה טהורה עם RNG מוזרק לבדיקות.
 * אין UI/DB — האנימציה (08) רק *חושפת* את התוצאה שכבר חושבה כאן.
 */
import { hexagramByTrigrams, type HexagramStruct } from "./hexagrams";

export type Rng = () => number; // [0,1) — ברירת מחדל Math.random
export type CoinFace = 2 | 3; // 2 = יִין-פֵּיס, 3 = יָאנְג-פֵּיס
export type LineSum = 6 | 7 | 8 | 9;

export interface Toss {
  coins: [CoinFace, CoinFace, CoinFace];
  sum: LineSum;
}
export interface Line {
  isYang: boolean;
  isChanging: boolean;
}
export interface Reading {
  tosses: Toss[]; // 6, אינדקס 0 = קו תחתון
  lines: Line[]; // 6, מקבילים ל-tosses
  primary: HexagramStruct;
  changing: number[]; // מספרי קו 1..6 שמשתנים
  resultLines?: Line[]; // אחרי היפוך הקווים המשתנים
  resulting?: HexagramStruct;
}

export const SUM_NAMES: Record<LineSum, string> = {
  6: "יִין מִשְׁתַּנֶּה",
  7: "יָאנְג צָעִיר",
  8: "יִין צָעִיר",
  9: "יָאנְג מִשְׁתַּנֶּה",
};

function coin(rng: Rng): CoinFace {
  return rng() < 0.5 ? 3 : 2;
}

export function tossLine(rng: Rng = Math.random): Toss {
  const coins: [CoinFace, CoinFace, CoinFace] = [coin(rng), coin(rng), coin(rng)];
  const sum = (coins[0] + coins[1] + coins[2]) as LineSum;
  return { coins, sum };
}

function lineFromSum(sum: LineSum): Line {
  return { isYang: sum % 2 === 1, isChanging: sum === 6 || sum === 9 };
}
function trigramValue(lines: Line[]): number {
  return (lines[0].isYang ? 1 : 0) + (lines[1].isYang ? 2 : 0) + (lines[2].isYang ? 4 : 0);
}
function buildHex(lines: Line[]): HexagramStruct {
  return hexagramByTrigrams(trigramValue(lines.slice(0, 3)), trigramValue(lines.slice(3, 6)))!;
}

export function cast(rng: Rng = Math.random): Reading {
  const tosses = Array.from({ length: 6 }, () => tossLine(rng));
  const lines = tosses.map((t) => lineFromSum(t.sum));
  const primary = buildHex(lines);
  const changing = lines.flatMap((l, i) => (l.isChanging ? [i + 1] : []));

  let resultLines: Line[] | undefined;
  let resulting: HexagramStruct | undefined;
  if (changing.length) {
    resultLines = lines.map((l) => ({
      isYang: l.isChanging ? !l.isYang : l.isYang,
      isChanging: false,
    }));
    resulting = buildHex(resultLines);
  }
  return { tosses, lines, primary, changing, resultLines, resulting };
}
