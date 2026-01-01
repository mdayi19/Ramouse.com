import React, { useEffect, useRef, memo } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from './Icon';

interface ModalProps {
  isOpen?: boolean; // Optional for backward compatibility
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
  mobileFullScreen?: boolean;
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
}

const Modal: React.FC<ModalProps> = memo(({
  isOpen = true, // Default to true for backward compatibility
  onClose,
  title,
  children,
  footer,
  size = 'md',
  mobileFullScreen = false,
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Size classes
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    full: 'max-w-full',
  };

  // Handle ESC key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center"
          onClick={handleBackdropClick}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95, y: mobileFullScreen ? '100%' : 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: mobileFullScreen ? '100%' : 20 }}
            transition={{ duration: 0.3, type: 'spring', damping: 25 } as const}
            className={`relative z-10 w-full mx-4 sm:mx-0 ${sizeClasses[size]} ${mobileFullScreen
              ? 'h-[95vh] sm:h-auto sm:max-h-[90vh] rounded-t-3xl sm:rounded-3xl'
              : 'max-h-[90vh] rounded-3xl'
              } bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden safe-area-padding-bottom`}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 sm:py-5 border-b border-slate-100 dark:border-slate-800">
                {title && (
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                    {title}
                  </h3>
                )}
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="touch-target -mr-2 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    aria-label="Close"
                  >
                    <Icon name="X" className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}

            {/* Content */}
            <div className="flex-grow p-4 sm:p-6 overflow-y-auto custom-scrollbar scroll-smooth-mobile overscroll-contain">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="flex-shrink-0 px-4 sm:px-6 py-4 bg-slate-50 dark:bg-slate-800/50 sm:rounded-b-3xl border-t border-slate-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row justify-end gap-3">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
});

Modal.displayName = 'Modal';

export default Modal;
