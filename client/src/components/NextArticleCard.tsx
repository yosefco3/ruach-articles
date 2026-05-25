import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { useDynamicCategories } from "@/hooks/useDynamicCategories";

interface NextArticleCardProps {
  article: {
    slug: string;
    title: string;
    excerpt?: string | null;
    coverImage?: string | null;
    category: string;
  };
  isRandom?: boolean;
}

export default function NextArticleCard({ article, isRandom = false }: NextArticleCardProps) {
  const { getCategoryLabel, getCategoryBadgeStyle } = useDynamicCategories();

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card hover:shadow-lg transition-all duration-300 group">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">
            {isRandom ? "מאמר מומלץ" : "המאמר הבא"}
          </h3>
          <span
            className="inline-block px-2.5 py-1 rounded-full text-xs font-medium border"
            style={getCategoryBadgeStyle(article.category)}
          >
            {getCategoryLabel(article.category)}
          </span>
        </div>

        {/* Content */}
        <div className="flex gap-4">
          {/* Cover Image */}
          {article.coverImage && (
            <div className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-secondary">
              <img
                src={article.coverImage}
                alt={article.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          )}

          {/* Text Content */}
          <div className="flex-1 min-w-0">
            <h4 className="font-display font-bold text-lg text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
              {article.title}
            </h4>
            {article.excerpt && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {article.excerpt}
              </p>
            )}
          </div>
        </div>

        {/* CTA Button */}
        <Link href={`/article/${article.slug}`}>
          <a className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm group-hover:gap-3 transition-all">
            <span>קרא עוד</span>
            <ArrowLeft className="w-4 h-4" />
          </a>
        </Link>
      </div>
    </div>
  );
}