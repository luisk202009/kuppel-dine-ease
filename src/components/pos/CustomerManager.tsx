import React, { useState } from 'react';
import { Search, Plus, Edit, Trash2, User, Mail, Phone, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePOS } from '@/contexts/POSContext';
import { Customer } from '@/types/pos';

export const CustomerManager: React.FC = () => {
  const { posState, addCustomer, searchCustomers } = usePOS();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    lastName: '',
    identification: '',
    phone: '',
    city: '',
    email: ''
  });

  const filteredCustomers = searchQuery.trim() 
    ? searchCustomers(searchQuery)
    : posState.customers;

  const handleAddCustomer = () => {
    if (!newCustomer.name || !newCustomer.identification) {
      return;
    }

    addCustomer(newCustomer);
    setNewCustomer({
      name: '',
      lastName: '',
      identification: '',
      phone: '',
      city: '',
      email: ''
    });
    setIsAddDialogOpen(false);
  };

  const handleClearForm = () => {
    setNewCustomer({
      name: '',
      lastName: '',
      identification: '',
      phone: '',
      city: '',
      email: ''
    });
  };

  const CustomerCard: React.FC<{ customer: Customer }> = ({ customer }) => (
    <Card className="pos-card-interactive">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-base">
                {customer.name} {customer.lastName}
              </h3>
              <p className="text-sm text-muted-foreground">
                ID: {customer.identification}
              </p>
            </div>
          </div>
          
          <div className="flex space-x-1">
            <Button size="sm" variant="ghost">
              <Edit className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="space-y-2">
          {customer.phone && (
            <div className="flex items-center space-x-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{customer.phone}</span>
            </div>
          )}
          
          {customer.email && (
            <div className="flex items-center space-x-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{customer.email}</span>
            </div>
          )}
          
          {customer.city && (
            <div className="flex items-center space-x-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{customer.city}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar clientes por nombre, ID, teléfono..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:opacity-90">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Cliente
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Cliente</DialogTitle>
              <DialogDescription>
                Ingresa la información del cliente. Los campos marcados con * son obligatorios.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Juan Carlos"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Apellidos</Label>
                  <Input
                    id="lastName"
                    value={newCustomer.lastName}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Pérez García"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="identification">Documento *</Label>
                <Input
                  id="identification"
                  value={newCustomer.identification}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, identification: e.target.value }))}
                  placeholder="1234567890"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+57 300 123 4567"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="city">Ciudad</Label>
                <Input
                  id="city"
                  value={newCustomer.city}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Bogotá"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="cliente@email.com"
                />
              </div>
              
              <div className="flex space-x-2 pt-4">
                <Button
                  onClick={handleAddCustomer}
                  disabled={!newCustomer.name || !newCustomer.identification}
                  className="flex-1"
                >
                  Guardar
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClearForm}
                >
                  Limpiar
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Results Summary */}
      {searchQuery.trim() && (
        <div className="text-sm text-muted-foreground">
          {filteredCustomers.length} resultado{filteredCustomers.length !== 1 ? 's' : ''} para "{searchQuery}"
        </div>
      )}

      {/* Customer List */}
      <ScrollArea className="h-[600px]">
        {filteredCustomers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCustomers.map((customer) => (
              <CustomerCard key={customer.id} customer={customer} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {searchQuery ? 'No se encontraron clientes' : 'No hay clientes registrados'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery 
                ? 'Intenta con otros términos de búsqueda'
                : 'Agrega tu primer cliente para comenzar'
              }
            </p>
            {!searchQuery && (
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Cliente
              </Button>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default CustomerManager;