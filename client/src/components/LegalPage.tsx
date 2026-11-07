import type { ReactNode } from "react";
import { Link } from "wouter";
import { ArrowLeft, type LucideIcon } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

/**
 * Shared shell for the legal pages (/privacy, /terms, /accessibility):
 * back link, icon + h1, prose body and the "last updated" line.
 * The texts themselves are static JSX in each page — edit the page and its date together.
 */
export function LegalPage({
  title,
  icon: Icon,
  lastUpdated,
  children,
}: {
  title: string;
  icon: LucideIcon;
  lastUpdated: string;
  children: ReactNode;
}) {
  useDocumentTitle(`${title} | דרך הרוח`);

  return (
    <div className="min-h-screen" dir="rtl">
      <div className="container max-w-3xl pt-10 pb-20">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-10 group"
        >
          <ArrowLeft aria-hidden="true" className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          חזרה לדף הבית
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
            <Icon aria-hidden="true" className="w-6 h-6 text-primary" />
          </div>
          <h1 className="font-display font-bold text-4xl text-foreground tracking-tight">{title}</h1>
        </div>

        <div className="prose-rtl max-w-none space-y-6">
          {children}
          <p className="text-sm text-muted-foreground pt-4">עודכן לאחרונה בתאריך {lastUpdated}.</p>
        </div>
      </div>
    </div>
  );
}

export function LegalH2({ children }: { children: ReactNode }) {
  return <h2 className="font-display font-bold text-2xl text-foreground pt-2">{children}</h2>;
}

export function LegalList({ children }: { children: ReactNode }) {
  return <ul className="list-disc pr-6 space-y-2">{children}</ul>;
}

export const legalLinkClass = "text-primary underline underline-offset-4";

/** The site's contact address (siteSettings.contactEmail) as a mailto link, or the contact form. */
export function ContactLine() {
  const { data } = trpc.contact.getEmail.useQuery();
  const email = data?.email ?? null;
  return (
    <>
      {email && (
        <>
          בדוא&quot;ל{" "}
          <a href={`mailto:${email}`} className={legalLinkClass}>
            {email}
          </a>{" "}
          או{" "}
        </>
      )}
      דרך{" "}
      <Link href="/contact" className={legalLinkClass}>
        טופס יצירת הקשר
      </Link>
    </>
  );
}
