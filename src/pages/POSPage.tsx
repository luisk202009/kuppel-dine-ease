import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePOS } from '@/contexts/POSContext';
import { Dashboard } from '@/components/pos/Dashboard';
import { SetupWizard } from '@/components/onboarding/SetupWizard';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { isAuthRequired } from '@/config/environment';
import AuthScreen from '@/components/auth/AuthScreen';

export const POSPage: React.FC = () => {
  const { authState } = usePOS();

  if (authState.isLoading) {
    return <LoadingScreen message="Cargando POS..." />;
  }

  if (isAuthRequired() && !authState.isAuthenticated) {
    return <AuthScreen />;
  }

  // Si POS está deshabilitado, redirigir a configuración
  if (authState.enabledModules?.pos === false) {
    return <Navigate to="/" replace />;
  }

  // Si necesita configuración inicial, mostrar wizard
  if (authState.needsInitialSetup) {
    return <SetupWizard />;
  }

  return <Dashboard />;
};
