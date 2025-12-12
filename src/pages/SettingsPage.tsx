import React from 'react';
import { usePOS } from '@/contexts/POSContext';
import { Settings } from './Settings';
import { LoadingScreen } from '@/components/common/LoadingScreen';

export const SettingsPage: React.FC = () => {
  const { authState } = usePOS();

  if (authState.isLoading) {
    return <LoadingScreen message="Cargando..." />;
  }

  // La autenticación se maneja en App.tsx, aquí solo renderizamos Settings
  return <Settings />;
};
