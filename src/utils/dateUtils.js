/**
 * Utilidades para manejo de fechas locales
 * Evita problemas de zona horaria al trabajar con fechas
 */

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD en zona horaria local
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export const getTodayLocalDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Convierte una fecha a formato YYYY-MM-DD en zona horaria local
 * @param {Date|string} date - Fecha a convertir
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export const toLocalDateString = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Obtiene timestamp actual en ISO string
 * @returns {string} Timestamp en formato ISO
 */
export const getCurrentTimestamp = () => {
  return new Date().toISOString();
};

/**
 * Obtiene una fecha futura en formato local
 * @param {number} days - Días a agregar
 * @returns {string} Fecha futura en formato YYYY-MM-DD
 */
export const getFutureDateLocal = (days) => {
  const future = new Date();
  future.setDate(future.getDate() + days);
  return toLocalDateString(future);
};