// Environment configuration
export interface Environment {
  name: 'development' | 'staging' | 'production';
  apiBaseUrl: string;
  enableDebugLogs: boolean;
  enableMockData: boolean;
  sentryDsn?: string;
  features: {
    orderHistory: boolean;
    realTimeUpdates: boolean;
    advancedReporting: boolean;
    multiCompany: boolean;
    requireLogin: boolean;
  };
}

const getEnvironment = (): Environment => {
  const isDev = import.meta.env.DEV;
  const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;

  // Development environment
  if (isDev) {
    return {
      name: 'development',
      apiBaseUrl: apiUrl,
      enableDebugLogs: true,
      enableMockData: false, // Security: Disable mock data even in dev
      sentryDsn,
      features: {
        orderHistory: true,
        realTimeUpdates: false,
        advancedReporting: true,
        multiCompany: true,
        requireLogin: true, // Security: Always require login
      },
    };
  }

  // Production environment
  return {
    name: 'production',
    apiBaseUrl: apiUrl,
    enableDebugLogs: false,
    enableMockData: false, // Security: Never allow mock data in production
    sentryDsn,
    features: {
      orderHistory: true,
      realTimeUpdates: true,
      advancedReporting: true,
      multiCompany: true,
      requireLogin: true, // Security: Always require login in production
    },
  };
};

export const env = getEnvironment();

// Utility functions
export const isProduction = () => env.name === 'production';
export const isDevelopment = () => env.name === 'development';
export const shouldUseMockData = () => env.enableMockData;
export const isFeatureEnabled = (feature: keyof Environment['features']) => env.features[feature];
export const isAuthRequired = () => env.features.requireLogin;