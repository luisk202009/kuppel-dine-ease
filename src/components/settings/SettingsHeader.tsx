import React from 'react';
import { LogOut, User, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { usePOS } from '@/contexts/POSContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SettingsHeaderProps {
  onSectionChange?: (section: string) => void;
}

export const SettingsHeader: React.FC<SettingsHeaderProps> = ({ onSectionChange }) => {
  const { logout, authState } = usePOS();

  const getInitials = () => {
    if (authState.selectedCompany?.name) {
      return authState.selectedCompany.name.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  const handleProfileClick = () => {
    onSectionChange?.('settings');
  };

  const handleSubscriptionsClick = () => {
    onSectionChange?.('subscriptions');
  };

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Logo width={120} height={40} />
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src="" alt="Usuario" />
                  <AvatarFallback className="bg-muted text-muted-foreground text-sm font-medium">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {authState.selectedCompany?.name || 'Mi Cuenta'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {authState.user?.email || ''}
                  </p>
                </div>
              </DropdownMenuLabel>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={handleProfileClick} className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Mi Perfil</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={handleSubscriptionsClick} className="cursor-pointer">
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Suscripciones</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                onClick={logout} 
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
