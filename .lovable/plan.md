

# Plan: Actualizar Configuración PWA

## Resumen

El proyecto ya tiene `vite-plugin-pwa` configurado. Se ajustará la configuración existente para cumplir con los nuevos requisitos de branding y tema.

---

## Cambios Requeridos

| Configuración | Valor Actual | Valor Nuevo |
|---------------|--------------|-------------|
| `name` | Kuppel POS | Kuppel Dine Ease |
| `short_name` | Kuppel POS | Kuppel |
| `theme_color` | #0f766e | #ffffff |
| `background_color` | #ffffff | #ffffff (sin cambio) |
| Icono 512x512 | `purpose: 'any'` | Agregar entrada adicional con `purpose: 'any maskable'` |

---

## Archivo a Modificar

### `vite.config.ts`

**Cambios en el manifest:**

```typescript
manifest: {
  name: 'Kuppel Dine Ease',        // Antes: 'Kuppel POS'
  short_name: 'Kuppel',             // Antes: 'Kuppel POS'
  description: 'Sistema de punto de venta para bares, cafés y restaurantes',
  theme_color: '#ffffff',           // Antes: '#0f766e'
  background_color: '#ffffff',
  display: 'standalone',
  orientation: 'portrait-primary',
  scope: '/',
  start_url: '/',
  icons: [
    {
      src: '/favicon.ico',
      sizes: '64x64 32x32 24x24 16x16',
      type: 'image/x-icon'
    },
    {
      src: '/pwa-192x192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any'
    },
    {
      src: '/pwa-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any'
    },
    {
      src: '/pwa-512x512.png',              // NUEVO
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any maskable'               // Icono combinado
    },
    {
      src: '/pwa-maskable-192x192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'maskable'
    },
    {
      src: '/pwa-maskable-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable'
    }
  ],
  // ... resto de configuración sin cambios
}
```

---

## Resumen de Iconos Configurados

| Archivo | Tamaño | Purpose |
|---------|--------|---------|
| favicon.ico | 16-64px | - |
| pwa-192x192.png | 192x192 | any |
| pwa-512x512.png | 512x512 | any |
| pwa-512x512.png | 512x512 | any maskable (NUEVO) |
| pwa-maskable-192x192.png | 192x192 | maskable |
| pwa-maskable-512x512.png | 512x512 | maskable |

---

## Configuraciones que se Mantienen

- `registerType: 'autoUpdate'` (ya configurado)
- `display: 'standalone'` (ya configurado)
- Estrategias de caching para Supabase, Google Fonts e imágenes
- Shortcuts para "Abrir Caja" y "Nueva Orden"
- Categorías: business, productivity, finance
- Idioma: español

---

## Resultado Esperado

Después de aplicar los cambios:
1. La PWA se identificará como "Kuppel Dine Ease" en la pantalla de instalación
2. El icono en el dispositivo mostrará "Kuppel" como nombre corto
3. La barra de estado/tema será blanca (#ffffff)
4. El icono 512x512 funcionará correctamente tanto en modo estándar como maskable

