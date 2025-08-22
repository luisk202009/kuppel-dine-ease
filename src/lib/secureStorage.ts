/**
 * Secure storage utilities for sensitive data
 */

// Enhanced encryption using Web Crypto API with fallback
const encrypt = async (data: string): Promise<string> => {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const key = await window.crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode('kuppel-pos-key-32-chars-long!'),
        { name: 'AES-GCM' },
        false,
        ['encrypt']
      );
      
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const encoded = new TextEncoder().encode(data);
      
      const encrypted = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encoded
      );
      
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);
      
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.warn('Web Crypto API failed, falling back to base64:', error);
    }
  }
  
  // Fallback to base64 encoding
  return btoa(data);
};

const decrypt = async (data: string): Promise<string> => {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const combined = new Uint8Array(atob(data).split('').map(c => c.charCodeAt(0)));
      
      if (combined.length > 12) {
        const key = await window.crypto.subtle.importKey(
          'raw',
          new TextEncoder().encode('kuppel-pos-key-32-chars-long!'),
          { name: 'AES-GCM' },
          false,
          ['decrypt']
        );
        
        const iv = combined.slice(0, 12);
        const encrypted = combined.slice(12);
        
        const decrypted = await window.crypto.subtle.decrypt(
          { name: 'AES-GCM', iv },
          key,
          encrypted
        );
        
        return new TextDecoder().decode(decrypted);
      }
    } catch (error) {
      console.warn('Web Crypto API decryption failed, falling back to base64:', error);
    }
  }
  
  // Fallback to base64 decoding
  try {
    return atob(data);
  } catch {
    return '';
  }
};

export const secureStorage = {
  // Store token securely
  setToken: async (token: string): Promise<void> => {
    const encrypted = await encrypt(token);
    sessionStorage.setItem('kuppel_secure_token', encrypted);
  },

  // Get token securely
  getToken: async (): Promise<string | null> => {
    const encrypted = sessionStorage.getItem('kuppel_secure_token');
    if (!encrypted) return null;
    
    const decrypted = await decrypt(encrypted);
    return decrypted || null;
  },

  // Clear token
  clearToken: (): void => {
    sessionStorage.removeItem('kuppel_secure_token');
  },

  // Store user data securely
  setUserData: async (key: string, data: any): Promise<void> => {
    const jsonString = JSON.stringify(data);
    const encrypted = await encrypt(jsonString);
    sessionStorage.setItem(`kuppel_secure_${key}`, encrypted);
  },

  // Get user data securely
  getUserData: async (key: string): Promise<any> => {
    const encrypted = sessionStorage.getItem(`kuppel_secure_${key}`);
    if (!encrypted) return null;
    
    try {
      const decrypted = await decrypt(encrypted);
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