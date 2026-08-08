import type { ReactNode } from "react";
import { Link } from "wouter";

/**
 * markdown-lite עבור טקסטים הנערכים באדמין (דף הדרך):
 * **מודגש** → <strong>, [טקסט](כתובת) → קישור.
 * נתיב פנימי (מתחיל ב-/) מרונדר כ-<Link> של wouter; כתובת חיצונית כ-<a>.
 * אין תמיכה ב-HTML — הטקסט עצמו מרונדר כטקסט (בטוח מ-XSS מעצם השימוש ב-JSX).
 */
export function renderMdLite(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  // תופס את הטוקן הקרוב הבא: קישור [..](..) או מודגש **..**
  const token = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;

  while ((m = token.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[1] !== undefined && m[2] !== undefined) {
      const [, label, href] = m;
      if (href.startsWith("/")) {
        nodes.push(
          <Link key={key++} href={href} className="text-primary hover:underline">
            {label}
          </Link>
        );
      } else {
        nodes.push(
          <a
            key={key++}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {label}
          </a>
        );
      }
    } else if (m[3] !== undefined) {
      nodes.push(<strong key={key++}>{m[3]}</strong>);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}
