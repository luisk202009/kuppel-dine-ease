import React from 'react';
import { Dashboard } from './Dashboard';
import { SetupWizard } from '../onboarding/SetupWizard';
import { usePOS } from '@/contexts/POSContext';

export const DashboardWrapper: React.FC = () => {
  const { authState } = usePOS();

  // Decidir qué mostrar ANTES de ejecutar otros hooks
  if (authState.needsInitialSetup) {
    return <SetupWizard />;
  }

  return <Dashboard />;
};
