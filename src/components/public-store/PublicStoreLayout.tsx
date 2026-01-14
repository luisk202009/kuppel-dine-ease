import React from 'react';
import { Outlet } from 'react-router-dom';
import { PublicStoreProvider, usePublicStore } from '@/contexts/PublicStoreContext';
import { Store, MessageCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PublicStoreHeader: React.FC = () => {
  const { company } = usePublicStore();

  if (!company) return null;

  const handleWhatsAppClick = () => {
    if (company.whatsapp_number) {
      const cleanNumber = company.whatsapp_number.replace(/\D/g, '');
      window.open(`https://wa.me/${cleanNumber}`, '_blank');
    }
  };

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Store className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">{company.name}</h1>
              {company.address && (
                <p className="text-xs text-muted-foreground">{company.address}</p>
              )}
            </div>
          </div>

          {company.whatsapp_number && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleWhatsAppClick}
              className="gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

const PublicStoreNotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
          <Store className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Tienda no encontrada</h1>
        <p className="text-muted-foreground max-w-md">
          La tienda que buscas no existe o no está disponible en este momento.
        </p>
      </div>
    </div>
  );
};

const PublicStoreDisabled: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
          <Store className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Tienda no disponible</h1>
        <p className="text-muted-foreground max-w-md">
          Esta tienda está temporalmente fuera de servicio. Por favor, intenta más tarde.
        </p>
      </div>
    </div>
  );
};

const PublicStoreLoading: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground">Cargando tienda...</p>
      </div>
    </div>
  );
};

const PublicStoreContent: React.FC = () => {
  const { isLoading, error, company } = usePublicStore();

  if (isLoading) {
    return <PublicStoreLoading />;
  }

  if (error === 'not_found') {
    return <PublicStoreNotFound />;
  }

  if (error === 'disabled') {
    return <PublicStoreDisabled />;
  }

  if (!company) {
    return <PublicStoreNotFound />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicStoreHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="bg-card border-t border-border py-4">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Tienda de {company.name}</p>
        </div>
      </footer>
    </div>
  );
};

export const PublicStoreLayout: React.FC = () => {
  return (
    <PublicStoreProvider>
      <PublicStoreContent />
    </PublicStoreProvider>
  );
};
