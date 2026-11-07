/**
 * Before the site charges money — the legal checklist (legal-baseline, 2026-11-07).
 *
 * Today the site is free: books link to external stores, events link to external
 * registration, the AI readings cost nothing. The moment the site itself takes money
 * (selling a book or a PDF, a paid reading, a paid event through the site), Israeli
 * consumer, tax, privacy, spam and accessibility rules start to apply.
 *
 * Three places read this file:
 *  - the /admin dashboard card and the inline warnings in AdminBooks / AdminEvents;
 *  - server/commerce-readiness.test.ts, which FAILS as soon as payment code shows up
 *    (a payment SDK in package.json, a checkout route, an orders table) while
 *    COMMERCE_LEGAL_READY is false;
 *  - CLAUDE.md tells every coding session to go through it before payment work.
 *
 * Flip COMMERCE_LEGAL_READY to true only after the owner has done the items that apply
 * (and, preferably, a lawyer has read the terms of sale and the updated privacy policy).
 * Facts were checked against the statute texts on 2026-11-07; "check with a lawyer"
 * marks the points the sources left open.
 */

export const COMMERCE_LEGAL_READY = false;

/** What kind of charging is about to start. */
export type CommerceTrigger =
  | "direct-sale" // the site sells a book / PDF / product itself
  | "paid-ai" // a paid tarot / I Ching reading or subscription
  | "paid-event" // the site collects payment for an event or workshop
  | "external-store"; // a book is offered through a publisher / store link

export const COMMERCE_TRIGGER_LABELS: Record<CommerceTrigger, string> = {
  "direct-sale": "מכירה ישירה באתר",
  "paid-ai": "קריאה בתשלום",
  "paid-event": "אירוע בתשלום",
  "external-store": "קישור לחנות חיצונית",
};

export interface CommerceChecklistItem {
  id: string;
  title: string;
  detail: string;
  appliesTo: CommerceTrigger[];
}

const SITE_SELLS: CommerceTrigger[] = ["direct-sale", "paid-ai"];

export const COMMERCE_CHECKLIST: CommerceChecklistItem[] = [
  {
    id: "seller-identity",
    title: "זהות משפטית של המוכר",
    detail:
      "חוק הגנת הצרכן (סעיף 14ג) מחייב להציג לפני המכירה את שם העוסק, את מספר הזהות שלו ואת הכתובת. שם עט לא מספיק. צריך להחליט עם עורך דין או רואה חשבון: עוסק על שמך או חברה בע\"מ, ואיזה שם יופיע באתר. אותו שם ייכנס גם למדיניות הפרטיות כבעל השליטה במאגר.",
    appliesTo: [...SITE_SELLS, "paid-event"],
  },
  {
    id: "tax-registration",
    title: "רישום כעוסק וקבלות",
    detail:
      "פתיחת תיק במע\"מ (עוסק פטור או מורשה), במס הכנסה ובביטוח לאומי, והפקת קבלה או חשבונית לכל מכירה דרך תוכנה מוכרת. על הקבלה צריך להופיע גם מידע על ביטול העסקה.",
    appliesTo: [...SITE_SELLS, "paid-event"],
  },
  {
    id: "terms-of-sale",
    title: "תקנון רכישה",
    detail:
      "דף נפרד מתנאי השימוש: מחיר כולל מע\"מ ודמי משלוח, מועד ודרך האספקה, אמצעי התשלום, ביטול עסקה והחזרות, ורישיון השימוש בקבצים דיגיטליים. תנאי השימוש הנוכחיים אומרים שהתוכן ניתן בחינם, ולכן גם אותם צריך לעדכן.",
    appliesTo: SITE_SELLS,
  },
  {
    id: "disclosure-and-cancellation",
    title: "גילוי לפני הקנייה וביטול עסקה",
    detail:
      "לפני התשלום: פרטי העוסק, המחיר הכולל, מועד האספקה ותנאי הביטול. עד מועד האספקה: מסמך בכתב (אפשר בדוא\"ל) עם אותם פרטים ודרכי הביטול. ביטול אפשרי עד 14 ימים מקבלת המוצר, בדמי ביטול של עד 5% או 100 ₪, הנמוך מביניהם, וגם בדוא\"ל ובטלפון. צריך קישור בולט לביטול עסקה בדף הבית. לבדוק עם עורך דין אם ספר דיגיטלי (PDF) מוחרג מזכות הביטול.",
    appliesTo: SITE_SELLS,
  },
  {
    id: "payment-provider",
    title: "ספק סליקה",
    detail:
      "סליקה דרך דף תשלום של הספק, כך שפרטי האשראי לא עוברים בשרת של האתר, עם אפשרות לבצע החזר כספי.",
    appliesTo: SITE_SELLS,
  },
  {
    id: "privacy-update",
    title: "עדכון מדיניות הפרטיות",
    detail:
      "להוסיף: פרטי רכישה וכתובת למשלוח, ספק הסליקה ומערכת הקבלות כנמענים, ותקופת השמירה של מסמכי מס. לעדכן את שם בעל השליטה במאגר לזהות המשפטית שנבחרה.",
    appliesTo: [...SITE_SELLS, "paid-event"],
  },
  {
    id: "accessibility-checkout",
    title: "נגישות מסלול הקנייה",
    detail:
      "עוסק פטור, או עסק שהמחזור השנתי הממוצע שלו אינו עולה על 100,000 ₪, פטור מחובת הנגשת האתר (תקנה 35ו(ז) בתקנות הנגישות לשירות). מעל זה, כל מסלול הקנייה (עגלה, תשלום, אישור) חייב לעמוד בת\"י 5568 ברמה AA, והצהרת הנגישות צריכה לכלול אותו.",
    appliesTo: SITE_SELLS,
  },
  {
    id: "marketing-email",
    title: "דיוור שיווקי",
    detail:
      "ניוזלטר שמציע משהו למכירה, גם ספר בחנות חיצונית, הוא דבר פרסומת לפי סעיף 30א בחוק התקשורת: נדרשת הסכמה מפורשת מראש, המילה \"פרסומת\" בשורת הנושא, פרטי השולח וקישור הסרה שעובד.",
    appliesTo: ["direct-sale", "paid-ai", "paid-event", "external-store"],
  },
  {
    id: "external-store",
    title: "מכירה דרך חנות חיצונית",
    detail:
      "כשהספר נמכר דרך ההוצאה, Bookpod או e-vrit, החנות היא העוסק והאתר רק מקשר אליה. אם האתר מקבל עמלה על כל מכירה, מומלץ לציין זאת ליד הקישור.",
    appliesTo: ["external-store"],
  },
  {
    id: "paid-event-seller",
    title: "מי גובה על האירוע",
    detail:
      "כשהמנחה גובה דרך אתר הרשמה חיצוני, המנחה הוא העוסק. אם האתר עצמו גובה, חלים עליו כל סעיפי המכירה הישירה, כולל תנאי ביטול לאירוע.",
    appliesTo: ["paid-event"],
  },
  {
    id: "lawyer-review",
    title: "קריאה של עורך דין",
    detail:
      "לפני ההשקה: עורך דין עובר על תקנון הרכישה, על מדיניות הפרטיות ועל תנאי השימוש המעודכנים.",
    appliesTo: [...SITE_SELLS, "paid-event"],
  },
];

export function checklistFor(trigger: CommerceTrigger): CommerceChecklistItem[] {
  return COMMERCE_CHECKLIST.filter((item) => item.appliesTo.includes(trigger));
}

/** An event price that means money changes hands ("" / "חינם" / "0" do not). */
export function isPaidPrice(price: string | null | undefined): boolean {
  const p = (price ?? "").trim();
  if (p === "") return false;
  if (/^(חינם|ללא עלות|ללא תשלום|free)$/i.test(p)) return false;
  if (/^0+([.,]0+)?\s*(₪|ש"ח|שח)?$/.test(p)) return false;
  return true;
}
