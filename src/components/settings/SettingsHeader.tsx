import React from 'react';
import { Home, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { usePOS } from '@/contexts/POSContext';

interface SettingsHeaderProps {
  onBackToPOS?: () => void;
}

export const SettingsHeader: React.FC<SettingsHeaderProps> = ({ onBackToPOS }) => {
  const { logout } = usePOS();

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Logo width={120} height={40} />
          <div className="flex items-center gap-2 text-muted-foreground">
            <Settings className="h-5 w-5" />
            <span className="font-medium">Configuración</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {onBackToPOS && (
            <Button variant="outline" onClick={onBackToPOS}>
              <Home className="h-4 w-4 mr-2" />
              Volver al POS
            </Button>
          )}
          <Button variant="outline" onClick={logout}>
            <LogOut className="h-4 w-4 mr-2" />
            Salir
          </Button>
        </div>
      </div>
    </header>
  );
};
