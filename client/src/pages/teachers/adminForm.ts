/** מצב הטופס של /admin/teachers — היגיון טהור (נבדק). */
export interface TeacherForm {
  slug: string; name: string; photo: string; tagline: string; area: string; formats: string;
  bio: string; quote: string; website: string; publicEmail: string; phone: string; contactEmail: string;
  isFounder: boolean; visible: boolean;
}

export const EMPTY_TEACHER_FORM: TeacherForm = {
  slug: "", name: "", photo: "", tagline: "", area: "", formats: "", bio: "", quote: "", website: "",
  publicEmail: "", phone: "", contactEmail: "", isFounder: false, visible: false,
};

export function slugifyName(name: string): string {
  return name.toLowerCase().replace(/["'״׳]/g, "").replace(/[^a-z0-9֐-׿]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 128);
}

export function teacherToForm(t: {
  slug: string; name: string; photo: string | null; tagline: string; area: string; formats: string;
  bio: string | null; quote: string | null; website: string; publicEmail: string; phone: string; contactEmail: string;
  isFounder: boolean; visible: boolean;
}): TeacherForm {
  return {
    slug: t.slug, name: t.name, photo: t.photo ?? "", tagline: t.tagline ?? "", area: t.area ?? "", formats: t.formats ?? "",
    bio: t.bio ?? "", quote: t.quote ?? "", website: t.website ?? "", publicEmail: t.publicEmail ?? "", phone: t.phone ?? "",
    contactEmail: t.contactEmail ?? "", isFounder: !!t.isFounder, visible: !!t.visible,
  };
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** טופס → קלט ל-teachers.create/update; או שגיאה בעברית. */
export function teacherFormToInput(f: TeacherForm):
  | { error: string }
  | { input: Omit<TeacherForm, "photo" | "bio" | "quote"> & { photo: string | null; bio: string | null; quote: string | null } } {
  const name = f.name.trim();
  const slug = f.slug.trim() || slugifyName(name);
  if (!name) return { error: "נדרש שם" };
  if (!slug) return { error: "נדרש slug" };
  if (/[\s/?#%]/.test(slug)) return { error: "slug: אותיות, ספרות ומקפים בלבד" };
  const website = f.website.trim();
  if (website && !/^https?:\/\/\S+$/i.test(website)) return { error: "כתובת האתר חייבת להתחיל ב-http(s)://" };
  for (const [label, v] of [["מייל ציבורי", f.publicEmail], ["מייל ליצירת קשר", f.contactEmail]] as const) {
    if (v.trim() && !EMAIL.test(v.trim())) return { error: `${label}: כתובת לא תקינה` };
  }
  return {
    input: {
      slug, name, tagline: f.tagline.trim(), area: f.area.trim(), formats: f.formats.trim(),
      photo: f.photo.trim() || null, bio: f.bio || null, quote: f.quote.trim() || null,
      website, publicEmail: f.publicEmail.trim(), phone: f.phone.trim(), contactEmail: f.contactEmail.trim(),
      isFounder: f.isFounder, visible: f.visible,
    },
  };
}
