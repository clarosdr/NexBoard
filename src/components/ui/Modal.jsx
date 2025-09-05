import React, { useEffect, useRef } from 'react';
import Button from './Button';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  showCloseButton = true,
  preventCloseOnOutsideClick = false,
  hasUnsavedChanges = false,
  onConfirmClose
}) => {
  const modalRef = useRef(null);
  const overlayRef = useRef(null);

  // Manejar clic fuera del modal
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current && !preventCloseOnOutsideClick) {
      if (hasUnsavedChanges) {
        // Mostrar confirmación si hay cambios sin guardar
        const shouldClose = window.confirm(
          '¿Estás seguro de que deseas salir? Los cambios no guardados se perderán.'
        );
        if (shouldClose) {
          if (onConfirmClose) {
            onConfirmClose();
          } else {
            onClose();
          }
        }
      } else {
        onClose();
      }
    }
  };

  // Manejar tecla Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        if (hasUnsavedChanges) {
          const shouldClose = window.confirm(
            '¿Estás seguro de que deseas salir? Los cambios no guardados se perderán.'
          );
          if (shouldClose) {
            if (onConfirmClose) {
              onConfirmClose();
            } else {
              onClose();
            }
          }
        } else {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevenir scroll del body cuando el modal está abierto
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, hasUnsavedChanges, onClose, onConfirmClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-full mx-4'
  };

  return (
    <div 
      ref={overlayRef}
      className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4"
      onClick={handleOverlayClick}
    >
      <div 
        ref={modalRef}
        className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-xl ${sizeClasses[size]} w-full max-h-[90vh] overflow-hidden flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            {title && (
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </h3>
            )}
            {showCloseButton && (
              <Button
                onClick={() => {
                  console.log('Modal close button clicked, hasUnsavedChanges:', hasUnsavedChanges);
                  if (hasUnsavedChanges) {
                    const shouldClose = window.confirm(
                      '¿Estás seguro de que deseas salir? Los cambios no guardados se perderán.'
                    );
                    if (shouldClose) {
                      console.log('Modal: User confirmed close');
                      if (onConfirmClose) {
                        console.log('Modal: Calling onConfirmClose');
                        onConfirmClose();
                      } else {
                        console.log('Modal: Calling onClose');
                        onClose();
                      }
                    } else {
                      console.log('Modal: User cancelled close');
                    }
                  } else {
                    console.log('Modal: No unsaved changes, calling onClose');
                    onClose();
                  }
                }}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label="Cerrar modal"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;