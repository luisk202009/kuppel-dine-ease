import React, { useState } from 'react';
import { DollarSign, Clock, TrendingUp, Calculator, CheckCircle, XCircle, Calendar, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface CashSession {
  id: string;
  date: Date;
  openedBy: string;
  closedBy?: string;
  openTime: Date;
  closeTime?: Date;
  initialAmount: number;
  finalAmount?: number;
  totalSales: number;
  totalExpenses: number;
  expectedAmount: number;
  difference?: number;
  status: 'open' | 'closed';
  notes?: string;
}

interface CashMovement {
  id: string;
  type: 'sale' | 'expense' | 'adjustment';
  amount: number;
  description: string;
  timestamp: Date;
  reference?: string;
}

export const CashManager: React.FC = () => {
  const { toast } = useToast();
  const [currentSession, setCurrentSession] = useState<CashSession | null>({
    id: '1',
    date: new Date(),
    openedBy: 'admin',
    openTime: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    initialAmount: 100000,
    totalSales: 850000,
    totalExpenses: 45000,
    expectedAmount: 905000,
    status: 'open'
  });

  const [cashSessions] = useState<CashSession[]>([
    {
      id: '2',
      date: new Date(Date.now() - 86400000),
      openedBy: 'admin',
      closedBy: 'admin',
      openTime: new Date(Date.now() - 86400000),
      closeTime: new Date(Date.now() - 86400000 + 8 * 60 * 60 * 1000),
      initialAmount: 100000,
      finalAmount: 750000,
      totalSales: 680000,
      totalExpenses: 30000,
      expectedAmount: 750000,
      difference: 0,
      status: 'closed',
      notes: 'Jornada normal, sin novedades'
    }
  ]);

  const [movements] = useState<CashMovement[]>([
    {
      id: '1',
      type: 'sale',
      amount: 25000,
      description: 'Venta Mesa 5',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      reference: 'INV-001'
    },
    {
      id: '2',
      type: 'expense',
      amount: -5000,
      description: 'Compra suministros',
      timestamp: new Date(Date.now() - 60 * 60 * 1000),
      reference: 'EXP-001'
    }
  ]);

  const [isOpeningCash, setIsOpeningCash] = useState(false);
  const [isClosingCash, setIsClosingCash] = useState(false);
  const [openAmount, setOpenAmount] = useState('100000');
  const [closeAmount, setCloseAmount] = useState('');
  const [closeNotes, setCloseNotes] = useState('');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleOpenCash = async () => {
    const newSession: CashSession = {
      id: Date.now().toString(),
      date: new Date(),
      openedBy: 'admin',
      openTime: new Date(),
      initialAmount: parseFloat(openAmount),
      totalSales: 0,
      totalExpenses: 0,
      expectedAmount: parseFloat(openAmount),
      status: 'open'
    };

    setCurrentSession(newSession);
    setIsOpeningCash(false);
    setOpenAmount('100000');

    toast({
      title: "Caja Abierta",
      description: `Caja abierta con ${formatCurrency(parseFloat(openAmount))}`,
    });
  };

  const handleCloseCash = async () => {
    if (!currentSession || !closeAmount) return;

    const finalAmount = parseFloat(closeAmount);
    const difference = finalAmount - currentSession.expectedAmount;

    const closedSession: CashSession = {
      ...currentSession,
      closedBy: 'admin',
      closeTime: new Date(),
      finalAmount,
      difference,
      status: 'closed',
      notes: closeNotes
    };

    setCurrentSession(null);
    setIsClosingCash(false);
    setCloseAmount('');
    setCloseNotes('');

    toast({
      title: "Caja Cerrada",
      description: difference === 0 
        ? "Cierre cuadrado exitoso" 
        : `Diferencia: ${formatCurrency(Math.abs(difference))} ${difference > 0 ? 'sobrante' : 'faltante'}`,
      variant: difference === 0 ? "default" : "destructive"
    });
  };

  const getDifferenceColor = (difference: number) => {
    if (difference === 0) return 'text-green-600';
    return difference > 0 ? 'text-blue-600' : 'text-red-600';
  };

  const getSessionDuration = (session: CashSession) => {
    const end = session.closeTime || new Date();
    const duration = end.getTime() - session.openTime.getTime();
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="current" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="current">Sesión Actual</TabsTrigger>
          <TabsTrigger value="movements">Movimientos</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-6">
          {/* Current Status */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="pos-card">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Clock className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Estado</p>
                    <Badge variant={currentSession ? "default" : "secondary"}>
                      {currentSession ? 'Abierta' : 'Cerrada'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="pos-card">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-8 w-8 text-accent" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Inicial</p>
                    <p className="text-2xl font-bold text-foreground">
                      {formatCurrency(currentSession?.initialAmount || 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="pos-card">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-8 w-8 text-success" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Ventas</p>
                    <p className="text-2xl font-bold text-foreground">
                      {formatCurrency(currentSession?.totalSales || 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="pos-card">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Calculator className="h-8 w-8 text-secondary" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Esperado</p>
                    <p className="text-2xl font-bold text-foreground">
                      {formatCurrency(currentSession?.expectedAmount || 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Current Session Details */}
          {currentSession && (
            <Card className="pos-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  Sesión Actual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">Abierta por:</span>
                    <p className="font-semibold">{currentSession.openedBy}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Hora apertura:</span>
                    <p className="font-semibold">{currentSession.openTime.toLocaleTimeString('es-CO')}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Duración:</span>
                    <p className="font-semibold">{getSessionDuration(currentSession)}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Gastos:</span>
                    <p className="font-semibold text-destructive">
                      {formatCurrency(currentSession.totalExpenses)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            {!currentSession ? (
              <Dialog open={isOpeningCash} onOpenChange={setIsOpeningCash}>
                <DialogTrigger asChild>
                  <Button className="btn-kuppel-primary">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Abrir Caja
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Abrir Caja</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Monto Inicial</label>
                      <Input
                        type="number"
                        placeholder="100000"
                        value={openAmount}
                        onChange={(e) => setOpenAmount(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button onClick={handleOpenCash} className="btn-kuppel-primary flex-1">
                        Abrir Caja
                      </Button>
                      <Button variant="outline" onClick={() => setIsOpeningCash(false)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            ) : (
              <Dialog open={isClosingCash} onOpenChange={setIsClosingCash}>
                <DialogTrigger asChild>
                  <Button className="btn-kuppel-secondary">
                    <XCircle className="h-4 w-4 mr-2" />
                    Cerrar Caja
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Cerrar Caja</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Monto esperado:</p>
                      <p className="text-2xl font-bold">{formatCurrency(currentSession.expectedAmount)}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Monto Real en Caja</label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={closeAmount}
                        onChange={(e) => setCloseAmount(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Observaciones</label>
                      <Textarea
                        placeholder="Notas del cierre de caja..."
                        value={closeNotes}
                        onChange={(e) => setCloseNotes(e.target.value)}
                      />
                    </div>

                    {closeAmount && (
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Diferencia:</p>
                        <p className={`text-xl font-bold ${getDifferenceColor(parseFloat(closeAmount) - currentSession.expectedAmount)}`}>
                          {formatCurrency(Math.abs(parseFloat(closeAmount) - currentSession.expectedAmount))}
                          {parseFloat(closeAmount) - currentSession.expectedAmount > 0 ? ' Sobrante' : 
                           parseFloat(closeAmount) - currentSession.expectedAmount < 0 ? ' Faltante' : ' Cuadrado'}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-4">
                      <Button onClick={handleCloseCash} className="btn-kuppel-secondary flex-1">
                        Cerrar Caja
                      </Button>
                      <Button variant="outline" onClick={() => setIsClosingCash(false)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </TabsContent>

        <TabsContent value="movements" className="space-y-4">
          <div className="space-y-4">
            {movements.map((movement) => (
              <Card key={movement.id} className="pos-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        movement.type === 'sale' ? 'bg-success' : 
                        movement.type === 'expense' ? 'bg-destructive' : 'bg-warning'
                      }`} />
                      <div>
                        <p className="font-medium">{movement.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {movement.timestamp.toLocaleTimeString('es-CO')} 
                          {movement.reference && ` - ${movement.reference}`}
                        </p>
                      </div>
                    </div>
                    <div className={`text-lg font-bold ${
                      movement.amount > 0 ? 'text-success' : 'text-destructive'
                    }`}>
                      {movement.amount > 0 ? '+' : ''}{formatCurrency(movement.amount)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="space-y-4">
            {cashSessions.map((session) => (
              <Card key={session.id} className="pos-card">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {session.date.toLocaleDateString('es-CO')}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {session.openTime.toLocaleTimeString('es-CO')} - {session.closeTime?.toLocaleTimeString('es-CO')}
                      </p>
                    </div>
                    <Badge variant={session.status === 'closed' ? 'default' : 'secondary'}>
                      {session.status === 'closed' ? 'Cerrada' : 'Abierta'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Inicial:</span>
                      <p className="font-semibold">{formatCurrency(session.initialAmount)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Ventas:</span>
                      <p className="font-semibold text-success">{formatCurrency(session.totalSales)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Gastos:</span>
                      <p className="font-semibold text-destructive">{formatCurrency(session.totalExpenses)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Final:</span>
                      <p className="font-semibold">{formatCurrency(session.finalAmount || 0)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Diferencia:</span>
                      <p className={`font-semibold ${getDifferenceColor(session.difference || 0)}`}>
                        {formatCurrency(Math.abs(session.difference || 0))}
                      </p>
                    </div>
                  </div>

                  {session.notes && (
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <p className="text-sm">{session.notes}</p>
                    </div>
                  )}

                  <div className="mt-4 text-xs text-muted-foreground">
                    Duración: {getSessionDuration(session)} • Operador: {session.openedBy}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CashManager;