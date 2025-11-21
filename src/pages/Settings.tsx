import React, { useState } from 'react';
import { Settings as SettingsIcon, Layout, Monitor, Smartphone, MapPin, Grid3x3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutSettings } from '@/components/settings/LayoutSettings';
import { DisplaySettings } from '@/components/settings/DisplaySettings';
import { TouchSettings } from '@/components/settings/TouchSettings';
import { TableSystemSettings } from '@/components/settings/TableSystemSettings';
import { AreaManager } from '@/components/pos/AreaManager';
import { TableManager } from '@/components/pos/TableManager';

export const Settings: React.FC = () => {
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
          <SettingsIcon className="h-8 w-8" />
          Ajustes del Sistema
        </h1>
        <p className="text-muted-foreground">
          Configura el comportamiento y apariencia del sistema
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Categorías</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <nav className="space-y-1">
                <a href="#layout" className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted transition-colors">
                  <Layout className="h-4 w-4" />
                  Diseño
                </a>
                <a href="#display" className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted transition-colors">
                  <Monitor className="h-4 w-4" />
                  Pantalla
                </a>
                <a href="#touch" className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted transition-colors">
                  <Smartphone className="h-4 w-4" />
                  Táctil
                </a>
                <a href="#table-system" className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted transition-colors">
                  <Grid3x3 className="h-4 w-4" />
                  Sistema de Mesas
                </a>
                <a href="#areas" className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted transition-colors">
                  <MapPin className="h-4 w-4" />
                  Áreas
                </a>
                <a href="#tables" className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted transition-colors">
                  <Grid3x3 className="h-4 w-4" />
                  Gestión de Mesas
                </a>
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Layout Section */}
          <div id="layout">
            <LayoutSettings />
          </div>

          {/* Display Section */}
          <div id="display">
            <DisplaySettings />
          </div>

          {/* Touch Section */}
          <div id="touch">
            <TouchSettings />
          </div>

          {/* Table System Section */}
          <div id="table-system">
            <TableSystemSettings />
          </div>

          {/* Areas Section */}
          <div id="areas">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Gestión de Áreas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Configura las áreas de tu establecimiento. Las áreas te permiten organizar las mesas por zonas (jardín, terraza, salón principal, etc.).
                </p>
                <AreaManager />
              </CardContent>
            </Card>
          </div>

          {/* Tables Management Section */}
          <div id="tables">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Grid3x3 className="h-5 w-5" />
                  Gestión de Mesas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Administra las mesas de tu establecimiento. Puedes crear, editar y eliminar mesas desde aquí.
                </p>
                <TableManager />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
