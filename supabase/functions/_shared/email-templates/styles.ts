// Kuppel Brand Email Styles
// Centralized styling configuration for all email templates

export const brandStyles = {
  // Primary colors
  primaryColor: '#7c3aed',
  primaryDark: '#6d28d9',
  primaryLight: '#a78bfa',
  
  // Secondary colors
  secondaryColor: '#10b981',
  secondaryDark: '#059669',
  
  // Text colors
  textPrimary: '#1f2937',
  textSecondary: '#4b5563',
  textMuted: '#9ca3af',
  textLight: '#ffffff',
  
  // Background colors
  bgPrimary: '#ffffff',
  bgSecondary: '#f9fafb',
  bgAccent: '#f3f4f6',
  bgDark: '#1f2937',
  
  // Border
  borderColor: '#e5e7eb',
  borderRadius: '12px',
  borderRadiusSmall: '8px',
  
  // Company info
  companyName: 'Kuppel',
  senderEmail: 'noreply@notifications.kuppel.co',
  supportEmail: 'soporte@kuppel.co',
  websiteUrl: 'https://kuppel.co',
  copyrightYear: new Date().getFullYear(),
  
  // Status colors
  successColor: '#10b981',
  warningColor: '#f59e0b',
  errorColor: '#ef4444',
  infoColor: '#3b82f6',
};

// Base styles for email components
export const baseStyles = {
  body: {
    backgroundColor: brandStyles.bgAccent,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    margin: '0',
    padding: '40px 0',
  },
  container: {
    maxWidth: '600px',
    margin: '0 auto',
    backgroundColor: brandStyles.bgPrimary,
    borderRadius: brandStyles.borderRadius,
    overflow: 'hidden',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
  },
  header: {
    backgroundColor: brandStyles.primaryColor,
    padding: '32px 24px',
    textAlign: 'center' as const,
  },
  headerGradient: {
    background: `linear-gradient(135deg, ${brandStyles.primaryColor}, ${brandStyles.primaryDark})`,
    padding: '32px 24px',
    textAlign: 'center' as const,
  },
  logo: {
    color: brandStyles.textLight,
    fontSize: '28px',
    fontWeight: '700' as const,
    margin: '0',
    letterSpacing: '-0.5px',
  },
  content: {
    padding: '32px',
  },
  footer: {
    padding: '24px 32px',
    backgroundColor: brandStyles.bgSecondary,
    borderTop: `1px solid ${brandStyles.borderColor}`,
  },
  footerText: {
    color: brandStyles.textMuted,
    fontSize: '12px',
    margin: '0',
    textAlign: 'center' as const,
  },
  paragraph: {
    color: brandStyles.textSecondary,
    fontSize: '15px',
    lineHeight: '1.6',
    margin: '0 0 16px 0',
  },
  heading: {
    color: brandStyles.textPrimary,
    fontSize: '20px',
    fontWeight: '600' as const,
    margin: '0 0 16px 0',
  },
  link: {
    color: brandStyles.primaryColor,
    textDecoration: 'underline',
  },
  divider: {
    borderTop: `1px solid ${brandStyles.borderColor}`,
    margin: '24px 0',
  },
  button: {
    backgroundColor: brandStyles.primaryColor,
    borderRadius: brandStyles.borderRadiusSmall,
    color: brandStyles.textLight,
    display: 'inline-block',
    fontSize: '16px',
    fontWeight: '600' as const,
    padding: '14px 32px',
    textAlign: 'center' as const,
    textDecoration: 'none',
  },
  buttonSecondary: {
    backgroundColor: brandStyles.bgAccent,
    borderRadius: brandStyles.borderRadiusSmall,
    border: `1px solid ${brandStyles.borderColor}`,
    color: brandStyles.textPrimary,
    display: 'inline-block',
    fontSize: '14px',
    fontWeight: '500' as const,
    padding: '10px 20px',
    textAlign: 'center' as const,
    textDecoration: 'none',
  },
  infoBox: {
    backgroundColor: brandStyles.bgSecondary,
    borderRadius: brandStyles.borderRadiusSmall,
    padding: '20px',
    margin: '24px 0',
  },
  warningBox: {
    backgroundColor: '#fef3c7',
    borderRadius: brandStyles.borderRadiusSmall,
    borderLeft: `4px solid ${brandStyles.warningColor}`,
    padding: '16px',
    margin: '24px 0',
  },
  successBox: {
    backgroundColor: '#d1fae5',
    borderRadius: brandStyles.borderRadiusSmall,
    borderLeft: `4px solid ${brandStyles.successColor}`,
    padding: '16px',
    margin: '24px 0',
  },
};

// Role translations for Spanish
export const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  cashier: 'Cajero',
  staff: 'Personal',
  viewer: 'Observador',
  company_owner: 'Propietario',
  platform_admin: 'Admin de Plataforma',
  demo: 'Demo',
};
