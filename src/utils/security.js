/**
 * Utilidades de seguridad para NexBoard
 * Manejo seguro de contraseñas y datos sensibles
 */

// Función para generar un salt aleatorio
export const generateSalt = () => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Función para hash de contraseñas usando Web Crypto API
export const hashPassword = async (password, salt = null) => {
  if (!salt) {
    salt = generateSalt();
  }
  
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
  
  return {
    hash: hashHex,
    salt: salt,
    combined: `${hashHex}:${salt}`
  };
};

// Función para verificar contraseñas
export const verifyPassword = async (password, storedHash) => {
  try {
    const [hash, salt] = storedHash.split(':');
    if (!hash || !salt) {
      throw new Error('Formato de hash inválido');
    }
    
    const { hash: newHash } = await hashPassword(password, salt);
    return newHash === hash;
  } catch (error) {
    console.error('Error verificando contraseña:', error);
    return false;
  }
};

// Función para generar contraseñas seguras
export const generateSecurePassword = (length = 16, includeSymbols = true) => {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  let charset = lowercase + uppercase + numbers;
  if (includeSymbols) {
    charset += symbols;
  }
  
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset[array[i] % charset.length];
  }
  
  // Asegurar que tenga al menos un carácter de cada tipo
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = includeSymbols ? /[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(password) : true;
  
  if (!hasLower || !hasUpper || !hasNumber || !hasSymbol) {
    // Regenerar si no cumple los criterios
    return generateSecurePassword(length, includeSymbols);
  }
  
  return password;
};

// Función para evaluar la fortaleza de una contraseña
export const evaluatePasswordStrength = (password) => {
  let score = 0;
  let feedback = [];
  
  // Longitud
  if (password.length >= 12) {
    score += 2;
  } else if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('La contraseña debe tener al menos 8 caracteres');
  }
  
  // Minúsculas
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Incluye al menos una letra minúscula');
  }
  
  // Mayúsculas
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Incluye al menos una letra mayúscula');
  }
  
  // Números
  if (/[0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Incluye al menos un número');
  }
  
  // Símbolos
  if (/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Incluye al menos un símbolo especial');
  }
  
  // Patrones comunes (penalización)
  if (/123|abc|qwe|password|admin/i.test(password)) {
    score -= 2;
    feedback.push('Evita patrones comunes o palabras obvias');
  }
  
  // Determinar nivel de fortaleza
  let strength = 'muy_debil';
  let color = '#ff4444';
  
  if (score >= 5) {
    strength = 'muy_fuerte';
    color = '#00aa00';
  } else if (score >= 4) {
    strength = 'fuerte';
    color = '#66aa00';
  } else if (score >= 3) {
    strength = 'moderada';
    color = '#aaaa00';
  } else if (score >= 2) {
    strength = 'debil';
    color = '#aa6600';
  }
  
  return {
    score: Math.max(0, score),
    strength,
    color,
    feedback,
    percentage: Math.min(100, Math.max(0, (score / 6) * 100))
  };
};

// Función para encriptar datos sensibles para almacenamiento local
export const encryptForStorage = async (data, password) => {
  try {
    const encoder = new TextEncoder();
    const salt = generateSalt();
    
    // Derivar clave de la contraseña
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );
    
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode(salt),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );
    
    // Generar IV
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Encriptar datos
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(JSON.stringify(data))
    );
    
    // Combinar salt, iv y datos encriptados
    const result = {
      salt,
      iv: Array.from(iv),
      data: Array.from(new Uint8Array(encrypted))
    };
    
    return btoa(JSON.stringify(result));
  } catch (error) {
    console.error('Error encriptando datos:', error);
    throw new Error('Error en la encriptación');
  }
};

// Función para desencriptar datos del almacenamiento local
export const decryptFromStorage = async (encryptedData, password) => {
  try {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    // Decodificar datos
    const { salt, iv, data } = JSON.parse(atob(encryptedData));
    
    // Derivar clave de la contraseña
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );
    
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode(salt),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );
    
    // Desencriptar datos
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(iv) },
      key,
      new Uint8Array(data)
    );
    
    return JSON.parse(decoder.decode(decrypted));
  } catch (error) {
    console.error('Error desencriptando datos:', error);
    throw new Error('Error en la desencriptación o contraseña incorrecta');
  }
};

// Función para limpiar datos sensibles de la memoria
export const secureCleanup = (sensitiveData) => {
  if (typeof sensitiveData === 'string') {
    // Sobrescribir la cadena con caracteres aleatorios
    const length = sensitiveData.length;
    let cleaned = '';
    for (let i = 0; i < length; i++) {
      cleaned += String.fromCharCode(Math.floor(Math.random() * 256));
    }
    return cleaned;
  }
  
  if (Array.isArray(sensitiveData)) {
    // Sobrescribir el array
    for (let i = 0; i < sensitiveData.length; i++) {
      sensitiveData[i] = Math.floor(Math.random() * 256);
    }
  }
  
  if (typeof sensitiveData === 'object' && sensitiveData !== null) {
    // Limpiar propiedades del objeto
    Object.keys(sensitiveData).forEach(key => {
      if (typeof sensitiveData[key] === 'string') {
        sensitiveData[key] = secureCleanup(sensitiveData[key]);
      }
    });
  }
  
  return sensitiveData;
};

// Función para validar entrada y prevenir inyecciones
export const sanitizeInput = (input, maxLength = 1000) => {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Limitar longitud
  let sanitized = input.slice(0, maxLength);
  
  // Escapar caracteres peligrosos para HTML
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
  
  return sanitized;
};

// Función para generar tokens seguros
export const generateSecureToken = (length = 32) => {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

export default {
  generateSalt,
  hashPassword,
  verifyPassword,
  generateSecurePassword,
  evaluatePasswordStrength,
  encryptForStorage,
  decryptFromStorage,
  secureCleanup,
  sanitizeInput,
  generateSecureToken
};