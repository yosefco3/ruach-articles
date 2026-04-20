import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, GripVertical, FileText, Image as ImageIcon } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

type ArticleItem = {
  id: number;
  title: string;
  slug: string;
  coverImage?: string | null;
  published: boolean;
  sortOrder: number;
  createdAt: Date | string;
};

// ─── Sortable article row ─────────────────────────────────────────────────────
function SortableArticleRow({ article, index }: { article: ArticleItem; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: article.id });

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
      className="flex items-center gap-4 px-5 py-3 hover:bg-accent/30 transition-colors border-b border-border last:border-0"
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

      {/* Order number */}
      <span className="text-xs font-mono text-muted-foreground w-6 text-center flex-shrink-0">
        {index + 1}
      </span>

      {/* Thumbnail */}
      <div className="w-12 h-8 rounded overflow-hidden flex-shrink-0 bg-secondary">
        {article.coverImage ? (
          <img
            src={article.coverImage}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-4 h-4 text-muted-foreground/30" />
          </div>
        )}
      </div>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-foreground truncate">{article.title}</p>
        <p className="text-xs text-muted-foreground font-mono">/{article.slug}</p>
      </div>

      {/* Status badge */}
      <span
        className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
          article.published
            ? "bg-green-500/10 text-green-500 border border-green-500/20"
            : "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
        }`}
      >
        {article.published ? "פורסם" : "טיוטה"}
      </span>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminArticleOrder() {
  const [, navigate] = useLocation();
  const { user, loading } = useAuth();
  const utils = trpc.useUtils();

  const isAdmin = user?.role === "admin";

  const { data: categoriesData, isLoading: catsLoading } = trpc.categories.list.useQuery();
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  // Auto-select first category once loaded
  useEffect(() => {
    if (categoriesData && categoriesData.length > 0 && !selectedCategory) {
      setSelectedCategory(categoriesData[0].slug);
    }
  }, [categoriesData, selectedCategory]);

  // Fetch articles for selected category (all articles including drafts for admin)
  const { data: articlesData, isLoading: articlesLoading } = trpc.articles.list.useQuery(
    { category: selectedCategory, all: true },
    { enabled: !!selectedCategory }
  );

  // Local ordered list for optimistic drag reorder
  const [localArticles, setLocalArticles] = useState<ArticleItem[] | null>(null);

  // Reset local state when category changes or data refreshes
  useEffect(() => {
    setLocalArticles(null);
  }, [selectedCategory, articlesData]);

  const displayArticles: ArticleItem[] = useMemo(() => {
    if (localArticles) return localArticles;
    return (articlesData as ArticleItem[] | undefined) ?? [];
  }, [localArticles, articlesData]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const reorderMutation = trpc.articles.reorder.useMutation({
    onSuccess: () => {
      utils.articles.list.invalidate();
    },
    onError: () => {
      toast.error("שגיאה בשמירת הסדר");
      setLocalArticles(null);
      utils.articles.list.invalidate();
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = displayArticles.findIndex((a) => a.id === active.id);
    const newIndex = displayArticles.findIndex((a) => a.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(displayArticles, oldIndex, newIndex);
    const withOrder = reordered.map((a, i) => ({ ...a, sortOrder: i + 1 }));
    setLocalArticles(withOrder); // optimistic

    reorderMutation.mutate({
      items: withOrder.map(({ id, sortOrder }) => ({ id, sortOrder })),
    });
    toast.success("סדר המאמרים עודכן");
  };

  if (loading || catsLoading) {
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
          <p className="text-muted-foreground mb-6">רק מנהלים יכולים לסדר מאמרים.</p>
          <Button onClick={() => navigate("/")} className="gap-2">
            <ArrowRight className="w-4 h-4" />
            חזרה לדף הבית
          </Button>
        </div>
      </div>
    );
  }

  const selectedCat = categoriesData?.find((c) => c.slug === selectedCategory);

  return (
    <div className="container py-10 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
          <ArrowRight className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="font-display font-bold text-2xl text-foreground">סידור מאמרים</h1>
          <p className="text-sm text-muted-foreground">
            גררו מאמרים לשינוי סדר התצוגה בדף הקטגוריה
          </p>
        </div>
      </div>

      {/* Category selector */}
      <div className="bg-card border border-border rounded-xl p-6 mb-8">
        <label className="text-sm font-medium text-foreground mb-3 block">
          בחרו קטגוריה
        </label>
        {categoriesData && categoriesData.length > 0 ? (
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger dir="rtl" className="w-full sm:w-80">
              <SelectValue placeholder="בחרו קטגוריה" />
            </SelectTrigger>
            <SelectContent>
              {categoriesData.map((cat) => (
                <SelectItem key={cat.slug} value={cat.slug}>
                  <span className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full inline-block flex-shrink-0"
                      style={{ backgroundColor: cat.color || "#8B6914" }}
                    />
                    {cat.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <p className="text-sm text-muted-foreground">
            אין קטגוריות. צרו קטגוריות תחילה בדף{" "}
            <button
              onClick={() => navigate("/admin/categories")}
              className="text-primary hover:underline"
            >
              ניהול קטגוריות
            </button>
            .
          </p>
        )}
      </div>

      {/* Articles list with drag-and-drop */}
      {selectedCategory && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              {selectedCat?.color && (
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: selectedCat.color }}
                />
              )}
              <h2 className="font-display font-bold text-lg text-foreground">
                {selectedCat?.name ?? selectedCategory}
              </h2>
              <span className="text-xs text-muted-foreground">
                ({displayArticles.length} מאמרים)
              </span>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <GripVertical className="w-3 h-3" />
              גרור לשינוי סדר
            </p>
          </div>

          {articlesLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : displayArticles.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={displayArticles.map((a) => a.id)}
                strategy={verticalListSortingStrategy}
              >
                <div>
                  {displayArticles.map((article, index) => (
                    <SortableArticleRow
                      key={article.id}
                      article={article}
                      index={index}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="px-6 py-16 text-center">
              <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">אין מאמרים בקטגוריה זו</p>
            </div>
          )}
        </div>
      )}

      {reorderMutation.isPending && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-card border border-border rounded-full px-4 py-2 shadow-lg flex items-center gap-2 text-sm">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span className="text-muted-foreground">שומר סדר...</span>
        </div>
      )}
    </div>
  );
}
