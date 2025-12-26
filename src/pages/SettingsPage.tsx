import React from 'react';
import { usePOS } from '@/contexts/POSContext';
import { Settings } from './Settings';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { SetupWizard } from '@/components/onboarding/SetupWizard';

export const SettingsPage: React.FC = () => {
  const { authState } = usePOS();

  if (authState.isLoading) {
    return <LoadingScreen message="Cargando..." />;
  }

  // Verificación más robusta: wizard si needsInitialSetup O si no tiene empresas
  const needsWizard = authState.needsInitialSetup || 
                      (authState.isAuthenticated && authState.companies.length === 0);

  if (needsWizard) {
    return <SetupWizard />;
  }

  return <Settings />;
};
