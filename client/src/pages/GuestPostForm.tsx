import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { CATEGORY_MAP } from "@/lib/categories";

export default function GuestPostForm() {
  const [title, setTitle] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<"spirituality" | "philosophy" | "healing">("spirituality");

  const submitMutation = trpc.guestPosts.submit.useMutation({
    onSuccess: () => {
      toast.success("ההצעה נשלחה בהצלחה! המנהל יבדוק אותה בקרוב");
      setTitle("");
      setAuthorName("");
      setAuthorEmail("");
      setBody("");
      setCategory("spirituality");
    },
    onError: (err) => {
      toast.error(err.message || "שגיאה בשליחת ההצעה");
    },
  });

  const handleSubmit = () => {
    if (!title.trim() || !authorName.trim() || !authorEmail.trim() || !body.trim()) {
      toast.error("אנא מלא את כל השדות");
      return;
    }
    submitMutation.mutate({ title, authorName, authorEmail, body, category });
  };

  return (
    <div className="container max-w-2xl py-12">
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl text-foreground mb-3">שתף את הכתיבה שלך</h1>
        <p className="text-muted-foreground">אנו מחפשים כותבים אורחים עם דעות מעניינות בנושאי רוחניות, פילוסופיה וריפוי. שלח את ההצעה שלך להמתנה לאישור המנהל.</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">כותרת המאמר</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="כותרת מעניינת..."
            dir="rtl"
            className="text-right"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">שמך</label>
            <Input
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="שם מלא"
              dir="rtl"
              className="text-right"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">דוא״ל</label>
            <Input
              type="email"
              value={authorEmail}
              onChange={(e) => setAuthorEmail(e.target.value)}
              placeholder="your@email.com"
              dir="rtl"
              className="text-right"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">קטגוריה</label>
          <Select value={category} onValueChange={(val) => setCategory(val as any)}>
            <SelectTrigger dir="rtl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CATEGORY_MAP).map(([key, val]) => (
                <SelectItem key={key} value={key}>
                  {val.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">תוכן המאמר</label>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="כתוב את המאמר שלך כאן..."
            dir="rtl"
            className="text-right resize-none min-h-[300px]"
          />
          <p className="text-xs text-muted-foreground mt-2">כתוב בטקסט רגיל. המנהל יוכל לעצב את המאמר לאחר אישורו.</p>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            onClick={handleSubmit}
            disabled={submitMutation.isPending}
            className="gap-2"
          >
            {submitMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            <Send className="w-4 h-4" />
            שלח הצעה
          </Button>
        </div>
      </div>
    </div>
  );
}
