/**
 * Secure storage utilities using Web Crypto API
 * Implements AES-GCM encryption for sensitive data
 */

// Derive a key from a static secret (in production, use environment-specific secrets)
const deriveKey = async (salt: Uint8Array): Promise<CryptoKey> => {
  const encoder = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(window.location.origin), // Use origin as base key material
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

// Encrypt using AES-GCM
const encrypt = async (data: string): Promise<string> => {
  try {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(salt);

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(data)
    );

    // Combine salt + iv + encrypted data
    const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encrypted), salt.length + iv.length);

    // Convert to base64
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
};

// Decrypt using AES-GCM
const decrypt = async (encryptedData: string): Promise<string> => {
  try {
    // Decode from base64
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));

    // Extract salt, iv, and encrypted data
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const encrypted = combined.slice(28);

    const key = await deriveKey(salt);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data');
  }
};

export const secureStorage = {
  // Store token securely with encryption
  setToken: async (token: string): Promise<void> => {
    try {
      const encrypted = await encrypt(token);
      sessionStorage.setItem('kuppel_secure_token', encrypted);
    } catch (error) {
      console.error('Failed to store token securely');
      throw error;
    }
  },

  // Get token securely with decryption
  getToken: async (): Promise<string | null> => {
    try {
      const encrypted = sessionStorage.getItem('kuppel_secure_token');
      if (!encrypted) return null;
      
      const decrypted = await decrypt(encrypted);
      return decrypted || null;
    } catch (error) {
      console.error('Failed to retrieve token');
      // Clear corrupted data
      sessionStorage.removeItem('kuppel_secure_token');
      return null;
    }
  },

  // Clear token
  clearToken: (): void => {
    sessionStorage.removeItem('kuppel_secure_token');
  },

  // Store user data securely with encryption
  setUserData: async (key: string, data: any): Promise<void> => {
    try {
      const jsonString = JSON.stringify(data);
      const encrypted = await encrypt(jsonString);
      sessionStorage.setItem(`kuppel_secure_${key}`, encrypted);
    } catch (error) {
      console.error('Failed to store user data securely');
      throw error;
    }
  },

  // Get user data securely with decryption
  getUserData: async (key: string): Promise<any> => {
    try {
      const encrypted = sessionStorage.getItem(`kuppel_secure_${key}`);
      if (!encrypted) return null;
      
      const decrypted = await decrypt(encrypted);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Failed to retrieve user data');
      // Clear corrupted data
      sessionStorage.removeItem(`kuppel_secure_${key}`);
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