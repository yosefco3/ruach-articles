import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function About() {
  const { data: aboutContent, isLoading } = trpc.about.get.useQuery();
  const { data: settings } = trpc.settings.get.useQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-b from-amber-50 to-transparent pt-12 pb-16">
        <div className="container max-w-3xl">
          <Button variant="ghost" size="sm" className="mb-8" asChild>
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              חזרה לדף הבית
            </Link>
          </Button>
          <div className="text-center">
            <h1 className="font-display font-bold text-4xl md:text-5xl text-foreground mb-4">
              {aboutContent?.title || "אודות"}
            </h1>
            <p className="text-lg text-muted-foreground">
              {settings?.heroSubtitle || "מרחב לעומק, לשקט ולחיפוש הפנימי"}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-3xl py-16">
        <div className="divider-gold mb-8" />
        <div className="prose max-w-none text-right" dir="rtl">
          {aboutContent?.content ? (
            <div dangerouslySetInnerHTML={{ __html: aboutContent.content }} />
          ) : (
            <p className="text-lg text-muted-foreground leading-relaxed">
              תוכן זה עדיין לא הוגדר. בואו נחזור לדף הבית ונתחיל לקרוא מאמרים!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
