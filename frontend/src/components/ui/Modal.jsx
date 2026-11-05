import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import Button from './Button';

export function Modal({ open, title, onClose, children, footer }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full sm:max-w-lg max-h-[92vh] flex flex-col bg-white rounded-t-2xl sm:rounded-2xl shadow-xl"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 -mr-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-5 py-5 overflow-y-auto">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-slate-100 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Delete', loading, error, onConfirm, onCancel }) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={loading ? undefined : onCancel}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-slate-600">{message}</p>
      {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
    </Modal>
  );
}
