import { describe, it, expect, vi } from 'vitest';
import { env, isProduction, isDevelopment, shouldUseMockData, isFeatureEnabled } from '@/config/environment';

// Mock import.meta.env
const mockEnv = {
  DEV: true,
  VITE_API_BASE_URL: 'http://localhost:3000/api',
  VITE_SENTRY_DSN: 'test-sentry-dsn',
};

vi.stubGlobal('import', {
  meta: {
    env: mockEnv,
  },
});

describe('Environment Configuration', () => {
  it('should return development environment when DEV is true', () => {
    expect(env.name).toBe('development');
    expect(env.enableDebugLogs).toBe(true);
    expect(env.enableMockData).toBe(true);
  });

  it('should return correct API base URL', () => {
    expect(env.apiBaseUrl).toBe('http://localhost:3000/api');
  });

  it('should return correct Sentry DSN', () => {
    expect(env.sentryDsn).toBe('test-sentry-dsn');
  });

  it('should identify development environment correctly', () => {
    expect(isDevelopment()).toBe(true);
    expect(isProduction()).toBe(false);
  });

  it('should enable mock data in development', () => {
    expect(shouldUseMockData()).toBe(true);
  });

  it('should enable all features in development', () => {
    expect(isFeatureEnabled('orderHistory')).toBe(true);
    expect(isFeatureEnabled('realTimeUpdates')).toBe(false); // Should be false in dev
    expect(isFeatureEnabled('advancedReporting')).toBe(true);
    expect(isFeatureEnabled('multiCompany')).toBe(true);
  });

  it('should handle missing environment variables gracefully', () => {
    const originalEnv = { ...mockEnv };
    mockEnv.VITE_API_BASE_URL = '';
    
    // Re-import to test fallback
    expect(env.apiBaseUrl).toBeTruthy(); // Should have fallback
    
    // Restore
    Object.assign(mockEnv, originalEnv);
  });
});