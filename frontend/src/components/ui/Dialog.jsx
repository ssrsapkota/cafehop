import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle } from 'lucide-react';
import Button from './Button';

/**
 * A premium, system-matching Dialog component.
 * 
 * @param {boolean} isOpen - Whether the dialog is visible.
 * @param {function} onClose - Function to call when the dialog wants to close.
 * @param {function} onConfirm - Function to call when the user confirms the action.
 * @param {string} title - The title of the dialog.
 * @param {string} message - The message/description for the user.
 * @param {string} confirmLabel - Label for the confirm button.
 * @param {string} cancelLabel - Label for the cancel button.
 * @param {string} variant - 'danger' or 'primary' (default).
 */
export default function Dialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirm Action", 
  message = "Are you sure you want to proceed?", 
  confirmLabel = "Confirm", 
  cancelLabel = "Discard",
  variant = "primary"
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 selection:bg-accent/30 selection:text-text-main">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-primary/20 backdrop-blur-md transition-all duration-500"
          />
          
          {/* Dialog Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-surface-card border border-border shadow-float overflow-hidden rounded-3xl"
          >
            {/* Subtle Gradient Header */}
            <div className={`absolute top-0 left-0 right-0 h-32 opacity-[0.05] pointer-events-none ${variant === 'danger' ? 'bg-red-500' : 'bg-accent'}`} />
            <div className="absolute inset-0 bg-noise opacity-[0.02] pointer-events-none" />
            
            <div className="relative p-10">
              <div className="flex flex-col items-center text-center gap-6">
                {/* Icon Wrapper */}
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border shadow-sm ${
                  variant === 'danger' 
                  ? 'bg-red-50 border-red-100 text-red-500' 
                  : 'bg-accent-soft border-accent/20 text-accent'
                }`}>
                  <AlertCircle size={32} strokeWidth={1.5} />
                </div>

                <div className="space-y-3">
                  <h3 className="text-2xl font-display font-medium text-text-main tracking-tight">
                    {title}
                  </h3>
                  <p className="text-sm text-text-muted leading-relaxed font-body max-w-[280px] mx-auto">
                    {message}
                  </p>
                </div>

                <div className="w-full flex flex-col gap-3 mt-4">
                  <Button 
                    variant={variant === 'danger' ? 'danger' : 'primary'}
                    className="w-full h-12 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em]"
                    onClick={() => {
                        onConfirm();
                        onClose();
                    }}
                  >
                    {confirmLabel}
                  </Button>
                  <button 
                    onClick={onClose}
                    className="w-full h-12 text-[10px] font-bold text-text-subtle hover:text-text-main hover:bg-surface-hover rounded-xl uppercase tracking-[0.2em] transition-all duration-300"
                  >
                    {cancelLabel}
                  </button>
                </div>
              </div>
            </div>

            {/* Absolute close button */}
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 text-text-subtle hover:text-text-main p-2 hover:bg-surface-hover rounded-xl transition-all"
            >
              <X size={20} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
