import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SubscriptionSummary } from './SubscriptionSummary';
import { BillingDataForm } from './BillingDataForm';

export const SubscriptionsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Suscripciones</h2>
        <p className="text-muted-foreground">
          Gestiona tus planes, pagos y datos de facturación
        </p>
      </div>

      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="summary">Resumen</TabsTrigger>
          <TabsTrigger value="billing">Datos de Facturación</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-6">
          <SubscriptionSummary />
        </TabsContent>

        <TabsContent value="billing" className="mt-6">
          <BillingDataForm />
        </TabsContent>
      </Tabs>
    </div>
  );
};
