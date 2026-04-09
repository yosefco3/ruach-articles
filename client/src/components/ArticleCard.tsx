import { Link } from "wouter";
import { useDynamicCategories } from "@/hooks/useDynamicCategories";
import { Calendar, User } from "lucide-react";

interface ArticleCardProps {
  id: number;
  title: string;
  slug: string;
  excerpt?: string | null;
  coverImage?: string | null;
  category: string;
  tags?: string | null;
  authorName?: string | null;
  createdAt: Date | string;
  featured?: boolean;
}

export default function ArticleCard({
  title,
  slug,
  excerpt,
  coverImage,
  category,
  authorName,
  createdAt,
  featured = false,
}: ArticleCardProps) {
  const { getCategoryLabel, getCategoryBadgeStyle } = useDynamicCategories();
  const dateStr = new Date(createdAt).toLocaleDateString("he-IL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const badgeStyle = getCategoryBadgeStyle(category);

  if (featured) {
    return (
      <Link href={`/article/${slug}`} className="block group">
        <article className="rounded-2xl bg-card border border-border shadow-md card-hover transition-shadow hover:shadow-xl overflow-hidden">
          <div className="flex flex-col md:flex-row-reverse gap-0">
            {/* Image — fixed width on desktop, full width on mobile */}
            {coverImage && (
              <div className="relative md:w-80 lg:w-96 flex-shrink-0 overflow-hidden" style={{ aspectRatio: "4/3" }}>
                <img
                  src={coverImage}
                  alt={title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent md:bg-gradient-to-l" />
              </div>
            )}
            {/* Content */}
            <div className="flex flex-col flex-1 p-6 md:p-8 justify-between">
              <div>
                <span
                  className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4 border"
                  style={badgeStyle}
                >
                  {getCategoryLabel(category)}
                </span>
                <h2 className="font-display font-bold text-xl md:text-2xl text-foreground leading-snug mb-3 line-clamp-3 group-hover:text-primary transition-colors">
                  {title}
                </h2>
                {excerpt && (
                  <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed">{excerpt}</p>
                )}
              </div>
              <div className="flex items-center gap-4 mt-5 pt-4 border-t border-border text-xs text-muted-foreground">
                {authorName && (
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    {authorName}
                  </span>
                )}
                <span className="flex items-center gap-1.5 mr-auto">
                  <Calendar className="w-3.5 h-3.5" />
                  {dateStr}
                </span>
              </div>
            </div>
          </div>
        </article>
      </Link>
    );
  }

  return (
    <Link href={`/article/${slug}`} className="block group">
      <article className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm card-hover h-full flex flex-col transition-shadow hover:shadow-md">
        {coverImage && (
          /* Fixed 3:2 aspect ratio for regular cards */
          <div className="relative overflow-hidden flex-shrink-0" style={{ aspectRatio: "3/2" }}>
            <img
              src={coverImage}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
          </div>
        )}
        <div className="p-5 flex flex-col flex-1">
          <span
            className="inline-block self-start px-2.5 py-0.5 rounded-full text-xs font-semibold mb-3 border"
            style={badgeStyle}
          >
            {getCategoryLabel(category)}
          </span>
          <h3 className="font-display font-bold text-lg text-foreground leading-snug mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
          {excerpt && (
            <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed flex-1">{excerpt}</p>
          )}
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
            {authorName && (
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                {authorName}
              </span>
            )}
            <span className="flex items-center gap-1.5 mr-auto">
              <Calendar className="w-3.5 h-3.5" />
              {dateStr}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
