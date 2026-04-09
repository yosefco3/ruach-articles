import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowRight, Plus, Trash2, GripVertical, Palette, Pencil } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

function slugify(text: string) {
  // For Hebrew text, transliterate common words or use as-is
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0590-\u05FF-]/g, "")
    .trim();
}

export default function AdminCategories() {
  const [, navigate] = useLocation();
  const { user, loading } = useAuth();
  const utils = trpc.useUtils();

  const isAdmin = user?.role === "admin";

  const { data: categories, isLoading: categoriesLoading } = trpc.categories.list.useQuery();

  const [newCategory, setNewCategory] = useState({
    name: "",
    slug: "",
    description: "",
    color: "#8B6914",
  });
  const [slugManual, setSlugManual] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "", color: "#8B6914" });

  const createCategory = trpc.categories.create.useMutation({
    onSuccess: () => {
      utils.categories.list.invalidate();
      setNewCategory({ name: "", slug: "", description: "", color: "#8B6914" });
      setSlugManual(false);
      toast.success("הקטגוריה נוצרה בהצלחה");
    },
    onError: (err) => toast.error(err.message || "שגיאה ביצירת קטגוריה"),
  });

  const deleteCategory = trpc.categories.delete.useMutation({
    onSuccess: () => {
      utils.categories.list.invalidate();
      toast.success("הקטגוריה נמחקה");
    },
    onError: (err) => toast.error(err.message || "שגיאה במחיקת קטגוריה"),
  });

  const updateCategory = trpc.categories.update.useMutation({
    onSuccess: () => {
      utils.categories.list.invalidate();
      toast.success("הקטגוריה עודכנה");
    },
    onError: (err) => toast.error(err.message || "שגיאה בעדכון קטגוריה"),
  });

  const handleNameChange = (value: string) => {
    setNewCategory((prev) => ({
      ...prev,
      name: value,
      slug: slugManual ? prev.slug : slugify(value),
    }));
  };

  const handleCreate = () => {
    if (!newCategory.name.trim() || !newCategory.slug.trim()) {
      toast.error("יש למלא שם וכתובת URL לקטגוריה");
      return;
    }
    createCategory.mutate({
      name: newCategory.name,
      slug: newCategory.slug,
      description: newCategory.description || undefined,
      color: newCategory.color,
      sortOrder: (categories?.length ?? 0) + 1,
    });
  };

  const handleDelete = (id: number, name: string) => {
    if (confirm(`האם למחוק את הקטגוריה "${name}"? מאמרים שמשויכים לקטגוריה זו לא יימחקו.`)) {
      deleteCategory.mutate({ id });
    }
  };

  if (loading || categoriesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container max-w-2xl py-12">
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <h1 className="font-display font-bold text-2xl text-foreground mb-4">אין גישה</h1>
          <p className="text-muted-foreground mb-6">רק מנהלים יכולים לנהל קטגוריות.</p>
          <Button onClick={() => navigate("/")} className="gap-2">
            <ArrowRight className="w-4 h-4" />
            חזרה לדף הבית
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
          <ArrowRight className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="font-display font-bold text-2xl text-foreground">ניהול קטגוריות</h1>
          <p className="text-sm text-muted-foreground">הוסיפו, ערכו או מחקו קטגוריות מאמרים</p>
        </div>
      </div>

      {/* Add New Category */}
      <div className="bg-card border border-border rounded-xl p-6 mb-8">
        <h2 className="font-display font-bold text-lg text-foreground mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-primary" />
          הוספת קטגוריה חדשה
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">שם הקטגוריה</Label>
            <Input
              value={newCategory.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="למשל: קבלה"
              dir="rtl"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">כתובת URL (slug)</Label>
            <Input
              value={newCategory.slug}
              onChange={(e) => {
                setSlugManual(true);
                setNewCategory((prev) => ({ ...prev, slug: e.target.value }));
              }}
              placeholder="kabbalah"
              dir="ltr"
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">תיאור (אופציונלי)</Label>
            <Input
              value={newCategory.description}
              onChange={(e) => setNewCategory((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="תיאור קצר של הקטגוריה"
              dir="rtl"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Palette className="w-4 h-4" />
              צבע
            </Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={newCategory.color}
                onChange={(e) => setNewCategory((prev) => ({ ...prev, color: e.target.value }))}
                className="w-10 h-10 rounded-lg border border-border cursor-pointer"
              />
              <Input
                value={newCategory.color}
                onChange={(e) => setNewCategory((prev) => ({ ...prev, color: e.target.value }))}
                placeholder="#8B6914"
                dir="ltr"
                className="font-mono text-sm flex-1"
              />
            </div>
          </div>
        </div>
        <Button
          onClick={handleCreate}
          disabled={createCategory.isPending}
          className="mt-4 gap-2"
        >
          {createCategory.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          הוסף קטגוריה
        </Button>
      </div>

      {/* Existing Categories */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-display font-bold text-lg text-foreground">
            קטגוריות קיימות ({categories?.length ?? 0})
          </h2>
        </div>

        {categories && categories.length > 0 ? (
          <div className="divide-y divide-border">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center gap-4 px-6 py-4 hover:bg-accent/30 transition-colors"
              >
                <GripVertical className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0 border border-border"
                  style={{ backgroundColor: cat.color || "#8B6914" }}
                />
                <div className="flex-1 min-w-0">
                  {editingId === cat.id ? (
                    <div className="space-y-2">
                      <Input
                        value={editForm.name}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="שם הקטגוריה"
                        dir="rtl"
                        className="h-8 text-sm"
                      />
                      <div className="flex items-center gap-2">
                        <Input
                          value={editForm.description}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                          placeholder="תיאור"
                          dir="rtl"
                          className="h-8 text-sm flex-1"
                        />
                        <input
                          type="color"
                          value={editForm.color}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, color: e.target.value }))}
                          className="w-8 h-8 rounded border border-border cursor-pointer"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            updateCategory.mutate({
                              id: cat.id,
                              name: editForm.name,
                              description: editForm.description || undefined,
                              color: editForm.color,
                            });
                            setEditingId(null);
                          }}
                          disabled={updateCategory.isPending}
                          className="h-7 text-xs"
                        >
                          שמור
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingId(null)}
                          className="h-7 text-xs"
                        >
                          ביטול
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-foreground">{cat.name}</span>
                        <span className="text-xs font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                          /{cat.slug}
                        </span>
                      </div>
                      {cat.description && (
                        <p className="text-sm text-muted-foreground mt-0.5 truncate">{cat.description}</p>
                      )}
                    </>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {editingId !== cat.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingId(cat.id);
                        setEditForm({
                          name: cat.name,
                          description: cat.description || "",
                          color: cat.color || "#8B6914",
                        });
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(cat.id, cat.name)}
                    disabled={deleteCategory.isPending}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <p className="text-muted-foreground">אין קטגוריות עדיין. הוסיפו את הקטגוריה הראשונה למעלה.</p>
          </div>
        )}
      </div>
    </div>
  );
}
