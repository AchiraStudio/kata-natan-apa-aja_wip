import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';
  children: React.ReactNode;
  footer?: React.ReactNode;
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
}

const MAX_WIDTH_CLASSES: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  icon,
  maxWidth = '2xl',
  children,
  footer,
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  className = '',
  headerClassName = '',
  bodyClassName = ''
}) => {
  const modalContentRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEscape, onClose]);

  if (!isOpen) return null;

  const maxWidthClass = MAX_WIDTH_CLASSES[maxWidth] || 'max-w-2xl';

  return (
    <div className="modal-overlay">
      {/* Centering Wrapper */}
      <div className="modal-centering-wrap">
        
        {/* Click-outside Backdrop with Blur */}
        <div
          className="modal-backdrop animate-in fade-in"
          onClick={closeOnBackdrop ? onClose : undefined}
          aria-hidden="true"
        />

        {/* Modal Window Container */}
        <div
          ref={modalContentRef}
          className={`modal-window ${maxWidthClass} animate-in fade-in zoom-in-95 duration-200 ${className}`}
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Optional Modal Header */}
          {(title || subtitle || icon || badge || showCloseButton) && (
            <div className={`modal-header ${headerClassName}`}>
              <div className="flex items-center gap-3 min-w-0">
                {icon && (
                  <div className="modal-icon-badge">
                    {icon}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {badge}
                    {title && (
                      <h3 className="modal-title-text">
                        {title}
                      </h3>
                    )}
                  </div>
                  {subtitle && (
                    <div className="modal-subtitle-text">
                      {subtitle}
                    </div>
                  )}
                </div>
              </div>

              {showCloseButton && (
                <button
                  type="button"
                  onClick={onClose}
                  className="modal-close-button"
                  aria-label="Tutup jendela"
                  title="Tutup"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Modal Body (Scrollable) */}
          <div className={`modal-body ${bodyClassName}`}>
            {children}
          </div>

          {/* Optional Modal Footer */}
          {footer && (
            <div className="modal-footer">
              {footer}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

