import { Suspense } from "react";
import { Switch } from "wouter";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import SiteLayout from "./components/SiteLayout";
import { ScrollToTop } from "./components/ScrollToTop";
import { DashboardLayoutSkeleton } from "./components/DashboardLayoutSkeleton";
import { Route } from "wouter";
import { publicRoutes } from "./routes/public";
import { adminRoutes } from "./routes/admin";
import NotFound from "./pages/NotFound";

function Router() {
  return (
    <SiteLayout>
      <ScrollToTop />
      <Suspense fallback={<DashboardLayoutSkeleton />}>
        <Switch>
          {publicRoutes}
          {adminRoutes}
          <Route component={NotFound} />
        </Switch>
      </Suspense>
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