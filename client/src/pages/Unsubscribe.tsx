import { useState } from "react";
import { Link, useSearch } from "wouter";
import { ArrowLeft } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { ContactLine } from "@/components/LegalPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * /unsubscribe?email=… — target of the link in every newsletter email.
 * Never unsubscribes on load (mail scanners prefetch links): the visitor confirms with a button.
 */
export default function Unsubscribe() {
  useDocumentTitle("הסרה מרשימת הדיוור | דרך הרוח");
  const search = useSearch();
  const emailFromUrl = (new URLSearchParams(search).get("email") ?? "").trim();
  const [typedEmail, setTypedEmail] = useState("");
  const email = emailFromUrl || typedEmail.trim();

  const unsubscribe = trpc.newsletter.unsubscribe.useMutation();

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

        <h1 className="font-display font-bold text-4xl text-foreground tracking-tight mb-8">
          הסרה מרשימת הדיוור
        </h1>

        <div className="prose-rtl max-w-none space-y-6">
          {unsubscribe.isSuccess ? (
            <p role="status">הכתובת הוסרה. לא נשלח אליה עוד עדכונים.</p>
          ) : (
            <>
              {emailFromUrl ? (
                <p>
                  להסיר את הכתובת <span dir="ltr">{emailFromUrl}</span> מרשימת הדיוור של דרך הרוח?
                </p>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="unsubscribe-email">כתובת הדוא&quot;ל להסרה</Label>
                  <Input
                    id="unsubscribe-email"
                    type="email"
                    dir="ltr"
                    autoComplete="email"
                    value={typedEmail}
                    onChange={(e) => setTypedEmail(e.target.value)}
                  />
                </div>
              )}
              <Button
                type="button"
                disabled={unsubscribe.isPending || !email}
                onClick={() => unsubscribe.mutate({ email })}
              >
                {unsubscribe.isPending ? "מסירים…" : "הסרה"}
              </Button>
              {unsubscribe.isError && (
                <p role="alert">
                  ההסרה לא הצליחה. אפשר לכתוב לנו ונסיר את הכתובת ידנית. <ContactLine />
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
