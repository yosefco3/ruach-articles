import { Link } from "wouter";
import { ArrowLeft, Accessibility as AccessibilityIcon } from "lucide-react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

/**
 * /accessibility — public accessibility statement (הצהרת נגישות), as expected
 * by the Israeli service-accessibility regulations (IS 5568 / WCAG AA).
 * Static content by design — update the text (and the date below) here.
 */

const LAST_UPDATED = "10 בספטמבר 2026";
const CONTACT_EMAIL = "yosefco12@gmail.com";

export default function Accessibility() {
  useDocumentTitle("הצהרת נגישות | רוח חכמה");

  return (
    <div className="min-h-screen" dir="rtl">
      <div className="container max-w-3xl pt-10 pb-20">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-10 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          חזרה לדף הבית
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
            <AccessibilityIcon className="w-6 h-6 text-primary" />
          </div>
          <h1 className="font-display font-bold text-4xl text-foreground tracking-tight">
            הצהרת נגישות
          </h1>
        </div>

        <div className="prose-rtl max-w-none space-y-6">
          <p>
            אתר רוח חכמה הוא אתר תוכן חינמי בנושאי רוחניות, פילוסופיה וריפוי. אנו
            רואים חשיבות בהנגשת התוכן לכלל הציבור, ובכלל זה אנשים עם מוגבלות,
            ופועלים להתאמת האתר להנחיות הנגישות WCAG 2.1 ברמה AA, ברוח התקן
            הישראלי (ת&quot;י 5568).
          </p>

          <h2 className="font-display font-bold text-2xl text-foreground pt-2">
            מה נגיש באתר כיום
          </h2>
          <ul className="list-disc pr-6 space-y-2">
            <li>האתר בנוי במבנה סמנטי תקין (כותרות, אזורי ניווט ותוכן מסומנים).</li>
            <li>ניתן להגדיל את התצוגה בכל מכשיר, כולל צביטה (zoom) בנייד.</li>
            <li>קישור &quot;דילוג לתוכן הראשי&quot; זמין למשתמשי מקלדת, והמעבר בין דפים מעביר את המיקוד לתוכן.</li>
            <li>מסלול הקריאה המרכזי — דף הבית, המאמרים והחיפוש — נגיש לניווט במקלדת ולקוראי מסך.</li>
            <li>לתמונות באתר מוצמד טקסט חלופי.</li>
            <li>האתר מכבד את העדפת המערכת לצמצום אנימציות (reduced motion) בדפים המונפשים.</li>
          </ul>

          <h2 className="font-display font-bold text-2xl text-foreground pt-2">
            מה עדיין בתהליך הנגשה
          </h2>
          <p>אנו פועלים בשקיפות: החלקים הבאים עדיין אינם נגישים במלואם, והנגשתם מתוכננת בהמשך.</p>
          <ul className="list-disc pr-6 space-y-2">
            <li>דפי הקריאה האינטראקטיביים בקלפי טארוט ובאי־צ&#39;ינג אינם נגישים עדיין במלואם לניווט במקלדת.</li>
            <li>תכנים שנטענים באופן דינמי (כגון פירוש אישי) אינם מוכרזים עדיין אוטומטית לקוראי מסך.</li>
          </ul>

          <h2 className="font-display font-bold text-2xl text-foreground pt-2">
            נתקלתם בבעיה? ספרו לנו
          </h2>
          <p>
            אם נתקלתם בקושי בשימוש באתר או שיש לכם הצעה לשיפור הנגישות, נשמח
            שתפנו אלינו ונטפל בפנייה בהקדם:
          </p>
          <ul className="list-disc pr-6 space-y-2">
            <li>
              בדוא&quot;ל:{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline underline-offset-4">
                {CONTACT_EMAIL}
              </a>
            </li>
            <li>
              דרך{" "}
              <Link href="/contact" className="text-primary underline underline-offset-4">
                טופס יצירת הקשר
              </Link>{" "}
              באתר.
            </li>
          </ul>

          <p className="text-sm text-muted-foreground pt-4">
            ההצהרה עודכנה לאחרונה בתאריך {LAST_UPDATED}.
          </p>
        </div>
      </div>
    </div>
  );
}
