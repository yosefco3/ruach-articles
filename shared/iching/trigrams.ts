/**
 * 8 הטריגרמות — מבנה קבוע, פורט מהאב-טיפוס (`קריאת-אי-צינג-עצמאי.html`).
 * קידוד ערך טריגרמה: value = (קו תחתון?1:0) + (אמצעי?2:0) + (עליון?4:0) → 0..7.
 * אינדקס המערך === value, לשימור התאמה ל-hexLookup.
 */

export type TrigramKey =
  | "kun"
  | "zhen"
  | "kan"
  | "dui"
  | "gen"
  | "li"
  | "xun"
  | "qian";

export interface Trigram {
  value: number; // 0..7 — תואם hexLookup והאב-טיפוס
  key: TrigramKey; // מזהה יציב ל-DB
  name: string; // מנוקד, מהאב-טיפוס
  element: string; // מנוקד: אֶרֶץ / רַעַם ...
  attr: string; // מסירוּת / תנועה והתעוררות ...
  symbol: string; // ☷ ☳ ☵ ☱ ☶ ☲ ☴ ☰
}

// אינדקס המערך = value. פורט מילה-במילה מהאב-טיפוס (נוקד שם).
export const TRIGRAMS: Trigram[] = [
  { value: 0, key: "kun", name: "הַמְקַבֵּל", element: "אֶרֶץ", attr: "מסירוּת", symbol: "☷" },
  { value: 1, key: "zhen", name: "הַמְעוֹרֵר", element: "רַעַם", attr: "תנועה והתעוררות", symbol: "☳" },
  { value: 2, key: "kan", name: "הַתְּהוֹמִי", element: "מַיִם", attr: "סכנה ועומק", symbol: "☵" },
  { value: 3, key: "dui", name: "הַשָּׂמֵחַ", element: "אֲגַם", attr: "שמחה ופתיחות", symbol: "☱" },
  { value: 4, key: "gen", name: "הַדּוֹמֵם", element: "הַר", attr: "עצירה ושקט", symbol: "☶" },
  { value: 5, key: "li", name: "הַנִּצְמָד", element: "אֵשׁ", attr: "בהירות ואור", symbol: "☲" },
  { value: 6, key: "xun", name: "הֶעָדִין", element: "רוּחַ", attr: "חדירה עדינה", symbol: "☴" },
  { value: 7, key: "qian", name: "הַיּוֹצֵר", element: "שָׁמַיִם", attr: "כוח יוצר", symbol: "☰" },
];