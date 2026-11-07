import { TriangleAlert } from "lucide-react";
import {
  COMMERCE_CHECKLIST,
  COMMERCE_LEGAL_READY,
  COMMERCE_TRIGGER_LABELS,
  checklistFor,
  type CommerceChecklistItem,
  type CommerceTrigger,
} from "@shared/commerceReadiness";

const TRIGGERS: CommerceTrigger[] = ["direct-sale", "paid-ai", "paid-event", "external-store"];

const INLINE_LEAD: Record<CommerceTrigger, string> = {
  "external-store": "הספר מוצע לרכישה דרך קישור חיצוני.",
  "paid-event": "לאירוע יש מחיר.",
  "direct-sale": "זו גבייה דרך האתר.",
  "paid-ai": "זו גבייה דרך האתר.",
};

function Items({ items }: { items: CommerceChecklistItem[] }) {
  return (
    <ul className="list-disc ps-5 space-y-1.5">
      {items.map((item) => (
        <li key={item.id}>
          <strong>{item.title}</strong>. {item.detail}
        </li>
      ))}
    </ul>
  );
}

export function CommerceReminder({
  trigger,
  variant,
}: {
  trigger: CommerceTrigger | "all";
  variant: "card" | "inline";
}) {
  if (COMMERCE_LEGAL_READY) return null;

  if (variant === "card") {
    return (
      <section className="mb-8 rounded-xl border border-amber-500/40 bg-amber-500/10 p-5 text-foreground">
        <h2 className="flex items-center gap-2 font-display font-bold text-lg">
          <TriangleAlert className="w-5 h-5 text-amber-600" aria-hidden="true" />
          לפני שגובים כסף באתר
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          היום האתר חינמי: ספרים מקשרים לחנויות חיצוניות, ואירועים מקשרים להרשמה חיצונית. לפני מכירה ישירה באתר, קריאה בתשלום או גבייה על אירוע דרך האתר צריך לסגור את הסעיפים שלמטה. הרשימה נמצאת בקובץ shared/commerceReadiness.ts, ובדיקה אוטומטית נכשלת אם נוסף לאתר קוד תשלום לפני שהרשימה סומנה כמוכנה.
        </p>
        <div className="mt-3 space-y-2">
          {TRIGGERS.map((t) => {
            const items = checklistFor(t);
            return (
              <details key={t} className="rounded-lg border border-border bg-card px-3 py-2">
                <summary className="cursor-pointer font-medium">
                  {COMMERCE_TRIGGER_LABELS[t] + " (" + items.length + " סעיפים)"}
                </summary>
                <div className="mt-2 text-sm">
                  <Items items={items} />
                </div>
              </details>
            );
          })}
        </div>
      </section>
    );
  }

  const items = trigger === "all" ? COMMERCE_CHECKLIST : checklistFor(trigger);
  const lead = trigger === "all" ? "זו גבייה דרך האתר." : INLINE_LEAD[trigger];
  return (
    <div
      role="note"
      className="mt-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-foreground"
    >
      <p className="flex items-center gap-2 font-medium">
        <TriangleAlert className="w-4 h-4 shrink-0 text-amber-600" aria-hidden="true" />
        {lead}
      </p>
      <p className="mt-1">לפני פרסום, עברו על הסעיפים:</p>
      <div className="mt-1 text-xs text-muted-foreground">
        <Items items={items} />
      </div>
    </div>
  );
}
