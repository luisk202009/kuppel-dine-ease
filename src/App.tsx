import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { POSProvider, usePOS } from "@/contexts/POSContext";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import AuthScreen from "@/components/auth/AuthScreen";
import { LoadingScreen } from "@/components/common/LoadingScreen";
import { isAuthRequired } from "@/config/environment";
import { SettingsPage } from "./pages/SettingsPage";
import { POSPage } from "./pages/POSPage";
import { Admin } from "./pages/Admin";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { SetupWizard } from "@/components/onboarding/SetupWizard";
import { supabase } from "@/integrations/supabase/client";
import { PublicStoreLayout } from "@/components/public-store/PublicStoreLayout";
import { PublicStorePage } from "@/pages/PublicStorePage";

const queryClient = new QueryClient();

const MainApp = () => {
  const { authState } = usePOS();
  const [showLoading, setShowLoading] = useState(true);
  const [directCheckComplete, setDirectCheckComplete] = useState(false);
  const [forceWizard, setForceWizard] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Verificación directa de user_companies cuando el usuario está autenticado
  useEffect(() => {
    const checkUserCompanies = async () => {
      if (!authState.isAuthenticated || !authState.user?.id) {
        setDirectCheckComplete(true);
        return;
      }

      console.log('[App] Direct check - User ID:', authState.user.id);
      console.log('[App] Auth state:', {
        isAuthenticated: authState.isAuthenticated,
        needsInitialSetup: authState.needsInitialSetup,
        companiesFromContext: authState.companies.length,
        userId: authState.user?.id
      });

      try {
        // Consulta directa a user_companies
        const { data: userCompanies, error } = await supabase
          .from('user_companies')
          .select('id, company_id')
          .eq('user_id', authState.user.id);

        if (error) {
          console.error('[App] Error checking user_companies:', error);
          setDirectCheckComplete(true);
          return;
        }

        console.log('[App] Direct user_companies query result:', userCompanies);

        // Si no tiene empresas asociadas, forzar el wizard
        if (!userCompanies || userCompanies.length === 0) {
          console.log('[App] No companies found - forcing wizard');
          setForceWizard(true);
        } else {
          console.log('[App] User has companies:', userCompanies.length);
          
          // Verificar también setup_completed
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('setup_completed')
            .eq('id', authState.user.id)
            .maybeSingle();

          if (userError) {
            console.error('[App] Error checking user setup_completed:', userError);
          } else {
            console.log('[App] User setup_completed:', userData?.setup_completed);
            if (userData?.setup_completed === false) {
              console.log('[App] setup_completed is false - forcing wizard');
              setForceWizard(true);
            }
          }
        }
      } catch (err) {
        console.error('[App] Unexpected error in direct check:', err);
      } finally {
        setDirectCheckComplete(true);
      }
    };

    if (!authState.isLoading && authState.isAuthenticated) {
      checkUserCompanies();
    } else if (!authState.isLoading && !authState.isAuthenticated) {
      setDirectCheckComplete(true);
    }
  }, [authState.isAuthenticated, authState.isLoading, authState.user?.id]);

  if (showLoading) {
    return <LoadingScreen message="Cargando Sistema Kuppel..." />;
  }

  if (authState.isLoading || !directCheckComplete) {
    return <LoadingScreen message="Verificando credenciales..." />;
  }

  if (isAuthRequired() && !authState.isAuthenticated) {
    return <AuthScreen />;
  }

  // Mostrar wizard si:
  // 1. needsInitialSetup es true desde el contexto, O
  // 2. Usuario autenticado pero sin empresas (desde contexto), O
  // 3. forceWizard es true (desde la verificación directa)
  const needsWizard = authState.needsInitialSetup || 
                      (authState.isAuthenticated && authState.companies.length === 0) ||
                      forceWizard;
  
  console.log('[App] Render decision:', {
    needsInitialSetup: authState.needsInitialSetup,
    companiesLength: authState.companies.length,
    forceWizard,
    needsWizard
  });

  if (needsWizard) {
    return <SetupWizard />;
  }

  // Redirigir a Settings como pantalla principal
  return <SettingsPage />;
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem={true}
        disableTransitionOnChange={false}
      >
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <POSProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<MainApp />} />
                <Route path="/pos" element={<POSPage />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/demo" element={<Index />} />
                {/* Public Store Route */}
                <Route path="/s/:slug" element={<PublicStoreLayout />}>
                  <Route index element={<PublicStorePage />} />
                </Route>
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </POSProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
