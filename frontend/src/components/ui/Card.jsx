import React from 'react';
import { cn } from '../../utils';

/**
 * Card Component - Luxury Curator Design
 * Focus on surface depth, refined borders, and subtle lift-on-hover effects.
 */
const Card = ({
    children,
    variant = 'surface',
    hover = false,
    className = '',
    padding = 'md',
    interactive = false,
    ...props
}) => {
    const baseStyles = cn(
        'rounded-2xl border transition-all duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] overflow-hidden',
        interactive ? 'cursor-pointer' : ''
    );

    const variants = {
        surface: 'bg-surface-card border-border shadow-soft',
        glass: 'bg-white/10 backdrop-blur-md border border-white/20 shadow-soft',
        flat: 'bg-surface-hover border-transparent',
        raised: 'bg-surface-card border-border shadow-float',
        outline: 'bg-transparent border-primary/20 hover:border-primary/40',
        dark: 'bg-primary border-white/5 text-page-bg'
    };

    const hoverStyles = hover
        ? 'hover:shadow-float hover:-translate-y-1.5 hover:border-primary/10'
        : '';

    const paddings = {
        none: 'p-0',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
        xl: 'p-12'
    };

    return (
        <div
            className={cn(baseStyles, variants[variant], hoverStyles, paddings[padding], className)}
            {...props}
        >
            {children}
        </div>
    );
};

export default Card;
