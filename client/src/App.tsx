import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import ArticlePage from "./pages/ArticlePage";
import CategoryPage from "./pages/CategoryPage";
import AdminPage from "./pages/AdminPage";
import AdminArticleForm from "./pages/AdminArticleForm";
import About from "./pages/About";
import Contact from "./pages/Contact";
import AdminSettings from "./pages/AdminSettings";
import AdminGuestPosts from "./pages/AdminGuestPosts";
import AdminUsers from "./pages/AdminUsers";
import AdminCategories from "./pages/AdminCategories";
import AdminNewsletter from "./pages/AdminNewsletter";
import GuestPostForm from "./pages/GuestPostForm";
import UserProfile from "./pages/UserProfile";
import SiteLayout from "./components/SiteLayout";
import { ScrollToTop } from "./components/ScrollToTop";

function Router() {
  return (
    <SiteLayout>
      <ScrollToTop />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/about" component={About} />
        <Route path="/contact" component={Contact} />
        {/* guest-post route hidden — will be re-enabled when ready */}
        <Route path="/profile/:userId" component={UserProfile} />
        <Route path="/category/:category" component={CategoryPage} />
        <Route path="/article/:slug" component={ArticlePage} />
        <Route path="/admin" component={AdminPage} />
        <Route path="/admin/new" component={AdminArticleForm} />
        <Route path="/admin/edit/:id" component={AdminArticleForm} />
        <Route path="/admin/settings" component={AdminSettings} />
        <Route path="/admin/guest-posts" component={AdminGuestPosts} />
        <Route path="/admin/users" component={AdminUsers} />
        <Route path="/admin/categories" component={AdminCategories} />
        <Route path="/admin/newsletter" component={AdminNewsletter} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </SiteLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster position="top-center" richColors />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
