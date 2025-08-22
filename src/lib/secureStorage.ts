/**
 * Secure storage utilities for sensitive data
 */

// Simple encryption for demo purposes - in production use proper encryption
const encrypt = (data: string): string => {
  return btoa(data); // Basic base64 encoding
};

const decrypt = (data: string): string => {
  try {
    return atob(data);
  } catch {
    return '';
  }
};

export const secureStorage = {
  // Store token securely
  setToken: (token: string): void => {
    const encrypted = encrypt(token);
    sessionStorage.setItem('kuppel_secure_token', encrypted);
  },

  // Get token securely
  getToken: (): string | null => {
    const encrypted = sessionStorage.getItem('kuppel_secure_token');
    if (!encrypted) return null;
    
    const decrypted = decrypt(encrypted);
    return decrypted || null;
  },

  // Clear token
  clearToken: (): void => {
    sessionStorage.removeItem('kuppel_secure_token');
  },

  // Store user data securely
  setUserData: (key: string, data: any): void => {
    const jsonString = JSON.stringify(data);
    const encrypted = encrypt(jsonString);
    sessionStorage.setItem(`kuppel_secure_${key}`, encrypted);
  },

  // Get user data securely
  getUserData: (key: string): any => {
    const encrypted = sessionStorage.getItem(`kuppel_secure_${key}`);
    if (!encrypted) return null;
    
    try {
      const decrypted = decrypt(encrypted);
      return JSON.parse(decrypted);
    } catch {
      return null;
    }
  },

  // Clear all secure data
  clearAll: (): void => {
    const keysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith('kuppel_secure_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => sessionStorage.removeItem(key));
  }
};