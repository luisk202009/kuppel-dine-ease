import { useEffect, useState } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { supabase } from '@/integrations/supabase/client';

export interface TourStep {
  element: string;
  popover: {
    title: string;
    description: string;
    side?: 'top' | 'right' | 'bottom' | 'left';
    align?: 'start' | 'center' | 'end';
  };
}

export const useDashboardTour = (userId: string | undefined, shouldShow: boolean) => {
  const [isTourActive, setIsTourActive] = useState(false);

  const tourSteps: TourStep[] = [
    {
      element: '#dashboard-header',
      popover: {
        title: '¡Bienvenido a tu Dashboard! 🎉',
        description: 'Este es tu panel de control principal donde gestionarás todas las operaciones de tu negocio. Te mostraremos las funciones más importantes.',
        side: 'bottom',
        align: 'center'
      }
    },
    {
      element: '#main-navigation',
      popover: {
        title: 'Navegación Principal',
        description: 'Usa estas pestañas para alternar entre la vista de Mesas y Productos. Aquí es donde pasarás la mayor parte del tiempo.',
        side: 'bottom',
        align: 'center'
      }
    },
    {
      element: '#search-bar',
      popover: {
        title: 'Búsqueda Rápida 🔍',
        description: 'Busca productos rápidamente escribiendo su nombre. Muy útil cuando tienes muchos productos en tu catálogo.',
        side: 'bottom',
        align: 'start'
      }
    },
    {
      element: '#shopping-cart',
      popover: {
        title: 'Carrito de Compras 🛒',
        description: 'Aquí verás los productos agregados. Puedes modificar cantidades, aplicar descuentos y procesar pagos desde este panel.',
        side: 'left',
        align: 'start'
      }
    },
    {
      element: '#settings-button',
      popover: {
        title: 'Configuración ⚙️',
        description: 'Accede a la configuración completa: gestiona clientes, productos, áreas, reportes y más. Todo está organizado aquí.',
        side: 'bottom',
        align: 'end'
      }
    },
    {
      element: '#theme-toggle',
      popover: {
        title: 'Modo Oscuro/Claro 🌓',
        description: 'Cambia entre tema claro y oscuro según tu preferencia. El sistema recordará tu elección.',
        side: 'bottom',
        align: 'end'
      }
    }
  ];

  const startTour = () => {
    setIsTourActive(true);

    const driverObj = driver({
      showProgress: true,
      steps: tourSteps,
      nextBtnText: 'Siguiente →',
      prevBtnText: '← Anterior',
      doneBtnText: '¡Entendido!',
      showButtons: ['next', 'previous'],
      popoverClass: 'dashboard-tour-popover',
      onDestroyed: async () => {
        setIsTourActive(false);
        await completeTour();
      },
      onDestroyStarted: async () => {
        if (!driverObj.hasNextStep()) {
          await completeTour();
        }
        return true;
      }
    });

    // Small delay to ensure DOM is ready
    setTimeout(() => {
      driverObj.drive();
    }, 500);
  };

  const completeTour = async () => {
    if (!userId) return;
    
    try {
      await supabase
        .from('users')
        .update({ tour_completed: true })
        .eq('id', userId);
    } catch (error) {
      console.error('Error marking tour as completed:', error);
    }
  };

  const skipTour = async () => {
    await completeTour();
  };

  useEffect(() => {
    if (shouldShow && !isTourActive) {
      startTour();
    }
  }, [shouldShow]);

  return {
    startTour,
    skipTour,
    isTourActive
  };
};
