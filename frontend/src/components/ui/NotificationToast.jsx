import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, CheckCircle2, Coffee, MessageSquare } from 'lucide-react';

export default function NotificationToast({ notifications, onRemove }) {
  return (
    <div className="fixed bottom-12 right-12 z-[100] flex flex-col gap-5 pointer-events-none">
      <AnimatePresence>
        {notifications.map((notif) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, x: 60, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.3 } }}
            className="pointer-events-auto w-96 bg-white/10 backdrop-blur-md border border-white/20 rounded-[1.5rem] p-6 shadow-float flex items-start gap-5 relative overflow-hidden group transition-all duration-500 hover:shadow-glow"
          >
            {/* Architectural Highlight */}
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-accent shadow-[0_0_10px_rgba(var(--color-accent),0.5)]" />
            <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none" />
            
            <div className="w-12 h-12 rounded-xl bg-accent-soft/50 border border-accent/10 flex items-center justify-center shrink-0 shadow-inner-soft group-hover:bg-accent group-hover:text-page-bg transition-colors duration-500">
               <Coffee size={24} className="text-accent group-hover:text-page-bg transition-colors duration-500" />
            </div>

            <div className="flex-1 pr-6 flex flex-col gap-1.5">
              <p className="text-[9px] font-bold text-accent uppercase tracking-[0.3em] font-body opacity-80">Rhythmic Signal</p>
              <p className="text-xs font-bold text-text-main line-clamp-1 font-body uppercase tracking-tight">
                {notif.user} <span className="opacity-50 lowercase italic font-normal px-1">curated</span> {notif.cafe}
              </p>
              <p className="text-[10px] text-text-muted italic font-body opacity-80 leading-relaxed line-clamp-2 mt-1">
                "{notif.message}"
              </p>
            </div>

            <button 
                onClick={() => onRemove(notif.id)}
                className="p-1.5 text-text-subtle hover:text-accent transition-all duration-300 opacity-40 group-hover:opacity-100"
            >
              <X size={18} />
            </button>
            
            {/* Kinetic Progress Architecture */}
            <motion.div 
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 5, ease: "linear" }}
              className="absolute bottom-0 left-0 h-[2px] bg-accent/40 shadow-glow-accent"
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
