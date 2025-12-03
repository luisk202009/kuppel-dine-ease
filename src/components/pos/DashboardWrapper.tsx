import React from 'react';
import { Navigate } from 'react-router-dom';
import { Dashboard } from './Dashboard';
import { SetupWizard } from '../onboarding/SetupWizard';
import { usePOS } from '@/contexts/POSContext';

export const DashboardWrapper: React.FC = () => {
  const { authState } = usePOS();

  // Si POS está deshabilitado, redirigir a suscripciones
  if (authState.enabledModules?.pos === false) {
    return <Navigate to="/settings?section=subscriptions" replace />;
  }

  // Decidir qué mostrar ANTES de ejecutar otros hooks
  if (authState.needsInitialSetup) {
    return <SetupWizard />;
  }

  return <Dashboard />;
};
