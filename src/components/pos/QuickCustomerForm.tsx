import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Customer } from '@/types/pos';
import { UserPlus } from 'lucide-react';

const customerSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es requerido').max(100, 'Máximo 100 caracteres'),
  lastName: z.string().trim().max(100, 'Máximo 100 caracteres').optional(),
  identification: z.string().trim().min(1, 'La identificación es requerida').max(50, 'Máximo 50 caracteres'),
  phone: z.string().trim().max(20, 'Máximo 20 caracteres').optional(),
  email: z.string().trim().email('Email inválido').max(255, 'Máximo 255 caracteres').optional().or(z.literal('')),
  city: z.string().trim().max(100, 'Máximo 100 caracteres').optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface QuickCustomerFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (customer: Omit<Customer, 'id' | 'createdAt'>) => Promise<void>;
}

export const QuickCustomerForm: React.FC<QuickCustomerFormProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      lastName: '',
      identification: '',
      phone: '',
      email: '',
      city: '',
    }
  });

  const handleSubmit = async (data: CustomerFormData) => {
    try {
      await onSubmit({
        name: data.name,
        lastName: data.lastName || '',
        identification: data.identification,
        phone: data.phone || '',
        email: data.email || '',
        city: data.city || '',
      });
      form.reset();
      onClose();
    } catch (error) {
      console.error('Error adding customer:', error);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Agregar Cliente Rápido
          </DialogTitle>
          <DialogDescription>
            Completa los campos esenciales para registrar un nuevo cliente
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre *</FormLabel>
                    <FormControl>
                      <Input placeholder="Juan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellido</FormLabel>
                    <FormControl>
                      <Input placeholder="Pérez" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="identification"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Identificación *</FormLabel>
                  <FormControl>
                    <Input placeholder="1234567890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <Input placeholder="+57 300 123 4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="cliente@ejemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ciudad</FormLabel>
                  <FormControl>
                    <Input placeholder="Bogotá" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? 'Guardando...' : 'Guardar Cliente'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
