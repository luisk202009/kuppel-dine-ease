
# Plan: Convertir Botón Dataico a DropdownMenuItem

## Resumen

Se convertirá la interfaz actual de `InvoiceActions.tsx` para que todas las acciones (PDF, Email, Enviar DIAN) estén dentro de un menú desplegable unificado usando `DropdownMenu` de Radix UI.

---

## Cambios Requeridos

### 1. Nuevas Importaciones

```typescript
import { MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
```

### 2. Nueva Estructura de UI

Reemplazar el `div` con botones individuales por un `DropdownMenu` que contenga todas las acciones:

```tsx
<div className="flex gap-2 items-center">
  {/* Badge de DIAN sincronizado - se mantiene visible */}
  {dataicoUuid && (
    <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
      <CheckCircle className="h-3 w-3 mr-1" />
      DIAN
    </Badge>
  )}

  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="outline" size="sm">
        <MoreVertical className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="bg-popover">
      {/* Opción Enviar a DIAN */}
      {showDataicoButton && (
        <>
          <DropdownMenuItem 
            onClick={handleSendToDataico}
            disabled={isDataicoLoading}
            className="cursor-pointer"
          >
            {isDataicoLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Zap className="h-4 w-4 mr-2 text-yellow-600" />
            )}
            Emitir Factura Electrónica
          </DropdownMenuItem>
          <DropdownMenuSeparator />
        </>
      )}
      
      {/* Opción PDF */}
      <DropdownMenuItem 
        onClick={handleGeneratePdf}
        disabled={isGeneratingPdf}
        className="cursor-pointer"
      >
        {isGeneratingPdf ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <FileDown className="h-4 w-4 mr-2" />
        )}
        Descargar PDF
      </DropdownMenuItem>
      
      {/* Opción Email */}
      <DropdownMenuItem 
        onClick={() => setEmailDialogOpen(true)}
        className="cursor-pointer"
      >
        <Mail className="h-4 w-4 mr-2" />
        Enviar por Email
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</div>
```

---

## Archivo a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/invoicing/InvoiceActions.tsx` | Reemplazar botones por DropdownMenu |

---

## Detalles de Implementacion

### Importaciones a Agregar (Linea 2)
- `MoreVertical` de lucide-react

### Importaciones Nuevas (Despues de linea 17)
- `DropdownMenu`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuSeparator`, `DropdownMenuTrigger` de `@/components/ui/dropdown-menu`

### Seccion JSX (Lineas 136-186)
Reemplazar completamente el bloque de botones con la nueva estructura de DropdownMenu.

---

## Resultado Esperado

1. Un boton con icono de tres puntos verticales (`MoreVertical`) que al hacer clic despliega un menu
2. La opcion "Emitir Factura Electronica" aparece primero si cumple las condiciones (modulo habilitado, credenciales configuradas, factura emitida, sin UUID de Dataico)
3. Separador visual entre la opcion de DIAN y las demas
4. Opciones "Descargar PDF" y "Enviar por Email" siempre visibles
5. El Badge verde de "DIAN" se mantiene visible fuera del menu cuando la factura ya esta sincronizada
6. El menu tiene fondo solido (`bg-popover`) para evitar transparencia
