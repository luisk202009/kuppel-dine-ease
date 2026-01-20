import React from 'react';
import { FileSearch } from 'lucide-react';

interface EmptyStateProps {
  message?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  message = "No hay movimientos en este periodo" 
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
      <FileSearch className="h-12 w-12 mb-4 stroke-1" />
      <p className="text-sm">{message}</p>
    </div>
  );
};
