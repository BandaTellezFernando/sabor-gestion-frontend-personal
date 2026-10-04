'use client';

import React, { useEffect, useRef, useId } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './icon-button';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

const MAX_WIDTH_MAP = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descId = useId();

  // Guardar elemento que abrió el modal y restaurar foco al cerrar
  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement as HTMLElement;

      const timer = setTimeout(() => {
        if (modalRef.current) {
          const focusableSelector =
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
          const focusable = modalRef.current.querySelectorAll<HTMLElement>(focusableSelector);
          if (focusable.length > 0) {
            focusable[0].focus();
          }
        }
      }, 50);

      return () => {
        clearTimeout(timer);
        if (triggerRef.current && typeof triggerRef.current.focus === 'function') {
          triggerRef.current.focus();
        }
      };
    }
  }, [isOpen]);

  // Tecla Escape y Focus Trap (Tab y Shift+Tab)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusableSelector =
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(focusableSelector);
        const focusable = Array.from(focusableElements).filter(
          (el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true'
        );

        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement || !modalRef.current.contains(document.activeElement)) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement || !modalRef.current.contains(document.activeElement)) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Bloquear scroll del body mientras el modal esté visible
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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
    >
      {/* Backdrop con blur */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Caja del Modal */}
      <div
        ref={modalRef}
        className={`relative w-full ${MAX_WIDTH_MAP[maxWidth]} bg-white dark:bg-stone-900 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-800 z-10 transition-all duration-200 overflow-hidden my-auto`}
      >
        {/* Cabecera */}
        <div className="flex items-start justify-between p-5 border-b border-stone-100 dark:border-stone-800/80">
          <div>
            <h2 id={titleId} className="text-lg font-bold text-stone-900 dark:text-stone-50 leading-tight">
              {title}
            </h2>
            {description && (
              <p id={descId} className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                {description}
              </p>
            )}
          </div>
          <IconButton
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Cerrar ventana modal"
            title="Cerrar ventana"
            className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
          >
            <X className="w-4 h-4" />
          </IconButton>
        </div>

        {/* Contenido */}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
