import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  ShoppingCart,
  Users,
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface SalesData {
  totalSales: number;
  totalOrders: number;
  avgOrderValue: number;
  topProducts: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
  hourlyData: Array<{
    hour: string;
    sales: number;
    orders: number;
  }>;
  paymentMethods: Array<{
    method: string;
    amount: number;
    percentage: number;
  }>;
}

export const SalesReports: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [isLoading, setIsLoading] = useState(false);

  // Mock data - in real app this would come from backend
  const mockSalesData: SalesData = {
    totalSales: 485600,
    totalOrders: 34,
    avgOrderValue: 14282,
    topProducts: [
      { name: 'Hamburguesa Clásica', quantity: 12, revenue: 180000 },
      { name: 'Café Americano', quantity: 25, revenue: 87500 },
      { name: 'Pizza Margherita', quantity: 8, revenue: 120000 },
      { name: 'Cerveza Nacional', quantity: 18, revenue: 72000 },
      { name: 'Ensalada César', quantity: 6, revenue: 72000 }
    ],
    hourlyData: [
      { hour: '09:00', sales: 45000, orders: 3 },
      { hour: '10:00', sales: 32000, orders: 2 },
      { hour: '11:00', sales: 58000, orders: 4 },
      { hour: '12:00', sales: 95000, orders: 7 },
      { hour: '13:00', sales: 120000, orders: 8 },
      { hour: '14:00', sales: 87000, orders: 6 },
      { hour: '15:00', sales: 48600, orders: 4 }
    ],
    paymentMethods: [
      { method: 'Efectivo', amount: 291360, percentage: 60 },
      { method: 'Tarjeta', amount: 194240, percentage: 40 }
    ]
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  const getPeriodText = () => {
    switch (selectedPeriod) {
      case 'today': return 'Hoy';
      case 'week': return 'Esta Semana';
      case 'month': return 'Este Mes';
      default: return 'Hoy';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Reportes de Ventas</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Period Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Período:</span>
            </div>
            <div className="flex gap-2">
              {[
                { key: 'today', label: 'Hoy' },
                { key: 'week', label: 'Semana' },
                { key: 'month', label: 'Mes' }
              ].map(({ key, label }) => (
                <Button
                  key={key}
                  variant={selectedPeriod === key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedPeriod(key as any)}
                >
                  {label}
                </Button>
              ))}
            </div>
            <Badge variant="outline" className="ml-auto">
              {format(new Date(), 'dd/MM/yyyy', { locale: es })}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="pos-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-success/10 p-3 rounded-lg">
                <DollarSign className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ventas Totales</p>
                <p className="text-2xl font-bold">${mockSalesData.totalSales.toLocaleString()}</p>
                <p className="text-xs text-success flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  +12% vs ayer
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="pos-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Órdenes Totales</p>
                <p className="text-2xl font-bold">{mockSalesData.totalOrders}</p>
                <p className="text-xs text-primary flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  +8% vs ayer
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="pos-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-warning/10 p-3 rounded-lg">
                <Users className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ticket Promedio</p>
                <p className="text-2xl font-bold">${mockSalesData.avgOrderValue.toLocaleString()}</p>
                <p className="text-xs text-warning flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  +3% vs ayer
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Reports */}
      <Tabs defaultValue="products" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="products">Productos Top</TabsTrigger>
          <TabsTrigger value="hourly">Ventas por Hora</TabsTrigger>
          <TabsTrigger value="payments">Métodos de Pago</TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Productos Más Vendidos - {getPeriodText()}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockSalesData.topProducts.map((product, index) => (
                  <div key={product.name} className="flex items-center justify-between p-3 rounded-lg bg-secondary/20">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center p-0">
                        {index + 1}
                      </Badge>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {product.quantity} unidades vendidas
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${product.revenue.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">
                        ${(product.revenue / product.quantity).toFixed(0)} c/u
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hourly">
          <Card>
            <CardHeader>
              <CardTitle>Ventas por Franja Horaria - {getPeriodText()}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockSalesData.hourlyData.map((data) => (
                  <div key={data.hour} className="flex items-center justify-between p-3 rounded-lg bg-secondary/20">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{data.hour}</Badge>
                      <div>
                        <p className="font-medium">${data.sales.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">
                          {data.orders} órdenes
                        </p>
                      </div>
                    </div>
                    <div className="w-32 bg-secondary rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full"
                        style={{ 
                          width: `${(data.sales / Math.max(...mockSalesData.hourlyData.map(d => d.sales))) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Métodos de Pago - {getPeriodText()}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockSalesData.paymentMethods.map((method) => (
                  <div key={method.method} className="flex items-center justify-between p-3 rounded-lg bg-secondary/20">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {method.method === 'Efectivo' ? (
                          <Badge className="bg-success text-success-foreground">
                            {method.method}
                          </Badge>
                        ) : (
                          <Badge className="bg-primary text-primary-foreground">
                            {method.method}
                          </Badge>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">${method.amount.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">
                          {method.percentage}% del total
                        </p>
                      </div>
                    </div>
                    <div className="w-32 bg-secondary rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${method.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};