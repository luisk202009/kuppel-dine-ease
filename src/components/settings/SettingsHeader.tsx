import React from 'react';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { usePOS } from '@/contexts/POSContext';

export const SettingsHeader: React.FC = () => {
  const { logout, authState } = usePOS();

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Logo width={120} height={40} />
          {authState.selectedCompany && (
            <div className="hidden md:flex items-center gap-2 text-muted-foreground">
              <span className="text-sm font-medium">{authState.selectedCompany.name}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button variant="outline" onClick={logout}>
            <LogOut className="h-4 w-4 mr-2" />
            Salir
          </Button>
        </div>
      </div>
    </header>
  );
};
