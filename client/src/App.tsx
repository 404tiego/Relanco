import * as React from "react";
import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/layout/AppLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import AuthPage from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import AdminPage from "@/pages/Admin";
import Settings from "@/pages/Settings";
import Billing from "@/pages/Billing";
import Prompts from "@/pages/Prompts";
import Leads from "@/pages/Leads";
import Clients from "@/pages/Clients";
import Relances from "@/pages/Relances";
import Rapports from "@/pages/Rapports";
import MentionsLegales from "@/pages/MentionsLegales";
import CGU from "@/pages/CGU";
import Confidentialite from "@/pages/Confidentialite";
import { Loader2 } from "lucide-react";
import { AUTH_CONFIG } from "@/config/auth";

// Protected Route Wrapper
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();

  React.useEffect(() => {
    if (!isLoading && !user) {
      window.location.href = AUTH_CONFIG.LOGIN_PATH;
    }
  }, [user, isLoading]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <AppLayout>
      <ErrorBoundary>
        <Component />
      </ErrorBoundary>
    </AppLayout>
  );
}

function Router() {
  const { user } = useAuth();
  const [location] = useLocation();

  React.useEffect(() => {
    const titleByPath: Record<string, string> = {
      "/": "Accueil",
      "/login": "Connexion",
      "/register": "Inscription",
      "/app": "App",
      "/settings": "Paramètres",
      "/billing": "Facturation",
      "/prompts": "Prompt Builder",
      "/admin": "Aperçu Admin",
      "/admin/users": "Gestion Utilisateurs",
      "/mentions-legales": "Mentions légales",
      "/cgu": "CGU",
      "/confidentialite": "Confidentialité",
    };

    const dynamicTitle = location.startsWith("/admin/users/") ? "Détail Utilisateur" : undefined;
    const pageTitle = dynamicTitle ?? titleByPath[location] ?? "Relanco";

    document.title = `${pageTitle} | Relanco`;
  }, [location]);

  return (
    <Switch>
      {/* Public Routes */}
      <Route path={AUTH_CONFIG.LANDING_PATH} component={Landing} />
      <Route path="/mentions-legales" component={MentionsLegales} />
      <Route path="/cgu" component={CGU} />
      <Route path="/confidentialite" component={Confidentialite} />
      
      <Route path={AUTH_CONFIG.LOGIN_PATH}>
        {user ? <Redirect to={AUTH_CONFIG.REDIRECT_PATH} /> : <AuthPage />}
      </Route>
      <Route path={AUTH_CONFIG.REGISTER_PATH}>
        {user ? <Redirect to={AUTH_CONFIG.REDIRECT_PATH} /> : <AuthPage />}
      </Route>

      {/* Redirects */}
      <Route path="/dashboard">
        <Redirect to={AUTH_CONFIG.REDIRECT_PATH} />
      </Route>

      {/* Protected Routes */}
      <Route path="/app">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/app/leads">
        <ProtectedRoute component={Leads} />
      </Route>
      <Route path="/app/clients">
        <ProtectedRoute component={Clients} />
      </Route>
      <Route path="/app/relances">
        <ProtectedRoute component={Relances} />
      </Route>
      <Route path="/app/rapports">
        <ProtectedRoute component={Rapports} />
      </Route>

      <Route path="/app/settings">
        <ProtectedRoute component={Settings} />
      </Route>
      <Route path="/settings">
        <ProtectedRoute component={Settings} />
      </Route>

      <Route path="/billing">
        <ProtectedRoute component={Billing} />
      </Route>

      <Route path="/prompts">
        <ProtectedRoute component={Prompts} />
      </Route>

      {/* Admin Route */}
      <Route path="/admin">
        <ProtectedRoute component={AdminPage} />
      </Route>
      <Route path="/admin/users">
        <ProtectedRoute component={AdminPage} />
      </Route>
      <Route path="/admin/users/:id">
        <ProtectedRoute component={AdminPage} />
      </Route>
      
      {/* Fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
