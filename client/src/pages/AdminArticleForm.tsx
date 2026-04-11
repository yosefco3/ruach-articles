import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import RichTextEditor from "@/components/RichTextEditor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Loader2, Save, ArrowRight, Upload, X, File, ImageIcon, Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useParams, useLocation } from "wouter";
import { toast } from "sonner";

function slugify(text: string) {
  // Try ASCII-based slug first
  const ascii = text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
  // If the title is Hebrew (or other non-ASCII), fall back to a timestamp slug
  if (!ascii || ascii === "-") {
    return "article-" + Date.now().toString(36);
  }
  return ascii;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  url: string;
}

export default function AdminArticleForm() {
  const params = useParams<{ id?: string }>();
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading } = useAuth();
  const utils = trpc.useUtils();
  const coverImageInputRef = useRef<HTMLInputElement>(null);

  const isEdit = !!params.id;
  const articleId = params.id ? parseInt(params.id) : undefined;

  const canWrite = user?.role === "admin" || (user as any)?.guestPostApproved;

  // Load existing article for edit
  const { data: articles } = trpc.articles.list.useQuery({ all: true }, { enabled: isEdit });
  const existingArticle = articles?.find((a) => a.id === articleId);

  // Load dynamic categories
  const { data: dynamicCategories } = trpc.categories.list.useQuery();

  const [form, setForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    body: "",
    coverImage: "",
    category: "",
    tags: "",
    published: false,
  });

  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);

  // Set default category when categories load (only for new articles)
  useEffect(() => {
    if (dynamicCategories && dynamicCategories.length > 0 && !form.category && !isEdit) {
      setForm((prev) => ({ ...prev, category: dynamicCategories[0].slug }));
    }
  }, [dynamicCategories, isEdit]);

  // Populate form when editing
  useEffect(() => {
    if (existingArticle) {
      setForm((prev) => ({
        ...prev,
        title: existingArticle.title,
        slug: existingArticle.slug,
        excerpt: existingArticle.excerpt ?? "",
        coverImage: existingArticle.coverImage ?? "",
        category: existingArticle.category,
        tags: existingArticle.tags ?? "",
        published: existingArticle.published,
      }));
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
      utils.articles.bySlug.invalidate();
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

  // Upload cover image from file
  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("ניתן להעלות קבצי תמונה בלבד");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("הקובץ גדול מדי — מקסימום 10MB");
      return;
    }

    setCoverUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/upload", { method: "POST", body: formData });
      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();
      setForm((prev) => ({ ...prev, coverImage: data.url }));
      toast.success("תמונת השער הועלתה בהצלחה");
    } catch {
      toast.error("שגיאה בהעלאת תמונת השער");
    } finally {
      setCoverUploading(false);
      if (coverImageInputRef.current) coverImageInputRef.current.value = "";
    }
  };

  // Upload general file attachments
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch("/api/upload", { method: "POST", body: formData });
        if (!response.ok) throw new Error(`Upload failed: ${response.statusText}`);
        const data = await response.json();
        setUploadedFiles((prev) => [
          ...prev,
          { id: Math.random().toString(36).substr(2, 9), name: file.name, size: file.size, url: data.url },
        ]);
      }
      toast.success("קבצים הועלו בהצלחה");
    } catch {
      toast.error("שגיאה בהעלאת קבצים");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const removeFile = (id: string) => setUploadedFiles((prev) => prev.filter((f) => f.id !== id));

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim() || !form.slug.trim()) {
      toast.error("יש למלא כותרת, תוכן וכתובת URL");
      return;
    }
    if (!form.category) {
      toast.error("יש לבחור קטגוריה");
      return;
    }
    if (isEdit && articleId) {
      updateArticle.mutate({
        id: articleId,
        title: form.title,
        slug: form.slug || undefined,
        body: form.body,
        excerpt: form.excerpt || undefined,
        coverImage: form.coverImage || undefined,
        category: form.category,
        tags: form.tags || undefined,
        published: form.published,
      });
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

  if (!canWrite) {
    return (
      <div className="container max-w-2xl py-12">
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <h1 className="font-display font-bold text-2xl text-foreground mb-4">אין לך הרשאה לכתוב מאמרים</h1>
          <p className="text-muted-foreground mb-6">
            רק אדמין וסופרים אורחים מאושרים יכולים לכתוב מאמרים.
          </p>
          <Button onClick={() => navigate("/")} className="gap-2">
            <ArrowRight className="w-4 h-4" />
            חזרה לדף הבית
          </Button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container py-24 text-center">
        <p className="text-xl font-display font-bold text-foreground mb-2">גישה מוגבלת</p>
        <Button variant="outline" onClick={() => navigate("/")}>חזרה לדף הבית</Button>
      </div>
    );
  }

  const isPending = createArticle.isPending || updateArticle.isPending;

  return (
    <div className="container py-10 max-w-4xl mx-auto">
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
            onValueChange={(v) => setForm((prev) => ({ ...prev, category: v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="בחרו קטגוריה" />
            </SelectTrigger>
            <SelectContent>
              {(dynamicCategories ?? []).map((cat) => (
                <SelectItem key={cat.slug} value={cat.slug}>
                  {cat.name}
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
          <Label className="text-sm font-medium">
            תוכן המאמר <span className="text-destructive">*</span>
          </Label>
          <RichTextEditor
            value={form.body}
            onChange={(html) => setForm((prev) => ({ ...prev, body: html }))}
            placeholder="כתבו את תוכן המאמר כאן..."
          />
        </div>

        {/* Cover Image — file upload */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">תמונת שער</Label>

          {form.coverImage ? (
            /* Preview with replace/remove */
            <div className="relative group rounded-2xl overflow-hidden border border-border/50 bg-secondary/20 shadow-md">
              <img
                src={form.coverImage}
                alt="תמונת שער"
                className="w-full object-contain"
                style={{ aspectRatio: "16/9", objectFit: "contain" }}
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => coverImageInputRef.current?.click()}
                  className="gap-2 bg-background/90 hover:bg-background text-foreground border-border"
                  disabled={coverUploading}
                >
                  {coverUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  החלף תמונה
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setForm((prev) => ({ ...prev, coverImage: "" }))}
                  className="gap-2 bg-background/90 hover:bg-background text-destructive border-border"
                >
                  <Trash2 className="w-4 h-4" />
                  הסר
                </Button>
              </div>
            </div>
          ) : (
            /* Upload dropzone */
            <div
              onClick={() => coverImageInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
            >
              {coverUploading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">מעלה תמונה...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">לחצו להעלאת תמונת שער</p>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WebP — עד 10MB</p>
                  </div>
                  <Button type="button" size="sm" variant="outline" className="gap-2 pointer-events-none">
                    <Upload className="w-4 h-4" />
                    בחרו קובץ
                  </Button>
                </div>
              )}
            </div>
          )}

          <input
            ref={coverImageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCoverImageUpload}
          />
        </div>

        {/* File Attachments */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">קבצים מצורפים</Label>
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
              id="file-input"
            />
            <label htmlFor="file-input" className="cursor-pointer block">
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground mb-1">
                {isUploading ? "מעלה..." : "לחצו או גררו קבצים"}
              </p>
              <p className="text-xs text-muted-foreground">PDF, Word, תמונות וקבצים אחרים</p>
            </label>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="space-y-2 mt-4">
              <p className="text-sm font-medium text-foreground">קבצים שהועלו:</p>
              <div className="space-y-2">
                {uploadedFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between bg-secondary/50 rounded-lg p-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <File className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeFile(file.id)} className="flex-shrink-0">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
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
          <Button type="submit" disabled={isPending} className="flex-1 sm:flex-none gap-2">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
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
