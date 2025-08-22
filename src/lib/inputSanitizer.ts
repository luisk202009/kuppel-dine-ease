/**
 * Input sanitization utilities
 */

// Sanitize string input to prevent XSS
export const sanitizeString = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>\"'&]/g, (match) => {
      const escapes: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      };
      return escapes[match] || match;
    })
    .substring(0, 1000); // Limit length
};

// Validate username format
export const validateUsername = (username: string): { isValid: boolean; error?: string } => {
  const sanitized = sanitizeString(username);
  
  if (!sanitized) {
    return { isValid: false, error: 'Usuario requerido' };
  }
  
  if (sanitized.length < 3) {
    return { isValid: false, error: 'Usuario debe tener al menos 3 caracteres' };
  }
  
  if (sanitized.length > 50) {
    return { isValid: false, error: 'Usuario demasiado largo' };
  }
  
  if (!/^[a-zA-Z0-9._-]+$/.test(sanitized)) {
    return { isValid: false, error: 'Usuario contiene caracteres inválidos' };
  }
  
  return { isValid: true };
};

// Validate password strength
export const validatePassword = (password: string): { isValid: boolean; error?: string; strength: 'weak' | 'medium' | 'strong' } => {
  if (!password) {
    return { isValid: false, error: 'Contraseña requerida', strength: 'weak' };
  }
  
  if (password.length < 8) {
    return { isValid: false, error: 'Contraseña debe tener al menos 8 caracteres', strength: 'weak' };
  }
  
  // Check for common weak passwords
  const commonPasswords = ['admin123', 'password', '12345678', 'qwerty'];
  if (commonPasswords.includes(password.toLowerCase())) {
    return { isValid: false, error: 'Contraseña demasiado común, usa una más segura', strength: 'weak' };
  }
  
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  let score = 0;
  
  // Check password criteria
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  
  if (score >= 4) strength = 'strong';
  else if (score >= 3) strength = 'medium';
  
  return { isValid: true, strength };
};

// Sanitize general form input
export const sanitizeFormInput = (input: any): any => {
  if (typeof input === 'string') {
    return sanitizeString(input);
  }
  
  if (typeof input === 'number') {
    return isFinite(input) ? input : 0;
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeFormInput);
  }
  
  if (input && typeof input === 'object') {
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[sanitizeString(key)] = sanitizeFormInput(value);
    }
    return sanitized;
  }
  
  return input;
};