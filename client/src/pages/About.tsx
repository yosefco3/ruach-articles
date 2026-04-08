import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Heart, Lightbulb, Leaf, ArrowLeft } from "lucide-react";

export default function About() {
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
              אודות רוּחַ
            </h1>
            <p className="text-lg text-muted-foreground">
              מרחב לעומק, לשקט ולחיפוש הפנימי
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-3xl py-16">
        {/* Mission */}
        <section className="mb-16">
          <div className="divider-gold mb-8" />
          <h2 className="font-display font-bold text-3xl text-foreground mb-6">
            על מה אנחנו
          </h2>
          <div className="prose prose-invert max-w-none text-right" dir="rtl">
            <p className="text-lg text-muted-foreground leading-relaxed mb-4">
              רוּחַ הוא מרחב דיגיטלי המוקדש לעומק, להשקפה פנימית ולחיפוש משמעות. במעולם שמלא בקול וברעש, אנו מאמינים שיש צורך במקום שקט שבו אפשר לעצור, להקשיב ולהתחבר לעצמנו.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              אנחנו מפרסמים מאמרים בנושאי רוחניות, פילוסופיה וריפוי — כלים ותובנות שיכולים להעשיר את החיים שלכם ולהוביל להתרפאות עמוקה יותר.
            </p>
          </div>
        </section>

        {/* Values */}
        <section className="mb-16">
          <h2 className="font-display font-bold text-3xl text-foreground mb-8">
            הערכים שלנו
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Heart,
                title: "חמלה",
                description: "אנו מאמינים בחמלה כלפי עצמנו ולעולם סביבנו. כל מאמר נכתב בכוונה לרפא ולהעלות.",
              },
              {
                icon: Lightbulb,
                title: "עומק",
                description: "אנו מחפשים הבנה אמיתית, לא תשובות מהירות. כל מאמר הוא הזמנה לחקור בעומק.",
              },
              {
                icon: Leaf,
                title: "גדילה",
                description: "אנו מאמינים שכל אדם יכול להתפתח ולהשתנות. הגדילה היא תהליך, לא יעד.",
              },
            ].map((value, idx) => {
              const Icon = value.icon;
              return (
                <div
                  key={idx}
                  className="bg-card border border-border rounded-xl p-6 text-center hover:shadow-lg transition-shadow"
                >
                  <div className="flex justify-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <h3 className="font-display font-bold text-lg text-foreground mb-2">
                    {value.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {value.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Team */}
        <section className="mb-16">
          <h2 className="font-display font-bold text-3xl text-foreground mb-8">
            מי אנחנו
          </h2>
          <div className="bg-card border border-border rounded-xl p-8">
            <div className="text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-200 to-amber-400 mx-auto mb-6 flex items-center justify-center">
                <span className="font-display font-bold text-3xl text-amber-900">ר</span>
              </div>
              <h3 className="font-display font-bold text-2xl text-foreground mb-2">
                יוסף כהן
              </h3>
              <p className="text-muted-foreground mb-4">
                מייסד ועורך ראשי
              </p>
              <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                יוסף הוא חוקר רוחניות וכותב בעל עניין עמוק בפילוסופיה, מדיטציה וריפוי. הוא מאמין שהכתיבה היא כלי להבנה עמוקה יותר של עצמנו ושל העולם סביבנו. רוּחַ נוסדה כדי לשתף את התובנות הללו עם קהילה גדולה יותר.
              </p>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="text-center bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-8 md:p-12">
          <h2 className="font-display font-bold text-2xl text-foreground mb-3">
            הצטרפו לקהילה
          </h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            קראו את המאמרים, שתפו את החוויות שלכם בתגובות, והיו חלק מקהילה של אנשים החוקרים עומק וחיפוש פנימי.
          </p>
          <Button asChild>
            <Link href="/">חזרה לכל המאמרים</Link>
          </Button>
        </section>
      </div>
    </div>
  );
}
