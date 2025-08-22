import React, { useState } from 'react';
import { Plus, Search, Filter, Receipt, Calendar, DollarSign, Paperclip, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useExpenses, useCreateExpense } from '@/hooks/useExpenses';
import { usePOSContext } from '@/contexts/POSContext';

interface Expense {
  id: string;
  date: Date;
  category: string;
  description: string;
  amount: number;
  receipt?: string;
  vendor?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdBy: string;
}

const EXPENSE_CATEGORIES = [
  'Inventario',
  'Servicios Públicos',
  'Marketing',
  'Mantenimiento',
  'Suministros',
  'Transporte',
  'Otros'
];

export const ExpenseManager: React.FC = () => {
  const { toast } = useToast();
  const { authState } = usePOSContext();
  const { data: expenses = [], isLoading } = useExpenses();
  const createExpense = useCreateExpense();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [newExpense, setNewExpense] = useState({
    category: '',
    description: '',
    amount: '',
    vendor: '',
    receipt: null as File | null
  });

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || expense.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  const handleAddExpense = async () => {
    if (!newExpense.category || !newExpense.description || !newExpense.amount) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive"
      });
      return;
    }

    try {
      // Create FormData if there's a file attachment, otherwise use regular object
      let expenseData: FormData | any;
      
      if (newExpense.receipt) {
        expenseData = new FormData();
        expenseData.append('category', newExpense.category);
        expenseData.append('description', newExpense.description);
        expenseData.append('amount', newExpense.amount);
        expenseData.append('branchId', authState.selectedBranch?.id || '');
        if (newExpense.vendor) {
          expenseData.append('vendor', newExpense.vendor);
        }
        expenseData.append('attachments', newExpense.receipt);
      } else {
        expenseData = {
          category: newExpense.category,
          description: newExpense.description,
          amount: parseFloat(newExpense.amount),
          branchId: authState.selectedBranch?.id || '',
          vendor: newExpense.vendor || undefined
        };
      }

      await createExpense.mutateAsync(expenseData);
      
      setNewExpense({ category: '', description: '', amount: '', vendor: '', receipt: null });
      setIsAddingExpense(false);

      toast({
        title: "Gasto Registrado",
        description: "El gasto ha sido registrado exitosamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo registrar el gasto. Intenta nuevamente.",
        variant: "destructive"
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pendiente', variant: 'secondary' as const },
      approved: { label: 'Aprobado', variant: 'default' as const },
      rejected: { label: 'Rechazado', variant: 'destructive' as const }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Gastos</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(totalExpenses)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Receipt className="h-8 w-8 text-accent" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Registros</p>
                <p className="text-2xl font-bold text-foreground">{filteredExpenses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-8 w-8 text-secondary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Este Mes</p>
                <p className="text-2xl font-bold text-foreground">
                  {expenses.filter(e => new Date(e.createdAt).getMonth() === new Date().getMonth()).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar gastos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {EXPENSE_CATEGORIES.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isAddingExpense} onOpenChange={setIsAddingExpense}>
          <DialogTrigger asChild>
            <Button className="btn-kuppel-primary">
              <Plus className="h-4 w-4 mr-2" />
              Registrar Gasto
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Registrar Nuevo Gasto</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Categoría *</label>
                <Select value={newExpense.category} onValueChange={(value) => setNewExpense(prev => ({...prev, category: value}))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Descripción *</label>
                <Textarea
                  placeholder="Descripción del gasto"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense(prev => ({...prev, description: e.target.value}))}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Monto *</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense(prev => ({...prev, amount: e.target.value}))}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Proveedor</label>
                <Input
                  placeholder="Nombre del proveedor"
                  value={newExpense.vendor}
                  onChange={(e) => setNewExpense(prev => ({...prev, vendor: e.target.value}))}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Adjuntar Recibo</label>
                <Input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setNewExpense(prev => ({...prev, receipt: e.target.files?.[0] || null}))}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleAddExpense} className="btn-kuppel-primary flex-1">
                  Registrar Gasto
                </Button>
                <Button variant="outline" onClick={() => setIsAddingExpense(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Expenses List */}
      <div className="space-y-4">
        {filteredExpenses.map((expense) => (
          <Card key={expense.id} className="pos-card">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-foreground">{expense.description}</h3>
                    <Badge variant="secondary">Registrado</Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium">Categoría:</span>
                      <p>{expense.category}</p>
                    </div>
                    <div>
                      <span className="font-medium">Fecha:</span>
                      <p>{new Date(expense.createdAt).toLocaleDateString('es-CO')}</p>
                    </div>
                    <div>
                      <span className="font-medium">Monto:</span>
                      <p className="text-lg font-bold text-foreground">{formatCurrency(expense.amount)}</p>
                    </div>
                  </div>

                  {expense.attachments && expense.attachments.length > 0 && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-primary">
                      <Paperclip className="h-4 w-4" />
                      <span>{expense.attachments.length} archivo(s) adjunto(s)</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredExpenses.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No hay gastos registrados</h3>
              <p className="text-muted-foreground">Comienza registrando tu primer gasto</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ExpenseManager;