import React from 'react';
import { cn } from '../../utils';

/**
 * Button Component - Luxury Curator Design
 * Refined typography, strategic accent pops, and subtle micro-interactions.
 */
export default function Button({
    as: Component = 'button',
    children,
    variant = 'primary',
    size = 'md',
    className,
    isLoading = false,
    ...props
}) {
    const baseStyles = cn(
        "inline-flex items-center justify-center font-body transition-all duration-400 ease-[cubic-bezier(0.23,1,0.32,1)]",
        "active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none relative overflow-hidden group",
        "font-bold uppercase tracking-widest"
    );

    const variants = {
        primary: cn(
            "bg-primary text-page-bg hover:bg-black shadow-soft hover:shadow-float rounded-xl",
            "after:absolute after:inset-0 after:bg-white/10 after:opacity-0 hover:after:opacity-100 after:transition-opacity"
        ),
        secondary: "bg-surface-card text-text-main border border-border hover:border-text-subtle hover:bg-surface-hover rounded-xl",
        accent: "bg-accent text-page-bg hover:translate-y-[-1px] shadow-soft hover:shadow-float rounded-xl active:translate-y-0",
        outline: "border-2 border-primary text-primary hover:bg-primary hover:text-page-bg rounded-xl",
        ghost: "text-text-muted hover:text-primary hover:bg-accent-soft rounded-xl",
        minimal: "text-text-subtle hover:text-primary transition-colors duration-300 px-0 py-0",
        danger: "bg-red-500 text-white hover:bg-red-600 shadow-soft hover:shadow-float rounded-xl"
    };

    const sizes = {
        xs: "px-3 py-1.5 text-[10px] uppercase tracking-[0.15em]",
        sm: "px-4 py-2 text-xs font-semibold tracking-wide",
        md: "px-7 py-3.5 text-sm font-medium",
        lg: "px-10 py-5 text-base font-semibold",
        icon: "p-3 aspect-square",
    };

    return (
        <Component
            className={cn(baseStyles, variants[variant], sizes[size], className)}
            {...props}
        >
            {isLoading ? (
                <div className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Processing...</span>
                </div>
            ) : (
                <span className="relative z-10 flex items-center gap-2">
                    {children}
                </span>
            )}
            
            {/* Subtle Inner Glow on Hover for primary/accent */}
            {(variant === 'primary' || variant === 'accent') && (
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
            )}
        </Component>
    );
}
