import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, MessageCircle, User, Phone, MapPin } from 'lucide-react';

export interface CustomerInfo {
  name: string;
  phone: string;
  address: string;
}

interface CheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (customerInfo: CustomerInfo) => Promise<void>;
  isSubmitting: boolean;
  total: number;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  total,
}) => {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    phone: '',
    address: '',
  });

  const [errors, setErrors] = useState<Partial<CustomerInfo>>({});

  const validate = (): boolean => {
    const newErrors: Partial<CustomerInfo> = {};

    if (!customerInfo.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!customerInfo.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido';
    } else if (!/^\d{7,15}$/.test(customerInfo.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Ingresa un teléfono válido';
    }

    if (!customerInfo.address.trim()) {
      newErrors.address = 'La dirección de entrega es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(customerInfo);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Confirmar Pedido
          </DialogTitle>
          <DialogDescription>
            Ingresa tus datos para enviar el pedido por WhatsApp
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer Name */}
          <div className="space-y-2">
            <Label htmlFor="customer-name" className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Nombre completo
            </Label>
            <Input
              id="customer-name"
              placeholder="Tu nombre"
              value={customerInfo.name}
              onChange={(e) =>
                setCustomerInfo((prev) => ({ ...prev, name: e.target.value }))
              }
              disabled={isSubmitting}
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="customer-phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              Teléfono
            </Label>
            <Input
              id="customer-phone"
              type="tel"
              placeholder="300 123 4567"
              value={customerInfo.phone}
              onChange={(e) =>
                setCustomerInfo((prev) => ({ ...prev, phone: e.target.value }))
              }
              disabled={isSubmitting}
              className={errors.phone ? 'border-destructive' : ''}
            />
            {errors.phone && (
              <p className="text-xs text-destructive">{errors.phone}</p>
            )}
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="customer-address" className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              Dirección de entrega
            </Label>
            <Textarea
              id="customer-address"
              placeholder="Calle, número, barrio, ciudad..."
              value={customerInfo.address}
              onChange={(e) =>
                setCustomerInfo((prev) => ({ ...prev, address: e.target.value }))
              }
              disabled={isSubmitting}
              className={errors.address ? 'border-destructive' : ''}
              rows={2}
            />
            {errors.address && (
              <p className="text-xs text-destructive">{errors.address}</p>
            )}
          </div>

          {/* Total Summary */}
          <div className="bg-muted/50 rounded-lg p-3 flex items-center justify-between">
            <span className="text-sm font-medium">Total del pedido</span>
            <span className="text-lg font-bold text-primary">
              ${total.toLocaleString()}
            </span>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <MessageCircle className="h-4 w-4" />
                  Enviar por WhatsApp
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
