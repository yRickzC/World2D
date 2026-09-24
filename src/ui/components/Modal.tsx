import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl';
  id?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  icon,
  children,
  footer,
  maxWidth = 'md',
  id = 'app-modal',
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    '6xl': 'max-w-6xl',
  }[maxWidth];

  return (
    <div
      id={`${id}-backdrop`}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150 select-none"
      onClick={onClose}
    >
      <div
        id={id}
        role="dialog"
        aria-modal="true"
        className={`w-full ${maxWidthStyles} bg-zinc-950 border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-zinc-100 animate-in zoom-in-95 duration-150`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        {(title || icon) && (
          <div className="flex items-center justify-between px-5 py-4 bg-zinc-900/90 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              {icon && (
                <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-amber-400">
                  {icon}
                </div>
              )}
              <div>
                {title && <h2 className="text-sm font-bold text-white tracking-wide">{title}</h2>}
                {description && <p className="text-xs text-zinc-400 mt-0.5">{description}</p>}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Fechar (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 p-5 overflow-y-auto">{children}</div>

        {/* Modal Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 bg-zinc-900/60 border-t border-zinc-800">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
