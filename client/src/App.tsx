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
import GuestPostForm from "./pages/GuestPostForm";
import UserProfile from "./pages/UserProfile";
import SiteLayout from "./components/SiteLayout";

function Router() {
  return (
    <SiteLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/about" component={About} />
        <Route path="/contact" component={Contact} />
        <Route path="/guest-post" component={GuestPostForm} />
        <Route path="/profile/:userId" component={UserProfile} />
        <Route path="/category/:category" component={CategoryPage} />
        <Route path="/article/:slug" component={ArticlePage} />
        <Route path="/admin" component={AdminPage} />
        <Route path="/admin/new" component={AdminArticleForm} />
        <Route path="/admin/edit/:id" component={AdminArticleForm} />
        <Route path="/admin/settings" component={AdminSettings} />
        <Route path="/admin/guest-posts" component={AdminGuestPosts} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </SiteLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster position="top-center" richColors />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
