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
import { Menu, X, User, LogOut, Settings, ChevronDown, Mail, Sparkles, WandSparkles, BookOpen, Users, Compass, CalendarDays } from "lucide-react";
import { useState } from "react";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, logout } = useAuth();
  const { data: settings } = trpc.settings.get.useQuery();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();
  // מורה מקושר רואה קישור לעריכת הפרופיל שלו
  const { data: teacherMe } = trpc.teachers.me.useQuery(undefined, { enabled: isAuthenticated, retry: false });

  const isAdmin = user?.role === "admin";
  const siteName = settings?.siteTitle || "דרך הרוח";
  const textLink = (href: string, label: string, exact = true) => (
    <Link
      href={href}
      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
        (exact ? location === href : location.startsWith(href)) ? "bg-accent text-accent-foreground" : "text-muted-foreground"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <a href="#main" className="skip-link">
        דילוג לתוכן הראשי
      </a>
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
                  {settings?.heroSubtitle?.split(" — ")?.[0] || "הנבואה הטבעית"}
                </span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav aria-label="ניווט ראשי" className="hidden md:flex items-center gap-1">
              <Link
                href="/iching"
                className={`inline-flex items-center gap-1.5 px-4 py-2 me-1 rounded-full text-sm font-semibold border transition-colors ${
                  location === "/iching"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                קריאה באי צינג
              </Link>
              <Link
                href="/tarot"
                className={`inline-flex items-center gap-1.5 px-4 py-2 me-1 rounded-full text-sm font-semibold border transition-colors ${
                  location === "/tarot"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground"
                }`}
              >
                <WandSparkles className="w-3.5 h-3.5" />
                קריאה בטארוט
              </Link>
              {textLink("/books", "ספרים", false)}
              {textLink("/derech", "הדרך")}
              {textLink("/teachers", "מורים", false)}
              {settings?.eventsVisible && textLink("/events", "אירועים", false)}
              {textLink("/about", "אודות")}
              {textLink("/contact", "יצירת קשר")}
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
                          <Link href="/admin/books" className="flex items-center gap-2 cursor-pointer">
                            <BookOpen className="w-4 h-4" />
                            <span>ספרים</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/admin/teachers" className="flex items-center gap-2 cursor-pointer">
                            <Users className="w-4 h-4" />
                            <span>מורים</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/admin/events" className="flex items-center gap-2 cursor-pointer">
                            <CalendarDays className="w-4 h-4" />
                            <span>אירועים</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/admin/newsletter" className="flex items-center gap-2 cursor-pointer">
                            <Mail className="w-4 h-4" />
                            <span>ניוזלטר</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/admin/users" className="flex items-center gap-2 cursor-pointer">
                            <User className="w-4 h-4" />
                            <span>ניהול משתמשים</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/admin/iching" className="flex items-center gap-2 cursor-pointer">
                            <Sparkles className="w-4 h-4" />
                            <span>אִי צִ׳ינְג</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/admin/tarot" className="flex items-center gap-2 cursor-pointer">
                            <WandSparkles className="w-4 h-4" />
                            <span>טָארוֹט</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    {teacherMe && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href="/my-teacher-profile" className="flex items-center gap-2 cursor-pointer">
                            <Compass className="w-4 h-4" />
                            <span>הפרופיל שלי כמורה</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/admin/new" className="flex items-center gap-2 cursor-pointer">
                            <Settings className="w-4 h-4" />
                            <span>מאמר חדש</span>
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
                aria-label={mobileOpen ? "סגירת תפריט" : "פתיחת תפריט"}
                aria-expanded={mobileOpen}
                aria-controls="mobile-nav"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <nav
            id="mobile-nav"
            aria-label="ניווט נייד"
            className="md:hidden border-t border-border bg-card px-4 py-3 flex flex-col gap-1"
          >
            <Link
              href="/iching"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-3 py-2 mb-1 rounded-full text-sm font-semibold border border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              קריאה באי צינג
            </Link>
            <Link
              href="/tarot"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-3 py-2 mb-1 rounded-full text-sm font-semibold border border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <WandSparkles className="w-4 h-4" />
              קריאה בטארוט
            </Link>
            <Link
              href="/books"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              ספרים
            </Link>
            <Link
              href="/derech"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              הדרך
            </Link>
            <Link
              href="/teachers"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              מורים בשיטה
            </Link>
            {settings?.eventsVisible && (
              <Link
                href="/events"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                אירועים
              </Link>
            )}
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
          </nav>
        )}
      </header>

      {/* ── Main Content ── */}
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>

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
                {settings?.heroSubtitle || "הנבואה הטבעית"}
              </p>
            </div>

            <nav aria-label="ניווט תחתון" className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              <Link
                href="/books"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ספרים
              </Link>
              <Link
                href="/teachers"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                מורים בשיטה
              </Link>
              {settings?.eventsVisible && (
                <Link
                  href="/events"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  אירועים
                </Link>
              )}
              <Link
                href="/iching"
                className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                קריאה באי צינג
              </Link>
              <Link
                href="/tarot"
                className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                קריאה בטארוט
              </Link>
              <Link
                href="/derech"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                הדרך
              </Link>
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
              <Link
                href="/accessibility"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                הצהרת נגישות
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
