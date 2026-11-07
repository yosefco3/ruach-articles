import { Accessibility as AccessibilityIcon } from "lucide-react";
import { AUTHOR_NAME } from "@shared/const";
import { ContactLine, LegalH2, LegalList, LegalPage } from "@/components/LegalPage";

/**
 * /accessibility — public accessibility statement (הצהרת נגישות) per regulation 35ה
 * of the service-accessibility regulations (IS 5568, level AA): the adjustments made,
 * the parts not yet accessible, who is responsible, how to report a problem, the date.
 * Static content by design — update the text and ACCESSIBILITY_LAST_UPDATED together.
 */

export const ACCESSIBILITY_LAST_UPDATED = "7 בנובמבר 2026";

export default function Accessibility() {
  return (
    <LegalPage title="הצהרת נגישות" icon={AccessibilityIcon} lastUpdated={ACCESSIBILITY_LAST_UPDATED}>
      <p>
        אתר דרך הרוח הוא אתר תוכן בנושאי רוחניות ופילוסופיה, ובו כלים לקריאה בקלפי טארוט ובאי
        צ&#39;ינג. אנחנו רוצים שכל אחד יוכל להשתמש בו, כולל אנשים עם מוגבלות. בבניית האתר פעלנו לפי
        התקן הישראלי ת&quot;י 5568 ברמה AA, המבוסס על הנחיות WCAG.
      </p>

      <LegalH2>מה עשינו באתר</LegalH2>
      <LegalList>
        <li>הדפים בנויים במבנה סמנטי: הכותרות, אזורי הניווט והתוכן מסומנים, ולכל דף כותרת ראשית אחת.</li>
        <li>
          בתחילת כל דף יש קישור &quot;דילוג לתוכן הראשי&quot;, והמעבר בין דפים מעביר את המיקוד
          לתוכן.
        </li>
        <li>
          אפשר להפעיל את כל האתר במקלדת, כולל שליפת קלפים, הטלת מטבעות ובחירת הקסגרמה בקריאות.
          הרכיב שבמיקוד מסומן במסגרת בולטת.
        </li>
        <li>שדות הטפסים מקושרים לתוויות שלהם, כך שקוראי מסך מקריאים את שם השדה.</li>
        <li>קוראי מסך מקבלים הודעה כשפירוש של קריאה בהכנה וכשהוא מוכן.</li>
        <li>הטקסט מוצג בניגודיות גבוהה מול הרקע, ואפשר להגדיל את התצוגה בדפדפן ובצביטה בנייד.</li>
        <li>לתמונות יש טקסט חלופי, ואייקונים קישוטיים מוסתרים מקוראי מסך.</li>
        <li>תפריט הניווט בנייד וחלונות קופצים נסגרים במקש Escape.</li>
        <li>כשהגדרת המערכת לצמצום תנועה פעילה, האתר מבטל את ההנפשות.</li>
      </LegalList>

      <LegalH2>מה עדיין לא נגיש במלואו</LegalH2>
      <LegalList>
        <li>
          קבצים מצורפים, כמו מסמכי PDF או הקלטות, אינם נגישים בהכרח. אם תבקשו, נשלח לכם את התוכן
          בגרסה נגישה.
        </li>
        <li>אתרים חיצוניים שהאתר מקשר אליהם, כגון חנויות ספרים ואתרי הרשמה לאירועים, אינם באחריותנו.</li>
      </LegalList>

      <LegalH2>נתקלתם בבעיה? ספרו לנו</LegalH2>
      <p>
        האחראי לנגישות האתר הוא מפעיל האתר, {AUTHOR_NAME}. בכל קושי, שאלה או הצעה לשיפור אפשר לפנות{" "}
        <ContactLine />. כדי שנוכל לטפל בפנייה, כתבו באיזה דף נתקלתם בבעיה, מה ניסיתם לעשות ובאיזה
        דפדפן או טכנולוגיה מסייעת השתמשתם. נשיב בהקדם.
      </p>

      <LegalH2>שירות פיזי</LegalH2>
      <p>לאתר אין משרד או מקום לקבלת קהל.</p>
    </LegalPage>
  );
}
