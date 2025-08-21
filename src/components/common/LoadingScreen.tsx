import React from 'react';
import { Logo } from '@/components/ui/logo';

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = "Cargando Configuraciones..." 
}) => {
  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-50">
      <div className="flex flex-col items-center space-y-8">
        {/* Logo */}
        <div className="animate-pulse">
          <Logo width={200} height={80} />
        </div>
        
        {/* Loading Animation */}
        <div className="flex flex-col items-center space-y-4">
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-primary rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          
          {/* Loading Message */}
          <p className="text-lg font-medium text-muted-foreground animate-pulse">
            {message}
          </p>
        </div>
        
        {/* Progress Bar */}
        <div className="w-64 h-2 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-gradient-primary rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;