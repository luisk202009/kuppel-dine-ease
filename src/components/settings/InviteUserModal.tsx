import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useTeamManagement } from '@/hooks/useTeamManagement';
import { ASSIGNABLE_ROLES, TEAM_ROLES } from '@/utils/permissions';
import { Loader2 } from 'lucide-react';

const inviteSchema = z.object({
  email: z.string().email('Email inválido'),
  role: z.enum(['viewer', 'staff'])
});

type InviteFormData = z.infer<typeof inviteSchema>;

interface InviteUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const InviteUserModal: React.FC<InviteUserModalProps> = ({
  open,
  onOpenChange
}) => {
  const { inviteUser } = useTeamManagement();

  const form = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: '',
      role: 'staff'
    }
  });

  const onSubmit = async (data: InviteFormData) => {
    try {
      await inviteUser.mutateAsync({ email: data.email, role: data.role });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invitar Usuario</DialogTitle>
          <DialogDescription>
            Envía una invitación por correo electrónico para unirse a tu empresa
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo electrónico</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="usuario@ejemplo.com"
                      type="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="space-y-3"
                    >
                      {ASSIGNABLE_ROLES.map((roleKey) => {
                        const role = TEAM_ROLES[roleKey];
                        return (
                          <div
                            key={roleKey}
                            className={`flex items-start space-x-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                              field.value === roleKey
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:bg-muted/50'
                            }`}
                            onClick={() => field.onChange(roleKey)}
                          >
                            <RadioGroupItem value={roleKey} id={roleKey} className="mt-1" />
                            <div className="flex-1">
                              <label
                                htmlFor={roleKey}
                                className="flex items-center gap-2 font-medium cursor-pointer"
                              >
                                <span>{role.icon}</span>
                                {role.label}
                              </label>
                              <p className="text-sm text-muted-foreground mt-1">
                                {role.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </RadioGroup>
                  </FormControl>
                  <FormDescription>
                    El usuario recibirá un email con un enlace para unirse
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={inviteUser.isPending}>
                {inviteUser.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Enviar Invitación
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
