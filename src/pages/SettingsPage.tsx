import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePOS } from '@/contexts/POSContext';
import { Settings } from './Settings';
import { LoadingScreen } from '@/components/common/LoadingScreen';

export const SettingsPage: React.FC = () => {
  const { authState } = usePOS();

  if (authState.isLoading) {
    return <LoadingScreen message="Cargando configuración..." />;
  }

  if (!authState.isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Settings />;
};
