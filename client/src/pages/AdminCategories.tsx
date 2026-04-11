import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowRight, Plus, Trash2, GripVertical, Palette, Pencil } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Category = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  color?: string | null;
  sortOrder: number;
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0590-\u05FF-]/g, "")
    .trim();
}

// ─── Sortable row ────────────────────────────────────────────────────────────
function SortableCategoryRow({
  cat,
  editingId,
  editForm,
  setEditForm,
  setEditingId,
  onSave,
  onDelete,
  updatePending,
  deletePending,
}: {
  cat: Category;
  editingId: number | null;
  editForm: { name: string; description: string; color: string };
  setEditForm: React.Dispatch<React.SetStateAction<{ name: string; description: string; color: string }>>;
  setEditingId: (id: number | null) => void;
  onSave: () => void;
  onDelete: (id: number, name: string) => void;
  updatePending: boolean;
  deletePending: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: cat.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-4 px-6 py-4 hover:bg-accent/30 transition-colors border-b border-border last:border-0"
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground flex-shrink-0 touch-none"
        aria-label="גרור לשינוי סדר"
      >
        <GripVertical className="w-4 h-4" />
      </button>

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
                onClick={onSave}
                disabled={updatePending}
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
          onClick={() => onDelete(cat.id, cat.name)}
          disabled={deletePending}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminCategories() {
  const [, navigate] = useLocation();
  const { user, loading } = useAuth();
  const utils = trpc.useUtils();

  const isAdmin = user?.role === "admin";

  const { data: categoriesData, isLoading: categoriesLoading } = trpc.categories.list.useQuery();

  // Local ordered list for optimistic drag reorder
  const [localCategories, setLocalCategories] = useState<Category[] | null>(null);
  const displayCategories: Category[] = localCategories ?? (categoriesData as Category[] | undefined) ?? [];

  const [newCategory, setNewCategory] = useState({
    name: "",
    slug: "",
    description: "",
    color: "#8B6914",
  });
  const [slugManual, setSlugManual] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "", color: "#8B6914" });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const createCategory = trpc.categories.create.useMutation({
    onSuccess: () => {
      utils.categories.list.invalidate();
      setLocalCategories(null);
      setNewCategory({ name: "", slug: "", description: "", color: "#8B6914" });
      setSlugManual(false);
      toast.success("הקטגוריה נוצרה בהצלחה");
    },
    onError: (err) => toast.error(err.message || "שגיאה ביצירת קטגוריה"),
  });

  const deleteCategory = trpc.categories.delete.useMutation({
    onSuccess: () => {
      utils.categories.list.invalidate();
      setLocalCategories(null);
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

  const reorderCategories = trpc.categories.reorder.useMutation({
    onError: (err) => {
      toast.error("שגיאה בשמירת הסדר");
      setLocalCategories(null); // revert optimistic update
      utils.categories.list.invalidate();
    },
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
      sortOrder: (displayCategories.length) + 1,
    });
  };

  const handleDelete = (id: number, name: string) => {
    if (confirm(`האם למחוק את הקטגוריה "${name}"? מאמרים שמשויכים לקטגוריה זו לא יימחקו.`)) {
      deleteCategory.mutate({ id });
    }
  };

  const handleSaveEdit = (cat: Category) => {
    updateCategory.mutate({
      id: cat.id,
      name: editForm.name,
      description: editForm.description || undefined,
      color: editForm.color,
    });
    setEditingId(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = displayCategories.findIndex((c) => c.id === active.id);
    const newIndex = displayCategories.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(displayCategories, oldIndex, newIndex);
    // Assign new sortOrder values
    const withOrder = reordered.map((c, i) => ({ ...c, sortOrder: i + 1 }));
    setLocalCategories(withOrder); // optimistic

    reorderCategories.mutate({
      items: withOrder.map(({ id, sortOrder }) => ({ id, sortOrder })),
    });
    toast.success("סדר הקטגוריות עודכן");
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

      {/* Existing Categories with drag-and-drop */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-display font-bold text-lg text-foreground">
            קטגוריות קיימות ({displayCategories.length})
          </h2>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <GripVertical className="w-3 h-3" />
            גרור לשינוי סדר
          </p>
        </div>

        {displayCategories.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={displayCategories.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <div>
                {displayCategories.map((cat) => (
                  <SortableCategoryRow
                    key={cat.id}
                    cat={cat}
                    editingId={editingId}
                    editForm={editForm}
                    setEditForm={setEditForm}
                    setEditingId={setEditingId}
                    onSave={() => handleSaveEdit(cat)}
                    onDelete={handleDelete}
                    updatePending={updateCategory.isPending}
                    deletePending={deleteCategory.isPending}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="px-6 py-12 text-center">
            <p className="text-muted-foreground">אין קטגוריות עדיין. הוסיפו את הקטגוריה הראשונה למעלה.</p>
          </div>
        )}
      </div>
    </div>
  );
}
