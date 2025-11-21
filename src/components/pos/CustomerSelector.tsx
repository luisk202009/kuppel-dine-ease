import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { User, Check, Plus, X } from 'lucide-react';
import { Customer } from '@/types/pos';
import { cn } from '@/lib/utils';
import { QuickCustomerForm } from './QuickCustomerForm';

interface CustomerSelectorProps {
  customers: Customer[];
  selectedCustomer: Customer | null;
  onSelect: (customer: Customer | null) => void;
  onAddCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => Promise<void>;
}

export const CustomerSelector: React.FC<CustomerSelectorProps> = ({
  customers,
  selectedCustomer,
  onSelect,
  onAddCustomer
}) => {
  const [open, setOpen] = useState(false);
  const [showQuickForm, setShowQuickForm] = useState(false);

  const handleAddCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt'>) => {
    await onAddCustomer(customerData);
    setShowQuickForm(false);
  };

  return (
    <div className="space-y-2">
      <Label>Cliente (Opcional)</Label>
      
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="flex-1 justify-between"
            >
              {selectedCustomer ? (
                <span className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {selectedCustomer.name} {selectedCustomer.lastName}
                </span>
              ) : (
                <span className="text-muted-foreground">Seleccionar cliente...</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Buscar por nombre, ID o teléfono..." />
              <CommandList>
                <CommandEmpty>
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-2">No se encontró el cliente</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setShowQuickForm(true);
                        setOpen(false);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar cliente
                    </Button>
                  </div>
                </CommandEmpty>
                <CommandGroup>
                  {selectedCustomer && (
                    <CommandItem
                      onSelect={() => {
                        onSelect(null);
                        setOpen(false);
                      }}
                      className="text-muted-foreground"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Sin cliente
                    </CommandItem>
                  )}
                  {customers.map((customer) => (
                    <CommandItem
                      key={customer.id}
                      value={`${customer.name} ${customer.lastName} ${customer.identification} ${customer.phone}`}
                      onSelect={() => {
                        onSelect(customer);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedCustomer?.id === customer.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex-1">
                        <div className="font-medium">
                          {customer.name} {customer.lastName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {customer.identification && `ID: ${customer.identification}`}
                          {customer.phone && ` • ${customer.phone}`}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowQuickForm(true)}
          title="Agregar cliente rápido"
        >
          <Plus className="h-4 w-4" />
        </Button>

        {selectedCustomer && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onSelect(null)}
            title="Quitar cliente"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {selectedCustomer && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <User className="h-4 w-4 mt-0.5 text-primary" />
            <div className="flex-1 text-sm">
              <p className="font-medium text-primary">
                {selectedCustomer.name} {selectedCustomer.lastName}
              </p>
              {selectedCustomer.identification && (
                <p className="text-muted-foreground">ID: {selectedCustomer.identification}</p>
              )}
              {selectedCustomer.phone && (
                <p className="text-muted-foreground">Tel: {selectedCustomer.phone}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Customer Form */}
      <QuickCustomerForm
        isOpen={showQuickForm}
        onClose={() => setShowQuickForm(false)}
        onSubmit={handleAddCustomer}
      />
    </div>
  );
};
