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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useTeamManagement } from '@/hooks/useTeamManagement';
import { ASSIGNABLE_ROLES, TEAM_ROLES } from '@/utils/permissions';
import { Loader2 } from 'lucide-react';

const editSchema = z.object({
  role: z.enum(['viewer', 'staff'])
});

type EditFormData = z.infer<typeof editSchema>;

interface EditMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: {
    id: string;
    user_id: string;
    email: string;
    name: string;
    role: string;
  };
}

export const EditMemberModal: React.FC<EditMemberModalProps> = ({
  open,
  onOpenChange,
  member
}) => {
  const { updateMemberRole } = useTeamManagement();

  const form = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      role: (member.role === 'viewer' || member.role === 'staff') ? member.role : 'staff'
    }
  });

  const onSubmit = async (data: EditFormData) => {
    try {
      await updateMemberRole.mutateAsync({
        userId: member.user_id,
        newRole: data.role
      });
      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const getInitials = (name: string, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    }
    return email.slice(0, 2).toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Rol de Miembro</DialogTitle>
          <DialogDescription>
            Cambia los permisos de acceso para este usuario
          </DialogDescription>
        </DialogHeader>

        {/* Member Info */}
        <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
          <Avatar>
            <AvatarFallback className="bg-primary/10 text-primary">
              {getInitials(member.name, member.email)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{member.name || member.email}</p>
            <p className="text-sm text-muted-foreground">{member.email}</p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nuevo Rol</FormLabel>
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
                            <RadioGroupItem value={roleKey} id={`edit-${roleKey}`} className="mt-1" />
                            <div className="flex-1">
                              <label
                                htmlFor={`edit-${roleKey}`}
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
              <Button type="submit" disabled={updateMemberRole.isPending}>
                {updateMemberRole.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Guardar Cambios
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
