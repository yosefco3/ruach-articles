/**
 * מאמר העוגן — /tarot/guide: "המדריך לקלפי הטארוט".
 * דף קוד סטטי (כמו /derech): תוכן לפי docs/GEO-WRITING.md — תשובה-קודם,
 * H2 כשאלות, נתונים ספציפיים — ומקשר פנימית לכל 78 דפי הקלפים.
 * ה-FAQ מגיע מ-shared/tarotGuide (אותו טקסט שמוזרק כ-FAQPage JSON-LD).
 */
import { Link } from "wouter";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { cardSlug } from "@shared/tarot";
import { TAROT_GUIDE_FAQ } from "@shared/tarotGuide";
import { deckSections } from "@/pages/tarot/model";

const SERIF = "'Frank Ruhl Libre',serif";
const SANS = "'Heebo',sans-serif";
const LINK_STYLE = { color: "oklch(0.45 0.10 55)", fontWeight: 600 } as const;

const H2_STYLE = {
  fontFamily: SERIF,
  fontWeight: 900,
  fontSize: 27,
  margin: "48px 0 12px",
  color: "oklch(0.26 0.04 55)",
  lineHeight: 1.3,
} as const;

const P_STYLE = { fontSize: 17, lineHeight: 1.95, margin: "0 0 14px" } as const;

export default function TarotGuide() {
  useDocumentTitle("המדריך לקלפי הטארוט — פירוש כל 78 הקלפים | רוח חכמה");
  const sections = deckSections();

  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100vh",
        background: "oklch(0.97 0.014 85)",
        color: "oklch(0.24 0.028 55)",
        fontFamily: SANS,
        lineHeight: 1.8,
      }}
    >
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "56px 24px 96px" }}>
        <nav aria-label="ניווט" style={{ fontSize: 14, color: "oklch(0.50 0.03 60)" }}>
          <Link href="/" style={LINK_STYLE}>רוח חכמה</Link>
          {" › "}
          <Link href="/tarot" style={LINK_STYLE}>טארוט</Link>
          {" › "}
          <span>המדריך לקלפים</span>
        </nav>

        <h1
          style={{
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: "clamp(34px,6vw,50px)",
            margin: "34px 0 14px",
            color: "oklch(0.24 0.03 55)",
            lineHeight: 1.2,
          }}
        >
          המדריך לקלפי הטארוט
        </h1>

        {/* תשובה-קודם: הפסקה הראשונה עונה על "מה זה טארוט" */}
        <p style={{ ...P_STYLE, fontSize: 18.5, fontWeight: 500 }}>
          טארוט הוא חפיסה של 78 קלפים מצוירים — 22 קלפי ארקנה גדולה ו־56 קלפי ארקנה
          קטנה — המשמשת מאות שנים כשפה של דימויים: כל קלף הוא תמונה של מצב אנושי,
          כוח נפשי או תנועה פנימית. בקריאת טארוט שולפים קלפים אחדים מול שאלה,
          והתמונות משמשות מראה סמלית שמסייעת לראות את המצב בבהירות. בגישת האתר
          הזה הקלפים אינם מגידים עתידות — הם מצביעים על נטיות, וההכרעה נשארת
          בידי השואל.
        </p>

        <h2 style={H2_STYLE}>מהי חפיסת ריידר־וייט?</h2>
        <p style={P_STYLE}>
          חפיסת ריידר־וייט (Rider–Waite) היא חפיסת הטארוט הנפוצה בעולם, שראתה אור
          בלונדון בשנת 1909 בהוצאת William Rider &amp; Son. את הקלפים ציירה האמנית
          פמלה קולמן סמית' לפי הנחיותיו של החוקר ארתור אדוארד וייט. חידושה הגדול:
          גם 56 קלפי הארקנה הקטנה צוירו כסצנות מלאות — ולא כסמלים חוזרים בלבד —
          ולכן היא הפכה לבסיס שרוב החפיסות המודרניות נשענות עליו.
        </p>
        <p style={P_STYLE}>
          החפיסה שבאתר צוירה במיוחד עבורו בסגנון גואש, צמודה לקומפוזיציות הקלאסיות
          של ריידר־וייט — בלי צלבים ובלי עירום. אפשר לראות{" "}
          <Link href="/tarot/deck" style={LINK_STYLE}>את כל 78 הקלפים בגלריה</Link>{" "}
          ואף להוריד את החפיסה כולה בחינם.
        </p>

        <h2 style={H2_STYLE}>מה ההבדל בין ארקנה גדולה לארקנה קטנה?</h2>
        <p style={P_STYLE}>
          הארקנה הגדולה — 22 קלפים ממוספרים 0 עד 21 — מתארת את תחנות־היסוד של
          המסע האנושי: מהזינוק התמים של השוטה, דרך מבחנים כמו המגדל והמוות (שעניינו
          סיום המפנה מקום לחדש), ועד השלמות של קלף העולם. כשקלף ארקנה גדולה עולה
          בקריאה, הוא מסמן שהעניין נוגע בשכבה עמוקה.
        </p>
        <p style={P_STYLE}>
          הארקנה הקטנה — 56 קלפים בארבע סדרות של 14 — היא לבוש היומיום של אותם
          כוחות: מטות (אש) — יוזמה ורצון; גביעים (מים) — רגש וקשר; חרבות (אוויר) —
          מחשבה והכרעה; מטבעות (אדמה) — גוף, עבודה וחומר. בכל סדרה עשרה קלפי מספר
          וארבע דמויות חצר: נער, אביר, מלכה ומלך.
        </p>

        <h2 style={H2_STYLE}>איך קוראים בקלפים? שיטת שלושת הקלפים</h2>
        <p style={P_STYLE}>
          בקריאה שבאתר שולפים שלושה קלפים מול שאלה. הקלף האמצעי נושא את התשובה —
          בו נמצא לב הקריאה. שני הקלפים שלצדדיו מסייעים: לעיתים כשני פנים משלימים
          של אותה תשובה (מאין היא צומחת ואיך מממשים אותה), ולעיתים כתומך ומתנגד —
          אחד מראה מה פועל לטובת הכיוון, והשני את המכשול או המחיר. קלף "קשה" באמצע
          הוא עדיין התשובה: את הבהירות משיגים מהתבוננות בו, לא מהחלפתו בנעים יותר.
        </p>
        <p style={P_STYLE}>
          אפשר להתנסות מיד:{" "}
          <Link href="/tarot" style={LINK_STYLE}>שליפת שלושה קלפים אונליין</Link> —
          חינם, בעברית, והשאלה אינה נשמרת.
        </p>

        <h2 style={H2_STYLE}>פירוש כל 78 הקלפים</h2>
        <p style={P_STYLE}>
          לכל קלף בחפיסה יש דף פירוש מלא בעברית — מהות הקלף, מה הוא אומר כשהוא
          עולה בקריאה, ואילו שאלות הוא מזמין:
        </p>
        {sections.map((section) => (
          <section key={section.key}>
            <h3
              style={{
                fontFamily: SERIF,
                fontWeight: 700,
                fontSize: 20,
                margin: "26px 0 8px",
                color: "oklch(0.30 0.05 55)",
              }}
            >
              {section.title}
            </h3>
            <ul
              style={{
                columns: 2,
                columnGap: 28,
                margin: 0,
                paddingInlineStart: 20,
                fontSize: 15.5,
                lineHeight: 2.1,
              }}
            >
              {section.cards.map((card) => (
                <li key={card.id}>
                  <Link href={`/tarot/card/${cardSlug(card)}`} style={LINK_STYLE}>
                    {card.he}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <h2 style={H2_STYLE}>שאלות נפוצות</h2>
        {TAROT_GUIDE_FAQ.map((item) => (
          <div key={item.question} style={{ marginBottom: 22 }}>
            <h3
              style={{
                fontFamily: SERIF,
                fontWeight: 700,
                fontSize: 19,
                margin: "0 0 6px",
                color: "oklch(0.30 0.05 55)",
              }}
            >
              {item.question}
            </h3>
            <p style={{ ...P_STYLE, margin: 0 }}>{item.answer}</p>
          </div>
        ))}

        <div
          style={{
            marginTop: 48,
            textAlign: "center",
            borderTop: "1px solid oklch(0.86 0.024 75)",
            paddingTop: 32,
            display: "flex",
            gap: 22,
            justifyContent: "center",
            flexWrap: "wrap",
            fontSize: 15.5,
          }}
        >
          <Link href="/tarot" style={LINK_STYLE}>לשליפת קלפים</Link>
          <Link href="/tarot/deck" style={LINK_STYLE}>גלריית החפיסה</Link>
          <Link href="/derech" style={LINK_STYLE}>דרך הרוח — שיטת האתר</Link>
        </div>
      </div>
    </div>
  );
}
