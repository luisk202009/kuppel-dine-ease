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

  // Mostrar wizard si el usuario necesita completar la configuración inicial
  if (authState.needsInitialSetup) {
    return <SetupWizard />;
  }

  return <Settings />;
};
