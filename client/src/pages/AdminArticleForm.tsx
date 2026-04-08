import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "spirituality", label: "רוחניות" },
  { value: "philosophy", label: "פילוסופיה" },
  { value: "healing", label: "ריפוי" },
];

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export default function AdminArticleForm() {
  const params = useParams<{ id?: string }>();
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading } = useAuth();
  const utils = trpc.useUtils();

  const isEdit = !!params.id;
  const articleId = params.id ? parseInt(params.id) : undefined;

  // Load existing article for edit
  const { data: articles } = trpc.articles.list.useQuery({ all: true }, { enabled: isEdit });
  const existingArticle = articles?.find((a) => a.id === articleId);

  const [form, setForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    body: "",
    coverImage: "",
    category: "spirituality" as "spirituality" | "philosophy" | "healing",
    tags: "",
    published: false,
  });

  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  useEffect(() => {
    if (existingArticle) {
      setForm({
        title: existingArticle.title,
        slug: existingArticle.slug,
        excerpt: existingArticle.excerpt ?? "",
        body: "",
        coverImage: existingArticle.coverImage ?? "",
        category: existingArticle.category,
        tags: existingArticle.tags ?? "",
        published: existingArticle.published,
      });
      setSlugManuallyEdited(true);
    }
  }, [existingArticle]);

  // Load full article body for edit
  const { data: fullArticle } = trpc.articles.bySlug.useQuery(
    { slug: existingArticle?.slug ?? "" },
    { enabled: !!existingArticle?.slug }
  );

  useEffect(() => {
    if (fullArticle?.body) {
      setForm((prev) => ({ ...prev, body: fullArticle.body }));
    }
  }, [fullArticle]);

  const createArticle = trpc.articles.create.useMutation({
    onSuccess: () => {
      utils.articles.list.invalidate();
      toast.success("המאמר נוצר בהצלחה");
      navigate("/admin");
    },
    onError: (err) => toast.error(err.message || "שגיאה ביצירת המאמר"),
  });

  const updateArticle = trpc.articles.update.useMutation({
    onSuccess: () => {
      utils.articles.list.invalidate();
      toast.success("המאמר עודכן בהצלחה");
      navigate("/admin");
    },
    onError: (err) => toast.error(err.message || "שגיאה בעדכון המאמר"),
  });

  const handleTitleChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      title: value,
      slug: slugManuallyEdited ? prev.slug : slugify(value),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim() || !form.slug.trim()) {
      toast.error("יש למלא את כל השדות החובה");
      return;
    }
    if (isEdit && articleId) {
      updateArticle.mutate({ id: articleId, ...form });
    } else {
      createArticle.mutate(form);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="container py-24 text-center">
        <p className="text-xl font-display font-bold text-foreground mb-2">גישה מוגבלת</p>
        <Button variant="outline" onClick={() => navigate("/")}>חזרה לדף הבית</Button>
      </div>
    );
  }

  const isPending = createArticle.isPending || updateArticle.isPending;

  return (
    <div className="container py-10 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
          <ArrowRight className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="font-display font-bold text-2xl text-foreground">
            {isEdit ? "עריכת מאמר" : "מאמר חדש"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEdit ? "ערכו את פרטי המאמר" : "צרו מאמר חדש לפרסום"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title" className="text-sm font-medium">
            כותרת <span className="text-destructive">*</span>
          </Label>
          <Input
            id="title"
            value={form.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="כותרת המאמר"
            className="text-right"
            dir="rtl"
            required
          />
        </div>

        {/* Slug */}
        <div className="space-y-2">
          <Label htmlFor="slug" className="text-sm font-medium">
            כתובת URL <span className="text-destructive">*</span>
          </Label>
          <Input
            id="slug"
            value={form.slug}
            onChange={(e) => {
              setSlugManuallyEdited(true);
              setForm((prev) => ({ ...prev, slug: e.target.value }));
            }}
            placeholder="article-url-slug"
            className="text-left font-mono text-sm"
            dir="ltr"
            required
          />
          <p className="text-xs text-muted-foreground">
            הכתובת תיראה כך: /article/{form.slug || "..."}
          </p>
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            קטגוריה <span className="text-destructive">*</span>
          </Label>
          <Select
            value={form.category}
            onValueChange={(v) => setForm((prev) => ({ ...prev, category: v as typeof form.category }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="בחרו קטגוריה" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Excerpt */}
        <div className="space-y-2">
          <Label htmlFor="excerpt" className="text-sm font-medium">תקציר</Label>
          <Textarea
            id="excerpt"
            value={form.excerpt}
            onChange={(e) => setForm((prev) => ({ ...prev, excerpt: e.target.value }))}
            placeholder="תיאור קצר של המאמר (יוצג בכרטיסיה)"
            className="resize-none text-right"
            dir="rtl"
            rows={3}
          />
        </div>

        {/* Body */}
        <div className="space-y-2">
          <Label htmlFor="body" className="text-sm font-medium">
            תוכן המאמר <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="body"
            value={form.body}
            onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))}
            placeholder="כתבו את תוכן המאמר כאן...

ניתן להשתמש בפורמט פשוט:
## כותרת משנה
### כותרת קטנה
> ציטוט

פסקאות מופרדות בשורה ריקה."
            className="resize-none text-right min-h-[300px] font-mono text-sm"
            dir="rtl"
            required
          />
          <p className="text-xs text-muted-foreground">
            השתמשו ב-## לכותרת משנה, ### לכותרת קטנה, &gt; לציטוט
          </p>
        </div>

        {/* Cover Image */}
        <div className="space-y-2">
          <Label htmlFor="coverImage" className="text-sm font-medium">תמונת שער (URL)</Label>
          <Input
            id="coverImage"
            value={form.coverImage}
            onChange={(e) => setForm((prev) => ({ ...prev, coverImage: e.target.value }))}
            placeholder="https://example.com/image.jpg"
            className="text-left"
            dir="ltr"
          />
          {form.coverImage && (
            <div className="mt-2 rounded-lg overflow-hidden h-32 bg-secondary">
              <img
                src={form.coverImage}
                alt="תצוגה מקדימה"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label htmlFor="tags" className="text-sm font-medium">תגיות</Label>
          <Input
            id="tags"
            value={form.tags}
            onChange={(e) => setForm((prev) => ({ ...prev, tags: e.target.value }))}
            placeholder="מדיטציה, מודעות, נשמה (מופרדות בפסיק)"
            className="text-right"
            dir="rtl"
          />
        </div>

        {/* Published */}
        <div className="flex items-center justify-between bg-secondary/50 rounded-xl p-4">
          <div>
            <p className="font-medium text-sm text-foreground">פרסום מיידי</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {form.published ? "המאמר יהיה גלוי לכל המבקרים" : "המאמר יישמר כטיוטה"}
            </p>
          </div>
          <Switch
            checked={form.published}
            onCheckedChange={(v) => setForm((prev) => ({ ...prev, published: v }))}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" disabled={isPending} className="flex-1 sm:flex-none">
            {isPending ? (
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 ml-2" />
            )}
            {isEdit ? "שמירת שינויים" : "יצירת מאמר"}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate("/admin")}>
            ביטול
          </Button>
        </div>
      </form>
    </div>
  );
}
