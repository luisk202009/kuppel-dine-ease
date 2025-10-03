/**
 * Application monitoring and error tracking
 */

import * as Sentry from '@sentry/react';
import { 
  useLocation, 
  useNavigationType, 
  createRoutesFromChildren, 
  matchRoutes 
} from 'react-router-dom';
import React from 'react';

// Initialize Sentry for error monitoring
export const initializeMonitoring = () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  
  if (!dsn) {
    console.log('Sentry DSN not configured, monitoring disabled');
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    // Performance Monitoring
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    beforeSend(event, hint) {
      // Filter out sensitive information
      if (event.request?.data) {
        // Remove password fields
        if (typeof event.request.data === 'object' && event.request.data !== null) {
          const sanitized = { ...event.request.data as Record<string, any> };
          delete sanitized.password;
          delete sanitized.token;
          event.request.data = sanitized;
        }
      }
      
      // Don't send authentication errors to reduce noise
      if (event.exception?.values?.[0]?.value?.includes('authentication')) {
        return null;
      }
      
      return event;
    },
  });
};

// Log security events
export const logSecurityEvent = (event: string, details?: Record<string, any>) => {
  if (!import.meta.env.PROD) {
    console.warn(`Security Event: ${event}`, details);
  }
  
  if (import.meta.env.PROD) {
    Sentry.addBreadcrumb({
      message: `Security: ${event}`,
      category: 'security',
      level: 'warning',
      data: details
    });
  }
};

// Log authentication events
export const logAuthEvent = (event: 'login_attempt' | 'login_success' | 'login_failure' | 'logout', username?: string) => {
  const sanitizedUsername = username ? username.substring(0, 3) + '***' : 'unknown';
  
  if (!import.meta.env.PROD) {
    console.info(`Auth Event: ${event} for user ${sanitizedUsername}`);
  }
  
  if (import.meta.env.PROD) {
    Sentry.addBreadcrumb({
      message: `Auth: ${event}`,
      category: 'auth',
      level: event.includes('failure') ? 'warning' : 'info',
      data: { user: sanitizedUsername }
    });
  }
};

// Track performance metrics
export const trackPerformance = (metric: string, value: number, unit = 'ms') => {
  if (import.meta.env.PROD) {
    Sentry.addBreadcrumb({
      message: `Performance: ${metric}`,
      category: 'performance',
      data: { value, unit }
    });
  }
};