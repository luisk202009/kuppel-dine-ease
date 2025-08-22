import { useState, useEffect } from 'react';
import { logSecurityEvent } from '@/lib/monitoring';

interface SecurityEvent {
  id: string;
  type: 'password_strength' | 'login_attempt' | 'suspicious_activity';
  severity: 'low' | 'medium' | 'high';
  message: string;
  timestamp: Date;
}

export const useSecurityMonitoring = () => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lastAttempt, setLastAttempt] = useState<Date | null>(null);

  // Monitor login attempts
  const recordLoginAttempt = (success: boolean, username?: string) => {
    const now = new Date();
    setLastAttempt(now);
    
    if (!success) {
      setLoginAttempts(prev => prev + 1);
      
      const event: SecurityEvent = {
        id: `login_${Date.now()}`,
        type: 'login_attempt',
        severity: loginAttempts >= 3 ? 'high' : 'medium',
        message: `Failed login attempt${username ? ` for user ${username.substring(0, 3)}***` : ''}`,
        timestamp: now
      };
      
      setEvents(prev => [event, ...prev.slice(0, 9)]); // Keep last 10 events
      logSecurityEvent('failed_login_attempt', { attempts: loginAttempts + 1 });
      
      // Lock out after 5 attempts
      if (loginAttempts >= 4) {
        logSecurityEvent('account_lockout', { username: username?.substring(0, 3) + '***' });
      }
    } else {
      setLoginAttempts(0); // Reset on successful login
    }
  };

  // Check for suspicious activity
  const checkSuspiciousActivity = () => {
    if (loginAttempts >= 3) {
      return {
        detected: true,
        message: `${loginAttempts} failed login attempts detected`,
        severity: 'high' as const
      };
    }
    
    return { detected: false };
  };

  // Reset login attempts after time period
  useEffect(() => {
    if (lastAttempt && loginAttempts > 0) {
      const timer = setTimeout(() => {
        const timeSinceLastAttempt = Date.now() - lastAttempt.getTime();
        if (timeSinceLastAttempt > 15 * 60 * 1000) { // 15 minutes
          setLoginAttempts(0);
        }
      }, 15 * 60 * 1000);
      
      return () => clearTimeout(timer);
    }
  }, [lastAttempt, loginAttempts]);

  return {
    events,
    loginAttempts,
    recordLoginAttempt,
    checkSuspiciousActivity,
    isLocked: loginAttempts >= 5
  };
};