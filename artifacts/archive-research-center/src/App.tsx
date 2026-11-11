import { ConciergeProfileProvider } from "@/store/concierge-profile";
import { AppLayout } from "@/components/layout/app-layout";
import { HomePage } from "@/pages/home";
import { Route, Switch, useLocation } from "wouter";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import NotFound from "@/pages/not-found";
// Placeholders for other pages
import { ArchivePage } from "@/pages/archive";
import { SourceDetailPage } from "@/pages/source-detail";
import { CollectionsPage } from "@/pages/collections";
import { CollectionDetailPage } from "@/pages/collection-detail";
import { ProjectsPage } from "@/pages/projects";
import { ProjectDetailPage } from "@/pages/project-detail";
import { ClaimCardsPage } from "@/pages/claim-cards";
import { ClaimCardDetailPage } from "@/pages/claim-card-detail";
import { ConciergePage } from "@/pages/concierge";
import { CommonsPage } from "@/pages/commons";
import { ThreadDetailPage } from "@/pages/thread-detail";
import { TranslationPage } from "@/pages/translation";
import { TranslationWorkspacePage } from "@/pages/translation-workspace";
import { AccountPage } from "@/pages/account";
import { MembershipPage } from "@/pages/membership";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <AppLayout>
      <RoutedErrorBoundary>
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/archive" component={ArchivePage} />
          <Route path="/sources/:id" component={SourceDetailPage} />
          <Route path="/collections" component={CollectionsPage} />
          <Route path="/collections/:slug" component={CollectionDetailPage} />
          <Route path="/projects" component={ProjectsPage} />
          <Route path="/projects/:id" component={ProjectDetailPage} />
          <Route path="/claim-cards" component={ClaimCardsPage} />
          <Route path="/claim-cards/:id" component={ClaimCardDetailPage} />
          <Route path="/concierge" component={ConciergePage} />
          <Route path="/commons" component={CommonsPage} />
          <Route path="/commons/:id" component={ThreadDetailPage} />
          <Route path="/translation" component={TranslationPage} />
          <Route path="/translation/:sourceId" component={TranslationWorkspacePage} />
          <Route path="/account" component={AccountPage} />
          <Route path="/membership" component={MembershipPage} />
          <Route component={NotFound} />
        </Switch>
      </RoutedErrorBoundary>
    </AppLayout>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConciergeProfileProvider>
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </ConciergeProfileProvider>
    </QueryClientProvider>
  );
}

export default App;
