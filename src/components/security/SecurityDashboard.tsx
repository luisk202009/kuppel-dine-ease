import React from 'react';
import { Shield, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SecurityAlert } from '@/components/common/SecurityAlert';

interface SecurityDashboardProps {
  securityStatus: {
    rls_enabled: boolean;
    tenant_isolation: boolean;
    privilege_escalation_prevented: boolean;
    storage_secured: boolean;
    demo_disabled: boolean;
  };
}

export const SecurityDashboard: React.FC<SecurityDashboardProps> = ({ 
  securityStatus 
}) => {
  const getOverallStatus = () => {
    const checks = Object.values(securityStatus);
    const passedChecks = checks.filter(Boolean).length;
    
    if (passedChecks === checks.length) return 'secure';
    if (passedChecks >= checks.length * 0.7) return 'warning';
    return 'critical';
  };

  const status = getOverallStatus();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <CardTitle>Estado de Seguridad</CardTitle>
            </div>
            <Badge 
              variant={status === 'secure' ? 'default' : status === 'warning' ? 'secondary' : 'destructive'}
              className="capitalize"
            >
              {status === 'secure' ? 'Seguro' : status === 'warning' ? 'Advertencia' : 'Crítico'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <SecurityCheckItem 
              label="RLS Habilitado"
              status={securityStatus.rls_enabled}
              description="Row Level Security activo en todas las tablas"
            />
            <SecurityCheckItem 
              label="Aislamiento de Inquilinos"
              status={securityStatus.tenant_isolation}
              description="Datos separados por empresa"
            />
            <SecurityCheckItem 
              label="Sin Escalación de Privilegios"
              status={securityStatus.privilege_escalation_prevented}
              description="Usuarios no pueden cambiar sus roles"
            />
            <SecurityCheckItem 
              label="Almacenamiento Seguro"
              status={securityStatus.storage_secured}
              description="Políticas de acceso a archivos configuradas"
            />
            <SecurityCheckItem 
              label="Modo Demo Deshabilitado"
              status={securityStatus.demo_disabled}
              description="Acceso demo restringido en producción"
            />
          </div>
        </CardContent>
      </Card>

      {/* Security Alerts */}
      {!securityStatus.rls_enabled && (
        <SecurityAlert
          type="warning"
          title="RLS No Configurado"
          message="Algunas tablas no tienen Row Level Security habilitado, lo que puede exponer datos sensibles."
        />
      )}
      
      {!securityStatus.tenant_isolation && (
        <SecurityAlert
          type="warning"
          title="Aislamiento Insuficiente"
          message="Los datos no están completamente aislados por empresa. Los usuarios podrían acceder a información de otras organizaciones."
        />
      )}
      
      {!securityStatus.privilege_escalation_prevented && (
        <SecurityAlert
          type="warning"
          title="Riesgo de Escalación"
          message="Los usuarios podrían ser capaces de modificar sus propios roles o permisos."
        />
      )}
    </div>
  );
};

interface SecurityCheckItemProps {
  label: string;
  status: boolean;
  description: string;
}

const SecurityCheckItem: React.FC<SecurityCheckItemProps> = ({
  label,
  status,
  description
}) => {
  return (
    <div className="flex items-start space-x-3 p-3 rounded-lg border">
      {status ? (
        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
      ) : (
        <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
      )}
      <div className="space-y-1">
        <p className="font-medium text-sm">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
};