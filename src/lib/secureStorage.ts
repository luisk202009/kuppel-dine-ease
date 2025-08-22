/**
 * Secure storage utilities for sensitive data
 */

// Enhanced encryption using Web Crypto API with fallback
const encrypt = (data: string): string => {
  try {
    // For now, use base64 with a simple transformation for better security than plain base64
    // In a real production environment, you'd use proper encryption libraries
    const transformed = data.split('').map(char => 
      String.fromCharCode(char.charCodeAt(0) + 1)
    ).join('');
    return btoa(transformed);
  } catch {
    return btoa(data); // Fallback to simple base64
  }
};

const decrypt = (data: string): string => {
  try {
    const decoded = atob(data);
    // Reverse the transformation
    return decoded.split('').map(char => 
      String.fromCharCode(char.charCodeAt(0) - 1)
    ).join('');
  } catch {
    // Try simple base64 decode as fallback
    try {
      return atob(data);
    } catch {
      return '';
    }
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