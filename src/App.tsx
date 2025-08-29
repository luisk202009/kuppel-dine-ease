import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { POSProvider, usePOS } from "@/contexts/POSContext";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { LoginScreen } from "@/components/auth/LoginScreen";
import { Dashboard } from "@/components/pos/Dashboard";
import { LoadingScreen } from "@/components/common/LoadingScreen";
import { isAuthRequired } from "@/config/environment";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const POSApp = () => {
  const { authState } = usePOS();
  const [showLoading, setShowLoading] = useState(true);

  useEffect(() => {
    // Show loading screen for 2 seconds on initial load
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
    return <LoginScreen />;
  }

  return <Dashboard />;
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange={false}
      >
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <POSProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<POSApp />} />
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