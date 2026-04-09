import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "wouter";
import { ArrowLeft, Mail, MapPin, Phone, Loader2, Check } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);

  // Fetch dynamic contact email from settings
  const { data: contactEmailData } = trpc.contact.getEmail.useQuery();
  const displayEmail = contactEmailData?.email;

  const submitContact = trpc.contact.submit.useMutation({
    onSuccess: () => {
      toast.success("ההודעה נשלחה בהצלחה!");
      setSubmitted(true);
      setForm({ name: "", email: "", subject: "", message: "" });
      setTimeout(() => setSubmitted(false), 5000);
    },
    onError: (err) => {
      toast.error(err.message || "שגיאה בשליחת ההודעה");
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.subject || !form.message) {
      toast.error("אנא מלאו את כל השדות");
      return;
    }
    submitContact.mutate(form);
  };

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
              יצירת קשר
            </h1>
            <p className="text-lg text-muted-foreground">
              אנחנו כאן כדי לשמוע מכם
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-4xl py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Contact Info */}
          <div className="md:col-span-1">
            <h2 className="font-display font-bold text-2xl text-foreground mb-6">
              צרו קשר
            </h2>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">דוא״ל</h3>
                  {displayEmail ? (
                    <a
                      href={`mailto:${displayEmail}`}
                      className="text-muted-foreground text-sm hover:text-primary transition-colors"
                    >
                      {displayEmail}
                    </a>
                  ) : (
                    <p className="text-muted-foreground text-sm">הגדר בהגדרות האדמין</p>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">מיקום</h3>
                  <p className="text-muted-foreground text-sm">
                    ישראל
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">זמן תגובה</h3>
                  <p className="text-muted-foreground text-sm">
                    בדרך כלל תוך 24 שעות
                  </p>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="mt-8 p-4 bg-card border border-border rounded-lg">
              <p className="text-sm text-muted-foreground leading-relaxed">
                אנחנו מעריכים כל הודעה ותגובה. אם יש לכם שאלות, הצעות או רוצים לשתף תוכן, אנא צרו קשר.
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="md:col-span-2">
            {submitted ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-green-900/40 flex items-center justify-center mb-4">
                  <Check className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="font-display font-bold text-2xl text-foreground mb-2">
                  תודה!
                </h3>
                <p className="text-muted-foreground mb-6">
                  ההודעה שלכם נשלחה בהצלחה. נחזור אליכם בקרוב.
                </p>
                <Button variant="outline" asChild>
                  <Link href="/">חזרה לדף הבית</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    שם מלא <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="שם מלא"
                    className="text-right"
                    dir="rtl"
                    required
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    דוא״ל <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    className="text-left"
                    dir="ltr"
                    required
                  />
                </div>

                {/* Subject */}
                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-sm font-medium">
                    נושא <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="subject"
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    placeholder="נושא ההודעה"
                    className="text-right"
                    dir="rtl"
                    required
                  />
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <Label htmlFor="message" className="text-sm font-medium">
                    הודעה <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    placeholder="כתבו את ההודעה שלכם כאן..."
                    className="resize-none text-right min-h-[200px]"
                    dir="rtl"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    אנא כתבו הודעה מפורטת כדי שנוכל לעזור לכם בצורה טובה יותר.
                  </p>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={submitContact.isPending}
                  className="w-full"
                >
                  {submitContact.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      שליחה...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 ml-2" />
                      שלחו הודעה
                    </>
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
