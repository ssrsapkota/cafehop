import React from 'react';
import { cn } from '../../utils';

/**
 * Badge Component - Luxury Curator Design
 */
const Badge = ({ children, variant = 'success', className = '' }) => {
    const variants = {
        success: 'bg-green-100 text-green-800 border-green-200',
        warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        danger: 'bg-red-100 text-red-800 border-red-200',
        neutral: 'bg-surface-hover text-text-muted border-border',
        primary: 'bg-accent/10 text-accent border-accent/20'
    };

    return (
        <span className={cn(
            'px-3 py-1.5 rounded-full text-[9px] uppercase tracking-widest font-bold border shadow-sm inline-flex items-center justify-center',
            variants[variant],
            className
        )}>
            {children}
        </span>
    );
};

export default Badge;
