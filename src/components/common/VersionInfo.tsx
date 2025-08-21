import React from 'react';
import { Badge } from '@/components/ui/badge';

export const VersionInfo: React.FC = () => {
  const version = '1.0.0';
  const buildDate = new Date().toLocaleDateString('es-CO');

  return (
    <div className="fixed bottom-4 left-4 z-10">
      <Badge variant="secondary" className="text-xs font-mono">
        v{version} - {buildDate}
      </Badge>
    </div>
  );
};

export default VersionInfo;