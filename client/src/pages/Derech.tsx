import type { ReactNode } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  Compass,
  Sprout,
  Link2,
  Scale,
  Globe,
  Music,
} from "lucide-react";

/**
 * /derech — the site's method page: "דרך הרוח — הנבואה הטבעית".
 * Static, designed content (source of truth: METHOD.md in the repo root).
 * Separate from /about, which stays biographical and DB-backed.
 */

const PRINCIPLES: {
  icon: typeof Sprout;
  title: string;
  law: string;
  body: ReactNode;
}[] = [
  {
    icon: Sprout,
    title: "התפתחות, לא השגה",
    law: "מה שמפתח את האדם או מחזיר אותו לטבע בריא — נכנס; נוסחה לתוצאה חיצונית — נשארת בחוץ.",
    body: (
      <>
        המבחן פשוט: טכניקה פסולה "עובדת לצדיק ולרשע" — היא אינה דורשת מהאדם
        להשתנות. לכן קבלה מעשית וספרי סגולות נשארים בחוץ, ואילו{" "}
        <Link href="/article/ielgyrqpya" className="text-primary hover:underline">
          נשימת 8
        </Link>
        , תרגיל השחזור וההתבודדות נכנסים: הם פועלים על האדם עצמו. כפי שהוסבר{" "}
        <Link href="/article/urzelcovmd" className="text-primary hover:underline">
          במבוא לתורת קסטנדה
        </Link>{" "}
        — זהו בדיוק ההבדל בין כישוף לנבואה.
      </>
    ),
  },
  {
    icon: Link2,
    title: "קשר חי, לא מתווך",
    law: "הקשר לאל מתקיים בהווה, ישירות; ספרים, הלכה ומוסדות הם גלגלי עזר זמניים — לא סמכות סופית.",
    body: (
      <>
        זהו{" "}
        <Link href="/article/jyxwrtpzfr" className="text-primary hover:underline">
          חזונו של ירמיהו
        </Link>
        : תורה הכתובה על הלב, שאינה צריכה עוד ארון, ספר או מתווך. מכאן גם
        הפולמוסים באתר — הם אינם תוכן צדדי אלא הצד השני של אותו עיקרון: פירוק
        המתווכים הכוזבים, ממשיח אנושי ועד "מרכבות אלים". למד לסגור את הספר
        ולשאול: "מה אלהים באמת רוצה ממני?"
      </>
    ),
  },
  {
    icon: Scale,
    title: "חוקיות, לא שרירות",
    law: "הקדושה פועלת דרך חוק — טבעי או רוחני — לא דרך קפריזה, נס שרירותי או זכות ייחוס.",
    body: (
      <>
        אצל{" "}
        <Link href="/article/mlazkqxdxh" className="text-primary hover:underline">
          הרמב"ם
        </Link>{" "}
        השפע זורם תמיד, וההשגחה והנבואה הן כוונון המקלט; הנס הוא חוק טבע מסדר
        גבוה. כל תופעה "על-טבעית" שנפגוש — מגלגול נשמות ועד תחיית המתים —
        מחויבת תרגום לחוקיות כזאת. מה שנשען על שרירות בלבד, נדחה או מוצג כקוטב
        אחד מול הקוטב ההפוך לו.
      </>
    ),
  },
  {
    icon: Globe,
    title: "מנגנון אחד, מסורות רבות",
    law: "כשמסורות שמעולם לא נפגשו מתכנסות לאותה ארכיטקטורה — זו ראיה שהמנגנון אמיתי.",
    body: (
      <>
        דרך הלוחם של דון חואן פוגשת את אפיקטטוס הסטואיקן ואת ויקטור פרנקל;
        הרמב"ם פוגש את האדוואיטה; ירמיהו פוגש את הטאו. זו הסיבה שאתר אחד מחזיק
        את הרמב"ם, הרמח"ל וקסטנדה יחד: איננו מסכמים הוגים — אנחנו עוקבים אחרי
        מנגנון אחד המופיע אצל כולם, ובוחרים מכל הוגה רק את הקטעים שמתארים
        אותו.
      </>
    ),
  },
  {
    icon: Music,
    title: "החוש להרמוניה",
    law: "ההכרעה הסופית היא של חוש מאומן — אותו חוש שיודע אם צליל משתלב או צורם — והוא גובר על כל ספר.",
    body: (
      <>
        יש בנו חוש שמבחין אם צליל משתלב או צורם, אם צבע יושב נכון בציור, אם
        טעם שייך לתבשיל. החוש הזה זמין לכל אדם ומתפתח בתרגול קשוב — ובדרך הזאת
        הוא הבורר העליון:{" "}
        <Link href="/article/-" className="text-primary hover:underline">
          החוויה הישירה קודמת לכתוב
        </Link>
        . קטע שעבר את כל ארבעת העקרונות ועדיין "לא מרגיש נקי" — נשאר בחוץ. זהו
        החוש הנבואי, וזוהי זכותנו מלידה.
      </>
    ),
  },
];

const IN_OUT: { inItem: string; outItem: string }[] = [
  {
    inItem: "מסילת ישרים — בחינה יומית של המעשים, לא ללכת \"כסומא באפלה\"",
    outItem: "סגולות ונוסחאות \"בדוקות\" לפרנסה, לזיווג, להשבת אהבה",
  },
  {
    inItem:
      "התבודדות — לדבר עם ה' בשפת היומיום, בלי נוסח קבוע (ובצורה נכונה: תודה במקום רחמים עצמיים)",
    outItem: "חישובי קץ ומועדי גאולה, גם כשהם מגיעים מהרמב\"ם עצמו",
  },
  {
    inItem: "דרך הלוחם — צַיִד החשיבות העצמית והרחמים העצמיים",
    outItem: "אמנות החלימה — טכניקות שירשנו מ\"המכשפים הקדומים\", רודפי הכוח",
  },
  {
    inItem: "נשימת 8 וצ'י גונג — טכניקות שמחזירות זרימה טבעית שהתקלקלה",
    outItem: "טכניקות שמבטיחות כוחות ושליטה במציאות בלי שינוי פנימי",
  },
];

export default function Derech() {
  return (
    <div className="min-h-screen" dir="rtl">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/8 via-transparent to-transparent pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, oklch(0.72 0.12 75) 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />

        <div className="container max-w-3xl pt-10 pb-14 relative">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-10 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            חזרה לדף הבית
          </Link>

          <div className="flex flex-col items-center text-center gap-5">
            <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shadow-lg shadow-primary/10">
              <Compass className="w-7 h-7 text-primary" />
            </div>

            <div>
              <h1 className="font-display font-bold text-5xl md:text-6xl text-foreground tracking-tight leading-tight">
                דרך הרוח
              </h1>
              <p className="mt-3 text-xl text-primary font-serif">
                הנבואה הטבעית
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                השיטה שמאחורי כל המאמרים באתר
              </p>
            </div>

            <div className="w-32 divider-gold mt-2" />
          </div>
        </div>
      </div>

      <div className="container max-w-3xl pb-20 space-y-14">
        {/* ── Opening ── */}
        <section className="prose-rtl max-w-none text-lg leading-relaxed">
          <p>
            האתר הזה אינו מסכם הוגים. הוא עוקב אחרי דבר אחד — <strong>הקשר
            החי, הטבעי והישיר של האדם אל האל</strong> — כפי שהוא מופיע אצל
            הוגים ממסורות שמעולם לא נפגשו: ירמיהו והרמב"ם, הרמח"ל ודון חואן,
            הבעל שם טוב והטאו. מכל הוגה נבחרים רק הקטעים שמתארים את המנגנון
            הזה. כל השאר — עמוק וחשוב ככל שיהיה — נשאר בחוץ.
          </p>
          <p>
            לשם הזה שני חלקים. <strong>"דרך"</strong> — כי המילה הזאת ממתינה
            בליבו של כל אחד מהמקורות: "טאו" פירושו המילולי דרך; אצל הרמח"ל —
            "דרך ה'"; אצל דון חואן — "דרך הלוחם" ו"דרך עם לב". זו דרך חיים, לא
            גוף ידע. <strong>"הרוח"</strong> — היא שם האתר, היא הכוח שדון חואן
            מכנה בשם הזה, ובעברית היא גם הנשימה וגם רוח הנבואה.
            ו"הנבואה הטבעית" — כי החיבור אינו נס ואינו זכות של יחידים: הוא חוק,
            והוא זכותו של כל אדם מלידה.
          </p>
        </section>

        {/* ── Principles ── */}
        <section>
          <h2 className="font-display font-bold text-3xl text-foreground text-center mb-2">
            חמשת העקרונות
          </h2>
          <p className="text-center text-muted-foreground mb-8">
            מה הופך קטע לחלק מהדרך — ומה משאיר אותו בחוץ
          </p>

          <div className="space-y-5">
            {PRINCIPLES.map((p, i) => (
              <div
                key={p.title}
                className="relative bg-card/60 backdrop-blur-sm border border-border/60 rounded-2xl shadow-lg shadow-black/10 overflow-hidden"
              >
                <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                <div className="p-6 md:p-8">
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 w-11 h-11 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                      <p.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-primary/60 font-display font-bold text-lg">
                          {i + 1}.
                        </span>
                        <h3 className="font-display font-bold text-xl text-foreground">
                          {p.title}
                        </h3>
                      </div>
                      <p className="mt-2 text-primary/90 font-medium leading-relaxed">
                        {p.law}
                      </p>
                      <p className="mt-3 text-muted-foreground leading-relaxed">
                        {p.body}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── In / Out ── */}
        <section>
          <h2 className="font-display font-bold text-3xl text-foreground text-center mb-2">
            מה נכנס — ומה נשאר בחוץ
          </h2>
          <p className="text-center text-muted-foreground mb-8">
            דוגמאות מן העקרונות בפעולה
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-card/60 border border-primary/30 rounded-2xl p-6">
              <h3 className="font-display font-bold text-lg text-primary mb-4 text-center">
                בפנים
              </h3>
              <ul className="space-y-3">
                {IN_OUT.map((row) => (
                  <li
                    key={row.inItem}
                    className="flex gap-2.5 text-sm leading-relaxed text-foreground/90"
                  >
                    <span className="text-primary shrink-0 mt-0.5">✓</span>
                    {row.inItem}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-card/40 border border-border/60 rounded-2xl p-6">
              <h3 className="font-display font-bold text-lg text-muted-foreground mb-4 text-center">
                בחוץ
              </h3>
              <ul className="space-y-3">
                {IN_OUT.map((row) => (
                  <li
                    key={row.outItem}
                    className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground"
                  >
                    <span className="shrink-0 mt-0.5">✕</span>
                    {row.outItem}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── Closing ── */}
        <section className="text-center">
          <div className="divider-gold mb-10 mx-auto max-w-xs" />
          <blockquote className="font-serif text-xl md:text-2xl text-foreground/90 leading-relaxed max-w-2xl mx-auto">
            "חשוב מאוד ללמוד ולדעת כמה שיותר — אך אסור להפוך ספרים למקור
            סמכות. לאחר הלימוד, סגור את הספר ושאל את עצמך: מה נכון? מה אמיתי?
            מה רצון האל ממני?"
          </blockquote>
          <p className="mt-8 text-muted-foreground text-sm mb-4">
            כך נבחר כל מאמר באתר. מוזמנים לקרוא —
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            לכל המאמרים
          </Link>
        </section>
      </div>
    </div>
  );
}
