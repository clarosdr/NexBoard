// Utilidades para estilos de botones unificados

// Estilos base para todos los botones
export const baseButtonStyles = `
  inline-flex items-center justify-center
  font-medium rounded-md
  focus:outline-none focus:ring-2 focus:ring-offset-2
  transition-all duration-200 ease-in-out
  disabled:opacity-50 disabled:cursor-not-allowed
  dark:focus:ring-offset-gray-900
`;

// Tamaños de botones
export const buttonSizes = {
  xs: 'px-2 py-1 text-xs',
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
  xl: 'px-8 py-4 text-lg'
};

// Variantes de botones
export const buttonVariants = {
  // Botón primario (azul)
  primary: `
    bg-blue-600 text-white
    hover:bg-blue-700 focus:ring-blue-500
    dark:bg-blue-600 dark:hover:bg-blue-700
  `,
  
  // Botón secundario (gris)
  secondary: `
    bg-gray-200 text-gray-900 border border-gray-400
    hover:bg-gray-300 focus:ring-gray-600
    dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600
    dark:hover:bg-gray-600
  `,
  
  // Botón de peligro (rojo)
  danger: `
    bg-red-600 text-white
    hover:bg-red-700 focus:ring-red-500
    dark:bg-red-600 dark:hover:bg-red-700
  `,
  
  // Botón de éxito (verde)
  success: `
    bg-green-600 text-white
    hover:bg-green-700 focus:ring-green-500
    dark:bg-green-600 dark:hover:bg-green-700
  `,
  
  // Botón de advertencia (amarillo)
  warning: `
    bg-yellow-500 text-white
    hover:bg-yellow-600 focus:ring-yellow-500
    dark:bg-yellow-600 dark:hover:bg-yellow-700
  `,
  
  // Botón fantasma (solo borde)
  ghost: `
    bg-transparent text-gray-700 border border-gray-300
    hover:bg-gray-50 focus:ring-gray-500
    dark:text-gray-300 dark:border-gray-600
    dark:hover:bg-gray-800
  `,
  
  // Botón de enlace (sin fondo)
  link: `
    bg-transparent text-blue-600 p-0
    hover:text-blue-700 focus:ring-blue-500
    dark:text-blue-400 dark:hover:text-blue-300
  `
};

// Función para generar clases de botón
export const getButtonClasses = (variant = 'primary', size = 'md', className = '') => {
  return `${baseButtonStyles} ${buttonVariants[variant]} ${buttonSizes[size]} ${className}`.trim();
};

// Estilos específicos para iconos en botones
export const buttonIconStyles = {
  left: '-ml-1 mr-2 h-4 w-4',
  right: 'ml-2 -mr-1 h-4 w-4',
  only: 'h-4 w-4'
};

export default {
  getButtonClasses,
  buttonSizes,
  buttonVariants,
  buttonIconStyles
};