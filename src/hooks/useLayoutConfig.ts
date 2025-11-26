import { useState, useEffect } from 'react';

export interface LayoutConfig {
  invertLayout: boolean;
  compactMode: boolean;
  touchOptimized: boolean;
  showTableNumbers: boolean;
  tablesEnabled: boolean;
  businessType?: string;
}

const defaultConfig: LayoutConfig = {
  invertLayout: false,
  compactMode: false,
  touchOptimized: true,
  showTableNumbers: true,
  tablesEnabled: true,
  businessType: undefined,
};

export const useLayoutConfig = () => {
  const [config, setConfig] = useState<LayoutConfig>(() => {
    const saved = localStorage.getItem('kuppel-layout-config');
    return saved ? { ...defaultConfig, ...JSON.parse(saved) } : defaultConfig;
  });

  useEffect(() => {
    localStorage.setItem('kuppel-layout-config', JSON.stringify(config));
  }, [config]);

  const updateConfig = (updates: Partial<LayoutConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  return { config, updateConfig };
};