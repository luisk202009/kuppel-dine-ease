import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { WifiOff, Wifi, CloudOff, CloudUpload } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { syncPendingData } from '@/lib/offlineSync';
import { useState, useEffect } from 'react';
import { getStorageStats } from '@/lib/offlineStorage';
import { useToast } from '@/hooks/use-toast';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export const OfflineIndicator = () => {
  const { isOnline, wasOffline } = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const updatePendingCount = async () => {
      const stats = await getStorageStats();
      setPendingCount(stats.pendingSync);
    };

    updatePendingCount();
    const interval = setInterval(updatePendingCount, 10000); // Update every 10s

    return () => clearInterval(interval);
  }, []);

  const handleManualSync = async () => {
    if (!isOnline) {
      toast({
        title: "Sin conexión",
        description: "No hay conexión a internet para sincronizar",
        variant: "destructive"
      });
      return;
    }

    setIsSyncing(true);
    try {
      const result = await syncPendingData();
      toast({
        title: "Sincronización completa",
        description: `${result.synced} elementos sincronizados${result.failed > 0 ? `, ${result.failed} fallidos` : ''}`,
      });
      setPendingCount(result.failed);
    } catch (error) {
      toast({
        title: "Error al sincronizar",
        description: "No se pudo completar la sincronización",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  if (isOnline && pendingCount === 0 && !wasOffline) {
    return null; // Don't show anything when online with no pending data
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Badge 
          variant={isOnline ? "secondary" : "destructive"} 
          className="cursor-pointer gap-1.5 transition-all hover:scale-105"
        >
          {isOnline ? (
            pendingCount > 0 ? (
              <>
                <CloudUpload className="h-3.5 w-3.5" />
                {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
              </>
            ) : (
              <>
                <Wifi className="h-3.5 w-3.5" />
                En línea
              </>
            )
          ) : (
            <>
              <WifiOff className="h-3.5 w-3.5" />
              Sin conexión
            </>
          )}
        </Badge>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <CloudOff className="h-5 w-5 text-destructive" />
            )}
            <div>
              <h4 className="font-semibold text-sm">
                {isOnline ? 'Modo en línea' : 'Modo offline'}
              </h4>
              <p className="text-xs text-muted-foreground">
                {isOnline 
                  ? 'Conectado a internet' 
                  : 'Los datos se guardarán localmente y se sincronizarán cuando vuelva la conexión'}
              </p>
            </div>
          </div>

          {pendingCount > 0 && (
            <div className="pt-2 border-t">
              <p className="text-sm mb-2">
                <span className="font-medium">{pendingCount}</span> elemento{pendingCount !== 1 ? 's' : ''} pendiente{pendingCount !== 1 ? 's' : ''} de sincronizar
              </p>
              <Button
                onClick={handleManualSync}
                disabled={!isOnline || isSyncing}
                size="sm"
                className="w-full"
              >
                {isSyncing ? (
                  <>
                    <CloudUpload className="mr-2 h-4 w-4 animate-pulse" />
                    Sincronizando...
                  </>
                ) : (
                  <>
                    <CloudUpload className="mr-2 h-4 w-4" />
                    Sincronizar ahora
                  </>
                )}
              </Button>
            </div>
          )}

          {!isOnline && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                💡 El sistema funciona offline. Todas las operaciones se guardarán y sincronizarán automáticamente cuando se restablezca la conexión.
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
