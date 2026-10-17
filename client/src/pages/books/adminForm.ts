/**
 * מצב הטופס של /admin/books — היגיון טהור (נבדק), בלי React.
 */
import { BOOK_STATUSES, type BookStatus, type PurchaseLink, parseToc } from "@shared/books";

export interface BookForm {
  slug: string;
  title: string;
  subtitle: string;
  blurb: string;
  coverImage: string;
  status: BookStatus;
  visible: boolean;
  publisher: string;
  purchaseLinks: PurchaseLink[];
  tocText: string; // שורה לפריט
  year: string;
  pages: string;
  isbn: string;
}

export const EMPTY_BOOK_FORM: BookForm = {
  slug: "", title: "", subtitle: "", blurb: "", coverImage: "", status: "writing", visible: false,
  publisher: "", purchaseLinks: [], tocText: "", year: "", pages: "", isbn: "",
};

/** slug לטיני/עברי מהכותרת — אותיות, ספרות ומקפים. */
export function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/["'״׳]/g, "")
    .replace(/[^a-z0-9\u0590-\u05ff]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 128);
}

/** שורת ספר מהשרת (books.listAll) → טופס. */
export function bookToForm(b: {
  slug: string; title: string; subtitle: string; blurb: string | null; coverImage: string | null;
  status: string; visible: boolean; publisher: string; purchaseLinks: PurchaseLink[]; toc: string[];
  year: number | null; pages: number | null; isbn: string;
}): BookForm {
  return {
    slug: b.slug,
    title: b.title,
    subtitle: b.subtitle ?? "",
    blurb: b.blurb ?? "",
    coverImage: b.coverImage ?? "",
    status: (BOOK_STATUSES as readonly string[]).includes(b.status) ? (b.status as BookStatus) : "writing",
    visible: !!b.visible,
    publisher: b.publisher ?? "",
    purchaseLinks: b.purchaseLinks ?? [],
    tocText: (b.toc ?? []).join("\n"),
    year: b.year == null ? "" : String(b.year),
    pages: b.pages == null ? "" : String(b.pages),
    isbn: b.isbn ?? "",
  };
}

const intOrNull = (s: string): number | null => {
  const n = Number.parseInt(s.trim(), 10);
  return Number.isFinite(n) ? n : null;
};

/** טופס → קלט ל-books.create / books.update. מחזיר שגיאת ולידציה בעברית, או את הקלט. */
export function formToInput(f: BookForm):
  | { error: string }
  | { input: {
      slug: string; title: string; subtitle: string; blurb: string; coverImage: string | null;
      status: BookStatus; visible: boolean; publisher: string; purchaseLinks: PurchaseLink[];
      toc: string[]; year: number | null; pages: number | null; isbn: string;
    } } {
  const title = f.title.trim();
  const slug = (f.slug.trim() || slugifyTitle(title));
  if (!title) return { error: "נדרשת כותרת" };
  if (!slug) return { error: "נדרש slug" };
  if (/[\s/?#%]/.test(slug)) return { error: "slug: אותיות, ספרות ומקפים בלבד" };
  for (const l of f.purchaseLinks) {
    if (!l.label.trim()) return { error: "לכל קישור רכישה נדרש שם" };
    if (!/^https?:\/\/\S+$/i.test(l.url.trim())) return { error: `כתובת לא תקינה: ${l.url || "(ריק)"}` };
  }
  return {
    input: {
      slug, title,
      subtitle: f.subtitle.trim(),
      blurb: f.blurb,
      coverImage: f.coverImage.trim() || null,
      status: f.status,
      visible: f.visible,
      publisher: f.publisher.trim(),
      purchaseLinks: f.purchaseLinks.map((l) => ({ label: l.label.trim(), url: l.url.trim(), kind: l.kind })),
      toc: parseToc(JSON.stringify(f.tocText.split(/\r?\n/))),
      year: intOrNull(f.year),
      pages: intOrNull(f.pages),
      isbn: f.isbn.trim(),
    },
  };
}
