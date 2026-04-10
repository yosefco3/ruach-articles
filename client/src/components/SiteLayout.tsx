import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useLocation } from "wouter";
import { Menu, X, User, LogOut, Settings, ChevronDown, Tag, Mail } from "lucide-react";
import { useState } from "react";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, logout } = useAuth();
  const { data: settings } = trpc.settings.get.useQuery();
  const { data: categories } = trpc.categories.list.useQuery();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();

  const isAdmin = user?.role === "admin";
  const siteName = settings?.siteTitle || "רוּחַ";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ── Top Navigation ── */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border shadow-sm">
        <div className="container">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shadow-sm">
                <span className="text-primary-foreground font-display font-bold text-lg leading-none">ר</span>
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-display font-bold text-xl text-foreground tracking-tight">{siteName}</span>
                <span className="text-[10px] text-muted-foreground font-sans tracking-wide hidden sm:block">
                  {settings?.heroSubtitle?.split(" — ")?.[0] || "רוחניות · פילוסופיה · ריפוי"}
                </span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {(categories ?? []).map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/category/${cat.slug}`}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
                    location === `/category/${cat.slug}`
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {cat.name}
                </Link>
              ))}
              <Link
                href="/about"
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
                  location === "/about" ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                }`}
              >
                אודות
              </Link>
              <Link
                href="/contact"
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
                  location === "/contact" ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                }`}
              >
                יצירת קשר
              </Link>
            </nav>

            {/* Auth Actions */}
            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 h-9 px-3">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium hidden sm:block max-w-[100px] truncate">
                        {user?.name || "משתמש"}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {isAdmin && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href="/admin" className="flex items-center gap-2 cursor-pointer">
                            <Settings className="w-4 h-4" />
                            <span>מאמרים</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/admin/settings" className="flex items-center gap-2 cursor-pointer">
                            <Settings className="w-4 h-4" />
                            <span>הגדרות</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/admin/categories" className="flex items-center gap-2 cursor-pointer">
                            <Tag className="w-4 h-4" />
                            <span>קטגוריות</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/admin/newsletter" className="flex items-center gap-2 cursor-pointer">
                            <Mail className="w-4 h-4" />
                            <span>ניוזלטר</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/admin/guest-posts" className="flex items-center gap-2 cursor-pointer">
                            <Settings className="w-4 h-4" />
                            <span>הצעות אורחים</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/admin/users" className="flex items-center gap-2 cursor-pointer">
                            <User className="w-4 h-4" />
                            <span>ניהול משתמשים</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem
                      onClick={() => logout()}
                      className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>התנתקות</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  size="sm"
                  className="font-medium"
                  onClick={() => (window.location.href = getLoginUrl())}
                >
                  כניסה
                </Button>
              )}

              {/* Mobile menu toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border bg-card px-4 py-3 flex flex-col gap-1">
            {(categories ?? []).map((cat) => (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                {cat.name}
              </Link>
            ))}
            <Link
              href="/about"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              אודות
            </Link>
            <Link
              href="/contact"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              יצירת קשר
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 rounded-md text-sm font-medium text-primary hover:bg-accent transition-colors"
              >
                לוח ניהול
              </Link>
            )}
          </div>
        )}
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1">{children}</main>

      {/* ── Footer ── */}
      <footer className="bg-card border-t border-border mt-16">
        <div className="container py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col items-center md:items-end gap-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-display font-bold text-sm leading-none">ר</span>
                </div>
                <span className="font-display font-bold text-lg text-foreground">{siteName}</span>
              </div>
              <p className="text-sm text-muted-foreground text-center md:text-right">
                {settings?.heroSubtitle || "רוחניות · פילוסופיה · ריפוי"}
              </p>
            </div>

            <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              {(categories ?? []).map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/category/${cat.slug}`}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {cat.name}
                </Link>
              ))}
              <Link
                href="/about"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                אודות
              </Link>
              <Link
                href="/contact"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                יצירת קשר
              </Link>
            </nav>
          </div>

          <div className="divider-gold my-6" />

          <p className="text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} {siteName} · כל הזכויות שמורות
          </p>
        </div>
      </footer>
    </div>
  );
}
