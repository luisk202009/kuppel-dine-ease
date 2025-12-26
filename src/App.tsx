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

const queryClient = new QueryClient();

const MainApp = () => {
  const { authState } = usePOS();
  const [showLoading, setShowLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (showLoading) {
    return <LoadingScreen message="Cargando Sistema Kuppel..." />;
  }

  if (authState.isLoading) {
    return <LoadingScreen message="Verificando credenciales..." />;
  }

  if (isAuthRequired() && !authState.isAuthenticated) {
    return <AuthScreen />;
  }

  // Mostrar wizard si:
  // 1. needsInitialSetup es true, O
  // 2. Usuario autenticado pero sin empresas asociadas
  const needsWizard = authState.needsInitialSetup || 
                      (authState.isAuthenticated && authState.companies.length === 0);
  
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