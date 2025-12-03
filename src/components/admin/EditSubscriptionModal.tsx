import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

const formSchema = z.object({
  plan_id: z.string().min(1, 'Selecciona un plan'),
  status: z.string().min(1, 'Selecciona un estado'),
  billing_period: z.string().min(1, 'Selecciona un periodo'),
  current_period_start: z.date({ required_error: 'Fecha de inicio requerida' }),
  current_period_end: z.date({ required_error: 'Fecha de fin requerida' }),
  trial_end_at: z.date().nullable().optional(),
  payment_link: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface EditSubscriptionModalProps {
  subscription: {
    id: string;
    company_id: string;
    plan_id: string;
    status: string;
    billing_period: string;
    current_period_start: string;
    current_period_end: string;
    trial_end_at?: string | null;
    payment_link?: string | null;
    notes?: string | null;
    companies?: { name: string } | null;
    plans?: { name: string } | null;
  } | null;
  open: boolean;
  onClose: (refreshNeeded?: boolean) => void;
}

const STATUS_OPTIONS = [
  { value: 'active', label: 'Activo' },
  { value: 'trialing', label: 'Prueba' },
  { value: 'past_due', label: 'Pago pendiente' },
  { value: 'canceled', label: 'Cancelado' },
  { value: 'expired', label: 'Expirado' },
  { value: 'superseded', label: 'Reemplazada' },
];

const BILLING_PERIODS = [
  { value: 'monthly', label: 'Mensual' },
  { value: 'yearly', label: 'Anual' },
];

export const EditSubscriptionModal: React.FC<EditSubscriptionModalProps> = ({
  subscription,
  open,
  onClose,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: plans } = useQuery({
    queryKey: ['plans-for-edit'],
    queryFn: async () => {
      const { data } = await supabase
        .from('plans')
        .select('id, name, code')
        .eq('is_active', true)
        .order('name');
      return data || [];
    },
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      plan_id: '',
      status: '',
      billing_period: 'monthly',
      current_period_start: new Date(),
      current_period_end: new Date(),
      trial_end_at: null,
      payment_link: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (subscription && open) {
      form.reset({
        plan_id: subscription.plan_id,
        status: subscription.status,
        billing_period: subscription.billing_period,
        current_period_start: new Date(subscription.current_period_start),
        current_period_end: new Date(subscription.current_period_end),
        trial_end_at: subscription.trial_end_at ? new Date(subscription.trial_end_at) : null,
        payment_link: subscription.payment_link || '',
        notes: subscription.notes || '',
      });
    }
  }, [subscription, open, form]);

  const onSubmit = async (data: FormData) => {
    if (!subscription) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('company_subscriptions')
        .update({
          plan_id: data.plan_id,
          status: data.status,
          billing_period: data.billing_period,
          current_period_start: data.current_period_start.toISOString(),
          current_period_end: data.current_period_end.toISOString(),
          trial_end_at: data.trial_end_at?.toISOString() || null,
          payment_link: data.payment_link || null,
          notes: data.notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscription.id);

      if (error) throw error;

      // Optionally sync to companies table
      await supabase
        .from('companies')
        .update({
          plan_id: data.plan_id,
          subscription_status: data.status,
          billing_period: data.billing_period,
        })
        .eq('id', subscription.company_id);

      toast({ title: 'Éxito', description: 'Suscripción actualizada correctamente' });
      onClose(true);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar la suscripción',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Editar suscripción
            {subscription?.companies?.name && (
              <span className="block text-sm font-normal text-muted-foreground mt-1">
                {subscription.companies.name}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Plan */}
            <FormField
              control={form.control}
              name="plan_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plan</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar plan" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {plans?.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status & Billing Period */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STATUS_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="billing_period"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Periodo de facturación</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Periodo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {BILLING_PERIODS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Period dates */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="current_period_start"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha inicio</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'dd MMM yyyy', { locale: es })
                            ) : (
                              <span>Seleccionar</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="current_period_end"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha fin</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'dd MMM yyyy', { locale: es })
                            ) : (
                              <span>Seleccionar</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Trial end date */}
            <FormField
              control={form.control}
              name="trial_end_at"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha fin de prueba (opcional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'dd MMM yyyy', { locale: es })
                          ) : (
                            <span>Sin fecha de prueba</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value || undefined}
                        onSelect={field.onChange}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Payment link */}
            <FormField
              control={form.control}
              name="payment_link"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link de pago (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notas adicionales sobre la suscripción..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onClose()}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
