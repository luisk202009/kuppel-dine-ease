// Update this page (the content is just a fallback if you fail to update the page)

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Coffee, Users, CreditCard } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            Kuppel POS Demo
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Sistema completo de punto de venta para restaurantes y bares. 
            Gestión inteligente de mesas, productos, clientes y pagos.
          </p>
          <Button size="lg" className="bg-gradient-primary hover:opacity-90" asChild>
            <a href="/">
              <Coffee className="h-5 w-5 mr-2" />
              Acceder al Sistema POS
              <ArrowRight className="h-5 w-5 ml-2" />
            </a>
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="pos-card text-center">
            <CardHeader>
              <Users className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>Gestión de Mesas</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Control visual de todas las mesas con estados en tiempo real. 
                Organización por áreas del restaurante.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="pos-card text-center">
            <CardHeader>
              <Coffee className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>Catálogo Completo</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Productos organizados por categorías con precios actualizados. 
                Búsqueda rápida y gestión de inventario.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="pos-card text-center">
            <CardHeader>
              <CreditCard className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>Sistema de Pagos</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Procesamiento de múltiples métodos de pago con cálculo 
                automático de impuestos y propinas.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            Credenciales de demo: <strong>admin / admin123</strong>
          </p>
          <div className="text-sm text-muted-foreground">
            <p>© 2024 Kuppel POS System. Desarrollado con React + TypeScript</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
