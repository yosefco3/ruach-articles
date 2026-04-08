import { Link } from "wouter";
import { getCategoryLabel, getCategoryBadgeClass } from "@/lib/categories";
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
  const dateStr = new Date(createdAt).toLocaleDateString("he-IL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (featured) {
    return (
      <Link href={`/article/${slug}`} className="block group">
        <article className="relative overflow-hidden rounded-2xl bg-card border border-border shadow-sm card-hover">
          {coverImage && (
            <div className="relative h-72 overflow-hidden">
              <img
                src={coverImage}
                alt={title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="absolute bottom-0 right-0 left-0 p-6">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-3 ${getCategoryBadgeClass(category)}`}>
                  {getCategoryLabel(category)}
                </span>
                <h2 className="font-display font-bold text-2xl text-white leading-tight line-clamp-2">
                  {title}
                </h2>
              </div>
            </div>
          )}
          {!coverImage && (
            <div className="p-8">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-4 ${getCategoryBadgeClass(category)}`}>
                {getCategoryLabel(category)}
              </span>
              <h2 className="font-display font-bold text-2xl text-foreground leading-tight mb-3">
                {title}
              </h2>
              {excerpt && (
                <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed">{excerpt}</p>
              )}
            </div>
          )}
          {coverImage && excerpt && (
            <div className="p-5">
              <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed">{excerpt}</p>
            </div>
          )}
          <div className="px-5 pb-5 flex items-center gap-4 text-xs text-muted-foreground">
            {authorName && (
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {authorName}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {dateStr}
            </span>
          </div>
        </article>
      </Link>
    );
  }

  return (
    <Link href={`/article/${slug}`} className="block group">
      <article className="bg-card border border-border rounded-xl overflow-hidden shadow-sm card-hover h-full flex flex-col">
        {coverImage && (
          <div className="relative h-44 overflow-hidden flex-shrink-0">
            <img
              src={coverImage}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          </div>
        )}
        <div className="p-5 flex flex-col flex-1">
          <span className={`inline-block self-start px-2.5 py-0.5 rounded-full text-xs font-medium mb-3 ${getCategoryBadgeClass(category)}`}>
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
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {authorName}
              </span>
            )}
            <span className="flex items-center gap-1 mr-auto">
              <Calendar className="w-3 h-3" />
              {dateStr}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
